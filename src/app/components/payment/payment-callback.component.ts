import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ResumeService } from '../../services/resume';
import { CommonModule } from '@angular/common'; 


@Component({
  selector: 'app-payment-callback',
  standalone: true,
   imports: [CommonModule],
  template: `
    <div class="p-8 text-center">
      <h2 class="text-2xl font-black mb-4">Payment Verification</h2>

      <p *ngIf="loading()">Verifying your payment...</p>
      <p *ngIf="error()">{{ error() }}</p>

      <div *ngIf="success()">
        <p class="text-emerald-600 font-bold mb-6">Payment successful! 🎉</p>
        <button mat-flat-button class="!bg-blue-600 !text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest"
                (click)="goToAccount()">
          Go to Account
        </button>
      </div>
    </div>
  `
})
export class PaymentCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private resumeService = inject(ResumeService);
  private router = inject(Router);

  loading = signal(true);
  error = signal<string | null>(null);
  success = signal(false);

  ngOnInit() {
    const reference = this.route.snapshot.queryParamMap.get('reference');
    if (!reference) {
      this.error.set('Missing payment reference.');
      this.loading.set(false);
      return;
    }

    this.resumeService.verifyPayment(reference)
      .then(res => {
        if (res.success) {
          this.success.set(true);

          const tier = this.route.snapshot.queryParamMap.get('tierId')??''; // pass tier from initiate
          const email = this.resumeService.getCurrentUserEmail();

          if (!email) {
            this.error.set('No user email found. Please log in again.');
            return;
          }
          // Update user subscription in backend
          this.resumeService.updateUserSubscription(email, tier)
          .then(() => this.resumeService.loadUser(email)) // refresh profile
          .then(user => {
            // update signals so AccountComponent reflects immediately
            this.resumeService.isPremium.set(user.tier !== 'free');
            this.resumeService.hasFreeDownloadLeft.set(user.tier === 'free');
          })
            .catch(() => console.error("Failed to update subscription"));

        } else {
          this.error.set('Payment verification failed.');
        }
      })
      .catch(() => {
        this.error.set('Error contacting server.');
      })
      .finally(() => {
        this.loading.set(false);
      });
  }

  goToAccount() {
  if (this.resumeService.isLoggedIn()) {
    this.router.navigate(['/account']);
  } else {
    this.router.navigate(['/login']);
  }
}

}
