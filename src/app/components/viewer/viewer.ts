import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ResumeService } from '../../services/resume';
import { PaymentDialogComponent } from '../payment/payment';

@Component({
  selector: 'app-viewer',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatButtonToggleModule,
    MatDialogModule
  ],
  template: `
    <div class="resume-container pb-24">
      <header class="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
        <div class="text-center md:text-left">
          <h1 class="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tight">Final Preview</h1>
          <p class="text-slate-500 font-medium">Select a refined template for your document.</p>
        </div>
        
        <div class="flex flex-wrap justify-center items-center gap-4 bg-white/50 p-2 rounded-2xl border border-slate-200 backdrop-blur-sm">
           <div class="hidden sm:block text-[10px] uppercase font-black text-slate-400 mx-2 tracking-widest">Aesthetic</div>
           <mat-button-toggle-group [value]="template()" (change)="template.set($event.value)" color="primary" class="!border-none !shadow-none">
            <mat-button-toggle value="minimal" class="!rounded-lg">Minimal</mat-button-toggle>
            <mat-button-toggle value="modern" class="!rounded-lg">Modern</mat-button-toggle>
            <mat-button-toggle value="classic" class="!rounded-lg">Classic</mat-button-toggle>
          </mat-button-toggle-group>
          
          <div class="w-px h-6 bg-slate-200 hidden sm:block"></div>
          
          <button mat-flat-button class="!bg-blue-600 !text-white h-10 px-6 rounded-lg font-bold shadow-lg shadow-blue-100" (click)="exportPdf()">
            <mat-icon class="mr-1">download</mat-icon> Export
          </button>
          
          @if (isPremium()) {
            <button mat-stroked-button class="!border-slate-200 !text-slate-600 h-10 px-4 rounded-lg font-bold" (click)="shareLink()">
              <mat-icon class="text-sm">share</mat-icon>
            </button>
          }
        </div>
      </header>

      <!-- Resume Canvas -->
      <div class="bg-white shadow-2xl rounded-sm overflow-hidden min-h-[1100px] border border-slate-100 max-w-4xl mx-auto" [ngClass]="'template-' + template()">
        
        <!-- Minimal Template -->
        @if (template() === 'minimal') {
          <div class="p-16 font-sans space-y-12">
            <header class="text-center">
              <h1 class="text-5xl font-black tracking-tighter text-slate-900 mb-4">{{ resume().name || 'JONATHAN DOE' }}</h1>
              <div class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <span>{{ resume().email }}</span>
                <span>•</span>
                <span>{{ resume().phone }}</span>
                <span>•</span>
                <span>{{ resume().location }}</span>
              </div>
            </header>

            <section class="max-w-2xl mx-auto text-center">
              <p class="text-lg leading-relaxed text-slate-600 font-medium italic">"{{ resume().summary }}"</p>
            </section>

            <div class="space-y-12">
              @for (section of resume().sections; track section.id) {
                <section>
                  <h3 class="text-xs font-black tracking-[0.3em] uppercase text-slate-300 mb-6 flex items-center gap-4">
                    {{ section.title }}
                    <span class="flex-1 h-px bg-slate-100"></span>
                  </h3>
                  <div class="whitespace-pre-wrap text-slate-700 leading-relaxed pl-4 border-l-2 border-slate-50">{{ section.content }}</div>
                </section>
              }
            </div>
          </div>
        }

        <!-- Modern Template -->
        @if (template() === 'modern') {
          <div class="flex flex-col min-h-inherit font-sans">
            <header class="p-12 border-b-8 border-blue-600 bg-slate-50">
              <h1 class="text-4xl font-black text-slate-800 tracking-tighter mb-2 uppercase">{{ resume().name || 'JONATHAN DOE' }}</h1>
              <p class="text-blue-600 font-black tracking-[0.2em] text-xs uppercase mb-6">Expert Executive</p>
              <div class="flex flex-wrap gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span class="flex items-center gap-1"><mat-icon class="text-[14px] w-4 h-4">location_on</mat-icon> {{ resume().location }}</span>
                <span class="flex items-center gap-1"><mat-icon class="text-[14px] w-4 h-4">email</mat-icon> {{ resume().email }}</span>
                <span class="flex items-center gap-1"><mat-icon class="text-[14px] w-4 h-4">phone</mat-icon> {{ resume().phone }}</span>
              </div>
            </header>

            <div class="p-12 grid grid-cols-12 gap-12">
              <aside class="col-span-12 md:col-span-4 space-y-10">
                <section>
                  <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Profile</h3>
                  <p class="text-xs text-slate-600 leading-relaxed">{{ resume().summary }}</p>
                </section>

                @for (section of resume().sections.slice(2); track section.id) {
                  <section>
                    <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">{{ section.title }}</h3>
                    <div class="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{{ section.content }}</div>
                  </section>
                }
              </aside>
              
              <main class="col-span-12 md:col-span-8 space-y-10">
                @for (section of resume().sections.slice(0, 2); track section.id) {
                  <section>
                    <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-3">
                      <span class="w-8 h-1 bg-blue-600"></span>
                      {{ section.title }}
                    </h3>
                    <div class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pl-11">{{ section.content }}</div>
                  </section>
                }
              </main>
            </div>
          </div>
        }

        <!-- Classic Template -->
        @if (template() === 'classic') {
          <div class="p-20 font-serif space-y-10 text-slate-800">
            <header class="text-center space-y-4">
              <h1 class="text-5xl font-bold tracking-tight mb-2">{{ resume().name || 'Jonathan Doe' }}</h1>
              <div class="text-xs font-medium tracking-widest uppercase text-slate-400 border-y border-slate-100 py-3">
                {{ resume().email }} &bull; {{ resume().phone }} &bull; {{ resume().location }}
              </div>
            </header>

            <section>
              <h2 class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 text-center mb-6">Executive Summary</h2>
              <p class="leading-relaxed text-center max-w-2xl mx-auto italic text-lg text-slate-600">"{{ resume().summary }}"</p>
            </section>

            <div class="space-y-10">
              @for (section of resume().sections; track section.id) {
                <section>
                  <h2 class="text-xs font-black uppercase tracking-[0.2em] border-b-2 border-slate-800 pb-2 mb-6">{{ section.title }}</h2>
                  <div class="whitespace-pre-wrap leading-relaxed text-slate-700">{{ section.content }}</div>
                </section>
              }
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .min-h-inherit { min-height: inherit; }
    mat-button-toggle-group { @apply bg-transparent !important; }
    .mat-button-toggle-checked { @apply !bg-slate-900 !text-white rounded-lg !important; }
    .mat-button-toggle { @apply text-slate-500 font-bold transition-all !border-none !important; }
  `]
})
export class ViewerComponent {
  private resumeService = inject(ResumeService);
  private dialog = inject(MatDialog);
  
  resume = this.resumeService.resumeState;
  template = signal<'minimal' | 'modern' | 'classic'>('minimal');
  isPremium = this.resumeService.isPremium;

  shareLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert('Shareable link copied to clipboard!');
  }

  async exportPdf() {
    const res = await this.resumeService.checkEligibility();
    
    if (res.canDownload) {
      this.resumeService.downloadPdf();
    } else {
      this.dialog.open(PaymentDialogComponent, {
        width: '500px',
        maxWidth: '95vw'
      });
    }
  }
}
