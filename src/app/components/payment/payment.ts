import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-payment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule
  ],
  template: `
    <div class="p-8 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-8">
        <h2 mat-dialog-title class="m-0 text-2xl font-black text-slate-800 uppercase tracking-tight">Unlock Premium</h2>
        <button mat-icon-button (click)="close()" class="text-zinc-400"><mat-icon>close</mat-icon></button>
      </div>
      
      <mat-dialog-content class="!p-0 border-none">
        <div class="pb-8">
           <div class="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
             <mat-icon class="text-blue-600 scale-150">workspace_premium</mat-icon>
           </div>
           <p class="text-slate-500 font-medium mb-8 leading-relaxed text-center">
             Choose a plan to download your resume in high-quality PDF format and access premium features.
           </p>
           
           <div class="space-y-3 mb-8">
             @for (tier of tiers; track tier.id) {
               <div (click)="selectedTier.set(tier)" 
                    (keydown.enter)="selectedTier.set(tier)"
                    tabindex="0"
                    class="p-4 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between outline-none focus:ring-2 focus:ring-blue-300"
                    [class.border-blue-600]="selectedTier().id === tier.id"
                    [class.bg-blue-50]="selectedTier().id === tier.id"
                    [class.border-slate-100]="selectedTier().id !== tier.id">
                 <div>
                   <h4 class="font-black text-slate-800 uppercase tracking-tight">{{ tier.name }}</h4>
                   <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{{ tier.description }}</p>
                 </div>
                 <div class="text-right">
                   <div class="text-lg font-black text-blue-600">{{ tier.priceKES }} KES</div>
                   <div class="text-[8px] text-slate-400 font-bold">~ {{ tier.priceUSD }} USD</div>
                 </div>
               </div>
             }
           </div>
           
           <div class="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
             <div class="flex items-center gap-3 mb-4">
               <img src="https://upload.wikimedia.org/wikipedia/commons/1/15/M-PESA_LOGO-01.svg" alt="M-Pesa" class="h-8 grayscale opacity-40">
               <span class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Secure Checkout</span>
             </div>
             
             <div class="space-y-1 text-left">
               <label for="mpesa-phone" class="text-[10px] font-black uppercase tracking-widest text-slate-400 pl-1">Phone Number</label>
               <input id="mpesa-phone" class="w-full text-base font-semibold border border-slate-200 rounded-xl p-4 bg-white focus:outline-none focus:border-blue-300 transition-all" 
                      [(ngModel)]="phoneNumber" placeholder="07xxxxxxxx" type="tel">
             </div>
           </div>

           @if (error()) {
             <div class="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl mb-6 flex items-center gap-2 border border-red-100">
               <mat-icon class="text-sm">error_outline</mat-icon> {{ error() }}
             </div>
           }
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="flex flex-col gap-4 !p-0 border-none">
        <button mat-flat-button class="!bg-blue-600 !text-white w-full h-14 rounded-xl text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-100" 
                [disabled]="processing() || !phoneNumber" (click)="pay()">
          @if (processing()) {
            <ng-container>
              <mat-icon class="animate-spin mr-2">sync</mat-icon> Authenticating...
            </ng-container>
          } @else {
            <ng-container>
              Pay {{ selectedTier().priceKES }} KES
            </ng-container>
          }
        </button>
        <p class="text-[10px] font-bold text-zinc-400 text-center uppercase tracking-widest w-full">Secure payment powered by Intasend</p>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host { display: block; }
    ::ng-deep .mat-mdc-dialog-container { border-radius: 1.5rem !important; overflow: hidden !important; }
    ::ng-deep .mat-mdc-dialog-surface { border-radius: 1.5rem !important; box-shadow: 0 25px 50px -12px rgb(0 0 0 / 0.25) !important; }
  `]
})
export class PaymentDialogComponent {
  private dialogRef = inject(MatDialogRef<PaymentDialogComponent>);
  private resumeService = inject(ResumeService);

  tiers = [
    { id: '2w', name: '2 Weeks Access', priceKES: 210, priceUSD: '$1.59', description: 'Immediate Premium Access' },
    { id: '1m', name: 'Monthly Pro', priceKES: 400, priceUSD: '$2.99', description: 'Strategic Planning Plan' },
    { id: '1y', name: 'Annual Studio', priceKES: 1000, priceUSD: '$7.59', description: 'Executive Suite Access' }
  ];

  selectedTier = signal(this.tiers[1]);
  phoneNumber = '';
  processing = signal(false);
  error = signal<string | null>(null);

  close() {
    this.dialogRef.close();
  }

  async pay() {
    this.processing.set(true);
    this.error.set(null);
    
    try {
      const tier = this.selectedTier();
      const response = await this.resumeService.initiatePayment(this.phoneNumber, tier.id, tier.priceKES);
      if (response.success) {
        this.dialogRef.close(true);
        this.resumeService.downloadPdf();
      } else {
        this.error.set('Payment failed. Please try again.');
      }
    } catch {
      this.error.set('An error occurred during payment.');
    } finally {
      this.processing.set(false);
    }
  }
}

