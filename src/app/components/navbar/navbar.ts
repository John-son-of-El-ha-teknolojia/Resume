import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ResumeService } from '../../services/resume';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  template: `
    <nav class="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-50">
      <div class="resume-container h-20 flex items-center justify-between">
        <div class="flex items-center gap-2 group cursor-pointer" routerLink="/writer">
          <div class="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
            <mat-icon class="text-white">auto_awesome</mat-icon>
          </div>
          <span class="text-xl font-black text-slate-800 uppercase tracking-tighter">Elite<span class="text-blue-600">CV</span></span>
        </div>

        @if (resumeService.isLoggedIn()) {
          <div class="hidden md:flex items-center gap-1">
            <a routerLink="/writer" routerLinkActive="!text-blue-600" [routerLinkActiveOptions]="{exact: true}" 
               class="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all">Studio</a>
            <a routerLink="/viewer" routerLinkActive="!text-blue-600" 
               class="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all">Viewer</a>
            <a routerLink="/account" routerLinkActive="!text-blue-600" 
               class="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all">Account</a>
            @if (resumeService.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="!text-blue-600" 
                 class="px-5 py-2 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all">Admin</a>
            }
          </div>

          <div class="flex items-center gap-4">
            <div class="h-10 w-px bg-slate-100 mx-2"></div>
            <button mat-stroked-button (click)="logout()" class="!border-slate-100 !text-slate-400 font-bold text-[10px] uppercase tracking-widest h-10 px-4 rounded-lg">
              Logout
            </button>
          </div>
        } @else {
           <div class="flex items-center gap-4">
             <button mat-flat-button routerLink="/login" class="!bg-blue-600 !text-white h-10 px-6 rounded-lg font-bold shadow-lg shadow-blue-100">
               Sign In
             </button>
           </div>
        }
      </div>
    </nav>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class NavbarComponent {
  resumeService = inject(ResumeService);
  private router = inject(Router);

  logout() {
    this.resumeService.logout();
    this.router.navigate(['/login']);
  }
}
