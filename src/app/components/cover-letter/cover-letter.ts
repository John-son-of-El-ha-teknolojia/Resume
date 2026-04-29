import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ResumeService } from '../../services/resume';

const OPENAI_API_KEY = "ADD API KEY";

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
  private resumeService = inject(ResumeService);
  isGenerating = signal(false);
  data = this.resumeService.coverLetterState();

  async generateLetter() {
    this.isGenerating.set(true);
    try {
      const resume = this.resumeService.resumeState();
      
      const prompt = `Draft a professional cover letter for a ${this.data.positionTitle || 'job'} at ${this.data.institutionName || 'the company'}.
      
      Job Description: ${this.data.jobDescription}
      
      User Profile:
      Name: ${resume.name}
      Summary: ${resume.summary}
      Experience: ${JSON.stringify(resume.experience)}
      
      The letter should be professional, compelling, and exactly reflect the user's expertise. Use a formal tone.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a professional cover letter writer."
            },
            {
              role: "user",
              content: prompt
            }
          ]
        })
      });

      const data = await response.json();
      this.data.generatedLetter = data.choices[0].message.content;
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
