import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatButtonModule, MatInputModule, MatIconModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <mat-card class="w-full max-w-md p-8 !rounded-3xl !border-none shadow-2xl">
        <div class="text-center mb-10">
          <div class="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-200">
            <mat-icon class="text-white scale-150">auto_awesome</mat-icon>
          </div>
          <h1 class="text-3xl font-black text-slate-800 uppercase tracking-tight">Welcome Back</h1>
          <p class="text-slate-400 font-medium mt-2">Sign in to continue your professional journey.</p>
        </div>

        <form (ngSubmit)="onLogin()" class="space-y-6">
          <div class="space-y-1">
            <label for="email" class="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Email</label>
            <input id="email" name="email" [(ngModel)]="email" type="email" placeholder="curtisombai@gmail.com"
                   class="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-800 font-bold focus:outline-none focus:border-blue-400 transition-all">
          </div>

          <div class="space-y-1">
            <label for="password" class="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Password</label>
            <input id="password" name="password" [(ngModel)]="password" type="password" placeholder="••••••••"
                   class="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-slate-800 font-bold focus:outline-none focus:border-blue-400 transition-all">
          </div>

          @if (error()) {
            <p class="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-lg border border-red-100">{{ error() }}</p>
          }

          <button mat-flat-button class="!bg-blue-600 !text-white w-full h-14 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-100"
                  [disabled]="loading()">
            @if (loading()) {
              <ng-container>
                <mat-icon class="animate-spin mr-2">sync</mat-icon> Verifying...
              </ng-container>
            } @else {
              <ng-container>
                Sign In
              </ng-container>
            }
          </button>
        </form>

        <p class="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-8">Professional Resume Builder v2.0</p>
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class LoginComponent {
  private resumeService = inject(ResumeService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  async onLogin() {
    if (!this.email || !this.password) {
      this.error.set('Please fill all fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const success = await this.resumeService.login(this.email, this.password);
    if (success) {
      if (this.resumeService.isAdmin()) {
        this.router.navigate(['/admin']);
      } else {
        this.router.navigate(['/writer']);
      }
    } else {
      this.error.set('Invalid credentials');
    }
    this.loading.set(false);
  }
}
