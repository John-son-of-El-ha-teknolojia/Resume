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
import { ResumeService } from '../../services/resume';

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

  private http = inject(HttpClient);
  private router = inject(Router);
  resumeService = inject(ResumeService); // ✅ inject service

  async onLogin() {
    this.loading = true;
    this.loginError = null;
    console.time('loginRequest');

    try {
      const response = await firstValueFrom(
        this.http.post<{ token: string; user_id: string; email: string; isAdmin: boolean; tier?: string }>(
          `${this.API_BASE}/api/auth/login`,
          { email: this.email, password: this.password },
          { observe: 'body' }
        ).pipe(timeout(15000))
      );

      console.log('[Login] Success for', response.email);

      localStorage.setItem('jwt', response.token);

      // ✅ Update ResumeService BehaviorSubjects
      this.resumeService.isLoggedInSubject.next(true);
      this.resumeService.userEmailSubject.next(response.email);
      this.resumeService.isAdminSubject.next(response.isAdmin);
      this.resumeService.isPremiumSubject.next(!!response.tier);

      console.timeEnd('loginRequest');
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
