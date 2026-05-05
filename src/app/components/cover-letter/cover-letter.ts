import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-cover-letter',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, RouterLink],
  template: `
    <div class="min-h-screen bg-zinc-50 p-8">
      <div class="max-w-4xl mx-auto space-y-8">
        <header class="flex items-center gap-4">
          <button mat-icon-button routerLink="/dashboard"><mat-icon>arrow_back</mat-icon></button>
          <div>
            <h1 class="text-2xl font-black uppercase tracking-widest text-zinc-900">Cover Letter Assistant</h1>
            <p class="text-zinc-500 font-medium tracking-tight">AI-powered drafting based on your professional profile</p>
          </div>
          <div class="flex-1"></div>
          <div class="flex flex-col">
            <span class="text-[7px] font-black uppercase text-zinc-400 tracking-widest pl-1 leading-none">Model Selection</span>
            <select (change)="onModelChange($event)" class="h-8 bg-transparent border-none text-[9px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer">
              @for (model of resumeService.SUPPORTED_MODELS; track model.id) {
                <option [value]="model.id" [selected]="model.id === resumeService.getSelectedModel()">{{ model.name }}</option>
              }
            </select>
          </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
          <!-- Inputs -->
          <div class="space-y-6">
            <div class="bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-sm space-y-6">
              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Position Info</label>
                <div class="space-y-3">
                  <input type="text" [(ngModel)]="data.institutionName" placeholder="Institution/Company Name" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-bold placeholder:text-zinc-300">
                  <input type="text" [(ngModel)]="data.positionTitle" placeholder="Position Title" class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-bold placeholder:text-zinc-300">
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Job Description / Requirements</label>
                <textarea [(ngModel)]="data.jobDescription" placeholder="Paste the job ad or requirements here..." 
                          class="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-sm font-bold min-h-[200px] placeholder:text-zinc-300"></textarea>
              </div>

              <button mat-flat-button class="w-full !bg-zinc-900 !text-white h-14 !rounded-2xl !font-black !uppercase !tracking-widest"
                      [disabled]="isGenerating() || !data.jobDescription" (click)="generateLetter()">
                <mat-icon *ngIf="!isGenerating()">auto_awesome</mat-icon>
                <mat-progress-spinner *ngIf="isGenerating()" diameter="20" mode="indeterminate" class="mr-2"></mat-progress-spinner>
                {{ isGenerating() ? 'AI Agents Drafting...' : 'Generate Cover Letter' }}
              </button>
            </div>
          </div>

          <!-- Output -->
          <div class="space-y-6">
            @if (data.generatedLetter) {
              <div class="bg-white p-10 rounded-[2rem] border border-zinc-100 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div class="flex items-center justify-between border-b border-zinc-100 pb-4">
                  <span class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Drafted Letter</span>
                  <button mat-icon-button (click)="copyLetter()"><mat-icon class="text-sm">content_copy</mat-icon></button>
                </div>
                <div class="prose prose-zinc max-w-none">
                  <p class="whitespace-pre-wrap text-sm text-zinc-800 leading-relaxed font-serif">{{ data.generatedLetter }}</p>
                </div>
              </div>
            } @else {
              <div class="h-full flex flex-col items-center justify-center p-12 text-center opacity-30 border-2 border-dashed border-zinc-200 rounded-[2rem] min-h-[300px]">
                <mat-icon class="scale-[2.5] mb-6">description</mat-icon>
                <p class="text-[10px] font-black uppercase tracking-widest">Waiting for input</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class CoverLetterComponent {
  public resumeService = inject(ResumeService);
  isGenerating = signal(false);
  data = this.resumeService.coverLetterState();

  onModelChange(event: any) {
    this.resumeService.setModel(event.target.value);
  }

  async generateLetter() {
    this.isGenerating.set(true);
    try {
      const resume = this.resumeService.resumeState();
      const response = await this.resumeService.generateCoverLetterDetailed(
        resume,
        this.data.institutionName || '',
        this.data.positionTitle || '',
        this.data.jobDescription || ''
      );
      this.data.generatedLetter = response.result;
    } catch (e) {
      console.error('AI Gen failed', e);
      this.data.generatedLetter = "An error occurred during AI generation. Please try again.";
    } finally {
      this.isGenerating.set(false);
    }
  }

  copyLetter() {
    navigator.clipboard.writeText(this.data.generatedLetter || '');
  }
}
