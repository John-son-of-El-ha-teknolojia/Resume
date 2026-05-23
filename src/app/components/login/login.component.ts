import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private readonly API_BASE = 'https://resume-backend-plmv.onrender.com';

  email = '';
  password = '';
  loginError: string | null = null;
  loading = false;
  showPassword = signal(false);

  // signals for session state
  isLoggedIn = signal(false);
  userEmail = signal<string | null>(null);
  isAdmin = signal(false);
  isPremium = signal(false);
  hasFreeDownloadLeft = signal(false);

  private http = inject(HttpClient);
  private router = inject(Router);

  async onLogin() {
    this.loading = true;
    this.loginError = null;
    console.time('loginRequest');

    try {
      const response = await firstValueFrom(
        this.http.post<{ token: string; email: string; isAdmin: boolean; tier?: string }>(
          `${this.API_BASE}/api/auth/login`,
          { email: this.email, password: this.password },
          { observe: 'body' }
        ).pipe(timeout(15000))
      );

      console.log('[Login] Success for', response.email);

      // ✅ Save JWT in localStorage
      localStorage.setItem('jwt', response.token);

      // hydrate signals
      this.isLoggedIn.set(true);
      this.userEmail.set(response.email);
      this.isAdmin.set(response.isAdmin);
      this.isPremium.set(!!response.tier);

      console.timeEnd('loginRequest');

      // run eligibility check immediately
      await this.checkEligibility();

      // navigate after login
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      console.timeEnd('loginRequest');
      console.error('Login failed or timed out:', err);
      this.loginError = err.error?.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  async checkEligibility(): Promise<void> {
    const token = localStorage.getItem('jwt');
    if (!token) {
      console.error('No token found');
      return;
    }

    try {
      console.time('checkEligibility');
      const res = await firstValueFrom(
        this.http.post<{ canDownload: boolean; isPremium: boolean; hasFreeDownloadLeft: boolean }>(
          `${this.API_BASE}/api/resume/check-eligibility`,
          { email: this.userEmail() },
          { headers: { Authorization: `Bearer ${token}` } }
        ).pipe(timeout(15000))
      );
      console.timeEnd('checkEligibility');

      const premiumTiers = ['1y', '1m', '2w'];
      const isPremium = (res.isPremium || premiumTiers.includes(this.isPremium() ? 'premium' : ''));

      this.isPremium.set(isPremium);
      this.hasFreeDownloadLeft.set(res.hasFreeDownloadLeft);

      console.log('Eligibility refreshed:', res);
    } catch (error) {
      console.error('Eligibility check failed:', error);
      this.isPremium.set(false);
      this.hasFreeDownloadLeft.set(false);
    }
  }
}
