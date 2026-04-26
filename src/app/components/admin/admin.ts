import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { ResumeService } from '../../services/resume';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRevenue: number;
  tierCounts: Record<string, number>;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule],
  template: `
    <div class="resume-container">
      <header class="mb-12">
        <h1 class="text-3xl md:text-4xl font-black text-slate-800 uppercase tracking-tight">Admin Intelligence</h1>
        <p class="text-slate-500 font-medium tracking-tight">Real-time platform performance and revenue metrics.</p>
      </header>

      @if (stats()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <!-- Total Users -->
          <mat-card class="p-6 !border-none shadow-xl bg-white group hover:-translate-y-1 transition-all">
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-blue-50 rounded-xl">
                <mat-icon class="text-blue-600">people</mat-icon>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Users</span>
            </div>
            <div class="text-3xl font-black text-slate-800 tracking-tight">{{ stats()?.totalUsers ?? 0 }}</div>
            <p class="text-[10px] font-bold text-slate-400 uppercase mt-2">Platform Global</p>
          </mat-card>

          <!-- Active Users -->
          <mat-card class="p-6 !border-none shadow-xl bg-white group hover:-translate-y-1 transition-all">
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-emerald-50 rounded-xl">
                <mat-icon class="text-emerald-600">record_voice_over</mat-icon>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Active Now</span>
            </div>
            <div class="text-3xl font-black text-slate-800 tracking-tight">{{ stats()?.activeUsers ?? 0 }}</div>
            <p class="text-[10px] font-bold text-emerald-500 uppercase mt-2 flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Streaming real-time
            </p>
          </mat-card>

          <!-- Total Revenue -->
          <mat-card class="p-6 !border-none shadow-xl bg-white group hover:-translate-y-1 transition-all">
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-indigo-50 rounded-xl">
                <mat-icon class="text-indigo-600">payments</mat-icon>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Net Revenue</span>
            </div>
            <div class="text-3xl font-black text-slate-800 tracking-tight">{{ stats()?.totalRevenue }} KES</div>
            <p class="text-[10px] font-bold text-slate-400 uppercase mt-2">Gross Platform Earnings</p>
          </mat-card>

          <!-- Converter -->
          <mat-card class="p-6 !border-none shadow-xl bg-white group hover:-translate-y-1 transition-all">
            <div class="flex items-center justify-between mb-4">
              <div class="p-3 bg-amber-50 rounded-xl">
                <mat-icon class="text-amber-600">insights</mat-icon>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-zinc-400">Conversion</span>
            </div>
            <div class="text-3xl font-black text-slate-800 tracking-tight">
              {{ (stats()?.totalRevenue || 0) > 0 ? (stats()?.totalRevenue || 0) / 127 : 0 | number:'1.0-1' }}
            </div>
            <p class="text-[10px] font-bold text-slate-400 uppercase mt-2">Estimated USD Value</p>
          </mat-card>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <!-- Subscription Distribution -->
          <mat-card class="lg:col-span-12 p-8 !border-none shadow-xl bg-white">
            <h2 class="text-sm font-black uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
              <mat-icon class="text-blue-600 text-sm">pie_chart</mat-icon> Subscription Distribution
            </h2>
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div class="p-6 bg-slate-50 rounded-3xl text-center border border-slate-100">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Rapid (3 Days)</p>
                <div class="text-4xl font-black text-slate-800 tracking-tight">{{ stats()?.tierCounts?.['3days'] ?? 0 }}</div>
                <div class="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div class="bg-blue-600 h-full" [style.width.%]="(stats()?.tierCounts?.['3days'] || 0) * 10"></div>
                </div>
              </div>

               <div class="p-6 bg-slate-50 rounded-3xl text-center border border-slate-100 relative group overflow-hidden">
                <div class="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Professional (Month)</p>
                <div class="text-4xl font-black text-slate-800 tracking-tight">{{ stats()?.tierCounts?.['1month'] ?? 0 }}</div>
                <div class="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div class="bg-blue-600 h-full" [style.width.%]="(stats()?.tierCounts?.['1month'] || 0) * 10"></div>
                </div>
              </div>

               <div class="p-6 bg-slate-50 rounded-3xl text-center border border-slate-100">
                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Executive (Year)</p>
                <div class="text-4xl font-black text-slate-800 tracking-tight">{{ stats()?.tierCounts?.['1year'] ?? 0 }}</div>
                <div class="mt-4 h-1 bg-slate-200 rounded-full overflow-hidden">
                  <div class="bg-blue-600 h-full" [style.width.%]="(stats()?.tierCounts?.['1year'] || 0) * 10"></div>
                </div>
              </div>
            </div>
          </mat-card>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center p-20 text-zinc-400">
          <mat-icon class="animate-spin scale-[2.5] mb-8">sync</mat-icon>
          <p class="font-black uppercase tracking-widest">Aggregating Global Metrics...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private resumeService = inject(ResumeService);
  stats = signal<AdminStats | null>(null);

  ngOnInit() {
    this.refreshStats();
    // Refresh every 30 seconds
    setInterval(() => this.refreshStats(), 30000);
  }

  async refreshStats() {
    try {
      const data = await this.resumeService.getAdminStats();
      this.stats.set(data);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  }
}
