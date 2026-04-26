import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { ResumeService, ResumeSection } from '../../services/resume';

@Component({
  selector: 'app-writer',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatButtonModule, 
    MatIconModule, 
    MatCardModule,
    MatExpansionModule,
    MatTooltipModule,
    RouterLink
  ],
  template: `
    <div class="resume-container pb-24 text-center md:text-left">
      <header class="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 class="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tight">The Editor</h1>
          <p class="text-slate-500 font-medium tracking-tight">Construct your professional narrative.</p>
        </div>
        
        <div class="flex items-center gap-3">
          <input type="file" #fileInput (change)="onFileSelected($event)" accept=".pdf" class="hidden">
          <button mat-flat-button (click)="fileInput.click()" 
                  class="!bg-white !text-blue-600 !border !border-blue-100 !rounded-xl h-12 px-6 font-black text-xs uppercase tracking-widest shadow-sm shadow-blue-50">
            @if (isExtracting()) {
              <ng-container>
                <mat-icon class="animate-spin mr-2">sync</mat-icon> Analyzing...
              </ng-container>
            } @else {
              <ng-container>
                <mat-icon class="mr-2">cloud_upload</mat-icon> Upload Existing (Premium)
              </ng-container>
            }
          </button>
        </div>
      </header>

      <!-- Personal Info Card -->
      <mat-card class="mb-8 p-0 overflow-hidden !border-slate-200">
        <div class="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 class="text-lg font-bold flex items-center gap-2">
            <mat-icon class="text-blue-600">person</mat-icon> Primary Information
          </h2>
        </div>
        <div class="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-1">
            <label for="full-name" class="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
            <input id="full-name" class="w-full text-base font-semibold border border-slate-100 rounded-lg p-3 bg-slate-50 focus:outline-none focus:border-blue-300 transition-all" 
                   [(ngModel)]="resume.name" (ngModelChange)="updateResume()" placeholder="e.g. Jonathan Doe">
          </div>
          <div class="space-y-1">
            <label for="email" class="text-[10px] font-black uppercase tracking-widest text-slate-400">Email Address</label>
            <input id="email" class="w-full text-base font-semibold border border-slate-100 rounded-lg p-3 bg-slate-50 focus:outline-none focus:border-blue-300 transition-all" 
                   [(ngModel)]="resume.email" (ngModelChange)="updateResume()" placeholder="jonathan.doe@email.com">
          </div>
          <div class="space-y-1">
            <label for="phone" class="text-[10px] font-black uppercase tracking-widest text-slate-400">Phone</label>
            <input id="phone" class="w-full text-base font-semibold border border-slate-100 rounded-lg p-3 bg-slate-50 focus:outline-none focus:border-blue-300 transition-all" 
                   [(ngModel)]="resume.phone" (ngModelChange)="updateResume()" placeholder="+254 700 000 000">
          </div>
          <div class="space-y-1">
            <label for="location" class="text-[10px] font-black uppercase tracking-widest text-slate-400">Location</label>
            <input id="location" class="w-full text-base font-semibold border border-slate-100 rounded-lg p-3 bg-slate-50 focus:outline-none focus:border-blue-300 transition-all" 
                   [(ngModel)]="resume.location" (ngModelChange)="updateResume()" placeholder="Nairobi, Kenya">
          </div>
          
          <div class="md:col-span-2 space-y-1 relative">
            <label for="summary" class="text-[10px] font-black uppercase tracking-widest text-slate-400">Professional Summary</label>
            <textarea id="summary" class="w-full h-32 text-sm text-slate-600 border border-slate-100 rounded-lg p-4 bg-slate-50 focus:outline-none focus:border-blue-300 resize-none transition-all" 
                      [(ngModel)]="resume.summary" (ngModelChange)="updateResume()" placeholder="Describe your executive presence..."></textarea>
            
            <button class="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-white px-3 py-1.5 rounded-full border border-blue-100 shadow-sm hover:bg-blue-50 transition-all"
                    (click)="enhanceField()" [disabled]="enhancingSummary()">
               @if (enhancingSummary()) {
                  <mat-icon class="animate-spin text-sm">sync</mat-icon> Refined by AI...
               } @else {
                  <mat-icon class="text-sm">auto_awesome</mat-icon> AI Enhance
               }
            </button>
          </div>
        </div>
      </mat-card>

      <!-- Dynamic Sections Header -->
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-sm font-black uppercase tracking-widest text-slate-400">Detailed Experience</h2>
        <span class="text-[10px] text-slate-400">Dynamic Section Builder</span>
      </div>

      <!-- Dynamic Sections -->
      <div class="space-y-6">
        @for (section of resume.sections; track section.id) {
          <mat-card class="p-0 overflow-hidden group !border-slate-200">
             <div class="p-4 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
               <input class="text-sm font-black uppercase tracking-widest bg-transparent border-none focus:outline-none focus:ring-0 text-slate-600" 
                      [(ngModel)]="section.title" (ngModelChange)="updateResume()">
               <button mat-icon-button (click)="removeSection(section.id)" class="text-zinc-400 hover:text-red-500 transition-colors">
                  <mat-icon class="text-sm">close</mat-icon>
               </button>
             </div>
             
             <div class="p-6 relative">
                <textarea class="w-full h-40 text-sm text-slate-600 border border-slate-100 rounded-lg p-4 bg-slate-50 focus:outline-none focus:border-blue-300 resize-none transition-all" 
                          [(ngModel)]="section.content" (ngModelChange)="updateResume()" [placeholder]="'Detailed impact for ' + section.title + '...'"></textarea>
                
                <button class="absolute bottom-10 right-10 flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-white px-4 py-2 rounded-full border border-blue-100 shadow-sm hover:bg-blue-50 transition-all"
                        (click)="enhanceSection(section)" [disabled]="enhancingSections().has(section.id)">
                   @if (enhancingSections().has(section.id)) {
                      <mat-icon class="animate-spin text-sm">sync</mat-icon> Enhancing...
                   } @else {
                      <mat-icon class="text-sm">bolt</mat-icon> Enhance with AI
                   }
                </button>
             </div>
          </mat-card>
        }
      </div>

      <div class="mt-10 flex justify-center">
        <button mat-stroked-button (click)="addSection()" class="!py-8 !px-16 !border-2 !border-dashed !border-slate-200 !rounded-2xl !text-slate-400 !font-bold !text-sm hover:!bg-slate-50 hover:!border-slate-300 transition-all uppercase tracking-widest">
          + Add New Section
        </button>
      </div>

      <!-- Action Footer -->
      <div class="fixed bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-slate-200 flex justify-center z-50 shadow-2xl shadow-slate-200">
        <button mat-flat-button class="!bg-blue-600 !text-white rounded-full px-16 h-14 text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-200" routerLink="/viewer">
          Live Preview <mat-icon class="ml-2">arrow_forward</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @reference "tailwindcss";
    :host { display: block; }
    textarea { min-height: 120px; }
    input::placeholder, textarea::placeholder { @apply text-zinc-400; }
  `]
})
export class WriterComponent {
  private resumeService = inject(ResumeService);
  
  resume = this.resumeService.resumeState();
  enhancingSummary = signal(false);
  enhancingSections = signal(new Set<string>());
  isPremium = this.resumeService.isPremium;
  isExtracting = signal(false);

  updateResume() {
    this.resumeService.updateResume(this.resume);
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      if (!this.isPremium()) {
        alert('Resume upload is a premium feature. Please upgrade your account.');
        return;
      }
      this.extractResume(file.name);
    }
  }

  async extractResume(fileName: string) {
    this.isExtracting.set(true);
    try {
      await this.resumeService.extractResume(fileName);
      this.resume = this.resumeService.resumeState();
    } catch (error) {
      console.error('Extraction failed', error);
    } finally {
      this.isExtracting.set(false);
    }
  }

  addSection() {
    this.resumeService.addSection();
    this.resume = this.resumeService.resumeState();
  }

  removeSection(id: string) {
    this.resumeService.removeSection(id);
    this.resume = this.resumeService.resumeState();
  }

  async enhanceField() {
    this.enhancingSummary.set(true);
    const content = this.resume.summary;
    const improved = await this.resumeService.enhanceText(content);
    this.resume.summary = improved;
    this.updateResume();
    this.enhancingSummary.set(false);
  }

  async enhanceSection(section: ResumeSection) {
    this.enhancingSections.update(s => {
      s.add(section.id);
      return new Set(s);
    });
    
    const improved = await this.resumeService.enhanceText(section.content);
    section.content = improved;
    this.updateResume();

    this.enhancingSections.update(s => {
      s.delete(section.id);
      return new Set(s);
    });
  }
}
