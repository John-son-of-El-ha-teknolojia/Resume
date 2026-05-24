import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ResumeService } from '../../services/resume';
import { SafeUrlPipe } from '../../pipes/safeUrl.pipe'
import { PaymentDialogComponent } from '../payment/payment';
import { MatDialog } from '@angular/material/dialog';
// import path from 'path';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, SafeUrlPipe],
  template: `
<div class="min-h-screen bg-zinc-50 flex flex-col">
  <main class="flex-1 max-w-7xl mx-auto w-full p-8 space-y-12">
    <!-- Header -->
    <header class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-black uppercase tracking-widest text-zinc-900">User Dashboard</h1>
        <p class="text-zinc-500 font-medium letter-spacing-tight">Manage your creative career assets</p>
      </div>

      <!-- Desktop Account Button -->
      <div class="hidden md:flex gap-4">
        <button mat-flat-button color="primary"
                class="!rounded-2xl h-12 !px-8 !font-black !uppercase !tracking-widest"
                routerLink="/account">
          Account & Subscription
        </button>
      </div>

      <!-- Mobile Icons -->
      <div class="flex md:hidden items-center gap-3">
        <!-- Account Icon -->
        <button routerLink="/account"
                class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
          <mat-icon>person</mat-icon>
        </button>
      </div>
    </header>

    <!-- Main Actions -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
      <!-- Resume Builder Card -->
      <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100 flex flex-col gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer" routerLink="/writer">
        <div class="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center text-white rotate-3 group-hover:rotate-6 transition-transform">
          <mat-icon class="scale-[1.5]">description</mat-icon>
        </div>
        <div>
          <h2 class="text-2xl font-black uppercase tracking-widest mb-2">Resume Studio</h2>
          <p class="text-zinc-500 line-clamp-2">Craft stunning, AI-enhanced resumes using our professional studio tools from scratch.</p>
        </div>
        <div class="mt-auto pt-4 flex items-center gap-2 text-zinc-900 font-bold uppercase tracking-wider text-xs">
          Open Studio <mat-icon class="text-sm">arrow_forward</mat-icon>
        </div>
      </div>

      <!-- PDF Editor Card -->
      <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100 flex flex-col gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer border-indigo-100/50" 
           (click)="openPdfEditor()">
        <div class="w-16 h-16 bg-indigo-600 rounded-3xl flex items-center justify-center text-white scale-110 group-hover:rotate-6 transition-transform">
          <mat-icon class="scale-[1.5]">picture_as_pdf</mat-icon>
        </div>
        <div>
          <div class="flex items-center gap-2 mb-2">
            <h2 class="text-2xl font-black uppercase tracking-widest">PDF AI Editor</h2>
            <span class="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[8px] font-black uppercase rounded-full">New</span>
          </div>
          <p class="text-zinc-500 line-clamp-2">Import an existing PDF resume. AI will deconstruct it, allowing you to edit and re-export instantly.</p>
        </div>
        <div class="mt-auto pt-4 flex items-center gap-2 text-indigo-600 font-bold uppercase tracking-wider text-xs">
          Deconstruct PDF <mat-icon class="text-sm">history_edu</mat-icon>
        </div>
      </div>

      <!-- Cover Letter Card -->
      <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100 flex flex-col gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer" 
           (click)="openCoverLetter()">
        <div class="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white -rotate-3 group-hover:-rotate-6 transition-transform">
          <mat-icon class="scale-[1.5]">auto_awesome</mat-icon>
        </div>
        <div>
          <h2 class="text-2xl font-black uppercase tracking-widest mb-2">Cover Letter AI</h2>
          <p class="text-zinc-500 line-clamp-2">Upload a job ad and let our AI agents draft a professional cover letter specifically for that role.</p>
        </div>
        <div class="mt-auto pt-4 flex items-center gap-2 text-blue-600 font-bold uppercase tracking-wider text-xs">
          Craft Letter <mat-icon class="text-sm">arrow_forward</mat-icon>
        </div>
      </div>

      <!-- Job Search Engine Card -->
      <div class="bg-white p-10 rounded-[2.5rem] shadow-sm border border-zinc-100 flex flex-col gap-6 group hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer" 
           (click)="openJobSearch()">
        <div class="w-16 h-16 bg-green-600 rounded-3xl flex items-center justify-center text-white group-hover:rotate-6 transition-transform">
          <mat-icon class="scale-[1.5]">work</mat-icon>
        </div>
        <div>
          <h2 class="text-2xl font-black uppercase tracking-widest mb-2">Job Search Engine</h2>
          <p class="text-zinc-500 line-clamp-2">Discover tailored job opportunities and integrate them with your resume workflow.</p>
        </div>
        <div class="mt-auto pt-4 flex items-center gap-2 text-green-600 font-bold uppercase tracking-wider text-xs">
          Explore Jobs <mat-icon class="text-sm">arrow_forward</mat-icon>
        </div>
      </div>
    </div>

<!-- Free Templates -->
<section class="space-y-8">
  <div class="flex items-center justify-between border-b border-zinc-200 pb-4">
    <h3 class="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Available Templates</h3>
    <span class="text-[10px] font-bold text-zinc-400 uppercase">3 Professional Frameworks</span>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
    <div *ngFor="let tmpl of frameworks; trackBy: trackById"
         class="bg-white border border-zinc-100 rounded-[2rem] overflow-hidden group cursor-pointer"
         (click)="selectTemplate(tmpl.id)">
      <div class="aspect-[3/4] bg-zinc-50 p-6 overflow-hidden flex items-center justify-center relative">
        <div class="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/20 transition-all duration-500 flex items-center justify-center">
          <button mat-flat-button
                  class="!bg-white !text-zinc-900 !rounded-full !px-6 !font-black !uppercase !tracking-widest opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all">
            Select
          </button>
        </div>

        <!-- Mock template visual -->
        <div class="w-full h-full bg-white shadow-2xl rounded-sm p-4 space-y-2 opacity-80 scale-90 group-hover:scale-100 transition-transform duration-500">
          <ng-container *ngIf="resumeService.isLoggedIn">
            <img src="https://res.cloudinary.com/dxvwfibhj/image/upload/v1778915357/EliteSuitesLogo_rqpdsy.png"
                 alt="{{ tmpl.name }} preview"
                 class="w-full h-40 rounded border border-zinc-200 shadow-2xl opacity-80 scale-90 group-hover:scale-100 transition-transform duration-500" />
            <div class="pt-2">
              <p class="text-sm font-bold text-zinc-800">{{ tmpl.name }}</p>
              <p class="text-xs text-zinc-500">{{ tmpl.tag }}</p>
            </div>
          </ng-container>
        </div>
      </div>

      <div class="p-6">
        <h4 class="font-black uppercase tracking-widest text-sm">{{ tmpl.name }}</h4>
        <p class="text-zinc-400 text-[10px] uppercase font-bold mt-1">{{ tmpl.tag }}</p>
      </div>
    </div>
  </div>
</section>

      </main>
    </div>
  `
})
export class DashboardComponent {
  resumeService = inject(ResumeService);
  private router = inject(Router);
  private dialog = inject(MatDialog);   // ✅ inject dialog

  mobileMenuOpen = false;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
trackById(_index: number, item: any): string {
  return item.id;
}


  frameworks = [
    { id: 'minimal', name: 'Swiss Minimalist', tag: 'Professional', path: 'assets/CEO.html' },
    { id: 'modern', name: 'Bento Modern', tag: 'Creative', path: 'assets/modern.html' },
    { id: 'classic', name: 'Ivy League', tag: 'Academic', path: 'assets/minimal.html' }
  ];

  selectTemplate(id: string) {
  this.resumeService.currentTemplate.set(id as any);
  this.resumeService.loadTemplate(id);   // ✅ use id, not path
  this.router.navigate(['/writer']);
}

openPdfEditor() {
  const userTier = this.resumeService.getCurrentTier();
  if (userTier && userTier !== 'free') {
    this.router.navigate(['/pdf-editor']);
  } else {
    this.dialog.open(PaymentDialogComponent, { width: '600px', disableClose: true });
  }
}

openCoverLetter() {
  const userTier = this.resumeService.getCurrentTier();
  if (userTier && userTier !== 'free') {
    this.router.navigate(['/cover-letter']);
  } else {
    this.dialog.open(PaymentDialogComponent, { width: '600px', disableClose: true });
  }
}

openJobSearch() {
  const userTier = this.resumeService.getCurrentTier();
  if (userTier && userTier !== 'free') {
    this.router.navigate(['/job-search']);   // ✅ route to your microservice
  } else {
    this.dialog.open(PaymentDialogComponent, { width: '600px', disableClose: true });
  }
}




}
