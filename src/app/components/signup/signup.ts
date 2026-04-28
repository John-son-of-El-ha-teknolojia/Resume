import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="min-h-screen bg-zinc-50 flex items-center justify-center p-6 font-sans">
      <mat-card class="w-full max-w-md !rounded-3xl shadow-2xl overflow-hidden border-none bg-white">
        <div class="h-2 bg-indigo-600"></div>
        
        <div class="p-8 pt-12">
          <!-- Step 1: User Info -->
          @if (step() === 'details') {
            <div role="form" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header class="text-center">
                <h1 class="text-3xl font-black text-zinc-900 tracking-tight mb-2">Create Account</h1>
                <p class="text-zinc-500 font-medium tracking-tight">Enter your professional details to get started.</p>
              </header>

              <form [formGroup]="signupForm" (ngSubmit)="goToVerification()" class="space-y-5">
                <div class="group">
                  <label for="fullName" class="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 pl-1 transition-colors group-focus-within:text-indigo-600">Full Name</label>
                  <input id="fullName" type="text" formControlName="name" placeholder="Curtis Ombai"
                         class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all placeholder:text-zinc-300">
                </div>

                <div class="group">
                  <label for="emailAddr" class="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 pl-1 transition-colors group-focus-within:text-indigo-600">Email Address</label>
                  <input id="emailAddr" type="email" formControlName="email" placeholder="curtis@example.com"
                         class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all placeholder:text-zinc-300">
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div class="group">
                    <label for="loc" class="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 pl-1 transition-colors group-focus-within:text-indigo-600">Location</label>
                    <input id="loc" type="text" formControlName="location" placeholder="Nairobi, KE"
                           class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all placeholder:text-zinc-300">
                  </div>
                  <div class="group">
                    <label for="occ" class="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 pl-1 transition-colors group-focus-within:text-indigo-600">Occupation</label>
                    <input id="occ" type="text" formControlName="role" placeholder="Architect"
                           class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-zinc-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all placeholder:text-zinc-300">
                  </div>
                </div>

                <button mat-flat-button [disabled]="signupForm.invalid" 
                        class="!bg-indigo-600 !text-white w-full h-14 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100 mt-4">
                  Continue
                </button>
              </form>

              <p class="text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                Already have an account? <a routerLink="/login" class="text-indigo-600 hover:underline">Sign In</a>
              </p>
            </div>
          }

          <!-- Step 2: Verification -->
          @if (step() === 'verify') {
            <div role="form" class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header class="text-center">
                <div class="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <mat-icon class="scale-150">shield_lock</mat-icon>
                </div>
                <h1 class="text-3xl font-black text-zinc-900 tracking-tight mb-2">Verify Identity</h1>
                <p class="text-zinc-500 font-medium tracking-tight px-4 text-sm">
                  We've sent a 6-digit code to <span class="font-bold text-zinc-900">{{ signupForm.get('email')?.value }}</span>
                </p>
              </header>

              <div class="space-y-6">
                <div class="flex justify-between gap-2 digit-container">
                  @for (i of [0,1,2,3,4,5]; track i) {
                    <input #digitInput type="text" maxlength="1" 
                           (input)="onDigitInput($event, i)"
                           (keydown.backspace)="onBackspace($event, i)"
                           class="w-12 h-14 bg-zinc-50 border-2 border-zinc-100 rounded-xl text-center text-xl font-black text-zinc-900 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all">
                  }
                </div>

                @if (error()) {
                  <p class="text-red-500 text-xs font-bold text-center bg-red-50 p-3 rounded-lg border border-red-100">{{ error() }}</p>
                }

                <div class="space-y-3">
                  <button mat-flat-button (click)="verifyCode()" [disabled]="loading() || digits.join('').length < 6"
                          class="!bg-indigo-600 !text-white w-full h-14 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-100">
                    {{ loading() ? 'Verifying...' : 'Verify & Continue' }}
                  </button>
                  <button mat-button (click)="step.set('details')" 
                          class="w-full !text-zinc-400 !font-black !uppercase !tracking-widest !text-[10px]">
                    Go Back
                  </button>
                </div>
              </div>

              <p class="text-center text-[10px] font-bold text-zinc-300 uppercase tracking-widest">
                Didn't receive a code? <button class="text-indigo-600 hover:underline">Resend</button>
              </p>
            </div>
          }
        </div>

        <div class="p-6 bg-zinc-50/50 border-t border-zinc-100 text-center">
          <p class="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-300">Secure Registration Gateway 2.0</p>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .digit-container input:focus {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.1);
    }
  `]
})
export class SignupComponent {
  private router = inject(Router);
  private resumeService = inject(ResumeService);

  step = signal<'details' | 'verify'>('details');
  loading = signal(false);
  error = signal<string | null>(null);
  digits: string[] = ['', '', '', '', '', ''];

  signupForm = new FormGroup({
    name: new FormControl('', [Validators.required]),
    email: new FormControl('', [Validators.required, Validators.email]),
    location: new FormControl('', [Validators.required]),
    role: new FormControl('', [Validators.required])
  });

  goToVerification() {
    if (this.signupForm.valid) {
      this.step.set('verify');
    }
  }

  onDigitInput(event: Event, index: number) {
    const target = event.target as HTMLInputElement;
    const val = target.value;
    if (val && index < 5) {
      const inputs = document.querySelectorAll('input[maxlength="1"]');
      (inputs[index + 1] as HTMLInputElement).focus();
    }
    this.digits[index] = val;
  }

  onBackspace(event: Event, index: number) {
    const target = event.target as HTMLInputElement;
    if (!target.value && index > 0) {
      const inputs = document.querySelectorAll('input[maxlength="1"]');
      (inputs[index - 1] as HTMLInputElement).focus();
    }
    this.digits[index] = '';
  }

  async verifyCode() {
    this.loading.set(true);
    this.error.set(null);
    
    // Simulate API delay
    await new Promise(r => setTimeout(r, 1000));
    
    const data = this.signupForm.value as Record<string, string | null>;
    const success = await this.resumeService.signup(data);
    
    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set('Signup failed. Please try again.');
    }
    this.loading.set(false);
  }
}
