import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';

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
  email = '';
  password = '';
  loginError: string | null = null;
  loading = false;
  showPassword = signal(false);

  private http = inject(HttpClient);
  private router = inject(Router);

  async onLogin() {
    this.loading = true;
    this.loginError = null;

    try {
      const resp = await this.http.post<any>(
        '/api/auth/login',
        { email: this.email, password: this.password },
        { withCredentials: true } // ✅ ensures JWT cookie is stored
      ).toPromise();

      if (resp && resp.token) {
        // Navigate after login success
        this.router.navigate(['/dashboard']);
      } else {
        this.loginError = 'Incorrect email or password';
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      this.loginError = err.error?.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }
}
