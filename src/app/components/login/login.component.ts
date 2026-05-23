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
  private readonly API_BASE = 'https://resume-backend-plmv.onrender.com'; // ✅ backend base URL

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

  private http = inject(HttpClient);
  private router = inject(Router);

  async onLogin() {
    this.loading = true;
    this.loginError = null;
    console.time('loginRequest');

    try {
      const response = await firstValueFrom(
        this.http.post<{ email: string; isAdmin: boolean; tier?: string }>(
          `${this.API_BASE}/api/auth/login`,
          { email: this.email, password: this.password },
          { observe: 'body', withCredentials: true }
        ).pipe(timeout(15000))
      );

      console.log('[Login] Success for', response.email);

      // hydrate signals
      this.isLoggedIn.set(true);
      this.userEmail.set(response.email);
      this.isAdmin.set(response.isAdmin);
      this.isPremium.set(!!response.tier);

      console.timeEnd('loginRequest');

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
}
