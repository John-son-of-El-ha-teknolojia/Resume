import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ResumeService } from '../../services/resume';
import { PaymentDialogComponent } from '../payment/payment';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDividerModule, MatDialogModule],
  template: `
    <div class="resume-container">
      <header class="mb-10 text-center md:text-left">
        <h1 class="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tight">Account & Billing</h1>
        <p class="text-slate-500 font-medium tracking-tight">Monitor your profile and document status.</p>
      </header>

      <div class="grid grid-cols-1 md:grid-cols-12 gap-8">
        <!-- Profile Card -->
        <mat-card class="md:col-span-4 p-8 flex flex-col items-center !border-slate-200">
          <div class="w-28 h-28 bg-blue-50 border-4 border-blue-100 rounded-full flex items-center justify-center mb-6">
             <mat-icon class="text-blue-600 scale-[2.5]">fingerprint</mat-icon>
          </div>
          <h2 class="text-xl font-black text-slate-800 mb-1 uppercase tracking-tight">{{ resume().name || 'ADMIN-USER' }}</h2>
          <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 mb-6">{{ resume().email || 'AUTHENTICATED' }}</p>
          <button mat-stroked-button class="w-full !border-slate-200 !text-slate-600 font-bold text-sm h-12 rounded-xl">View Details</button>
        </mat-card>

        <!-- Subscription Card -->
        <mat-card class="md:col-span-8 p-0 overflow-hidden !border-slate-200">
          <div class="p-6 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
            <h2 class="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <mat-icon class="text-blue-600 text-sm">workspace_premium</mat-icon> Access Level
            </h2>
            @if (isPremium()) {
              <span class="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Premium Active</span>
            } @else {
               <span class="px-3 py-1 bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-full">Free Tier</span>
            }
          </div>
          
          <div class="p-8">
            <div class="flex items-center justify-between mb-10">
              <div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">Member Service</p>
                <h3 class="text-2xl font-black text-slate-800 uppercase tracking-tight">
                  @if (isPremium()) {
                    Executive Pro
                  } @else {
                    Global Free
                  }
                </h3>
                @if (hasFreeDownloadLeft()) {
                  <p class="text-[10px] text-emerald-600 font-bold uppercase mt-2">1 Free Export Remaining</p>
                }
              </div>
              
              @if (!isPremium()) {
                <button mat-flat-button class="!bg-blue-600 !text-white h-12 px-8 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-100" (click)="upgrade()">
                  Explore Plans
                </button>
              }
            </div>

            <div class="space-y-6">
              <h3 class="text-[10px] font-black tracking-widest uppercase text-slate-300">Available Tiers</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="p-4 border border-slate-100 rounded-xl bg-slate-50/30 text-center">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Rapid</p>
                  <div class="text-lg font-black text-slate-800">127 KES</div>
                  <p class="text-[8px] font-bold text-slate-300 uppercase">3 Days</p>
                </div>
                <div class="p-4 border-2 border-blue-100 rounded-xl bg-blue-50/10 text-center relative">
                  <div class="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-600 text-[8px] text-white px-2 py-0.5 rounded-full font-black uppercase">Popular</div>
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Professional</p>
                  <div class="text-lg font-black text-slate-800">498 KES</div>
                  <p class="text-[8px] font-bold text-slate-300 uppercase">1 Month</p>
                </div>
                <div class="p-4 border border-slate-100 rounded-xl bg-slate-50/30 text-center">
                  <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Executive</p>
                  <div class="text-lg font-black text-slate-800">1.2k KES</div>
                  <p class="text-[8px] font-bold text-slate-300 uppercase">Yearly</p>
                </div>
              </div>
            </div>
          </div>
        </mat-card>

        <!-- Drafts -->
        <div class="md:col-span-12 mt-4">
          <h2 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Archive & Drafts</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            <div class="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all group">
              <mat-icon class="text-slate-300 scale-150 mb-4 group-hover:text-blue-400 transition-colors">add_to_photos</mat-icon>
              <span class="text-[10px] uppercase font-black tracking-widest text-slate-400">Initialize New</span>
            </div>
            
            <div class="aspect-[3/4] bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative group overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl">
               <div class="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <div class="h-full flex flex-col justify-between">
                  <div>
                    <div class="h-4 w-12 bg-blue-100 rounded mb-4"></div>
                    <h4 class="text-sm font-black uppercase tracking-tight text-slate-800 truncate mb-1">Corporate_Draft_V1</h4>
                    <p class="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Saved 12h ago</p>
                  </div>
                  <div class="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                    <span>Restore</span>
                    <mat-icon class="text-sm">arrow_forward</mat-icon>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AccountComponent {
  private resumeService = inject(ResumeService);
  private dialog = inject(MatDialog);
  
  resume = this.resumeService.resumeState;
  isPaid = this.resumeService.isPaid;
  isPremium = this.resumeService.isPremium;
  hasFreeDownloadLeft = this.resumeService.hasFreeDownloadLeft;

  upgrade() {
    this.dialog.open(PaymentDialogComponent, {
      width: '500px',
      maxWidth: '95vw'
    });
  }
}
