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
             
          </div>
          <span class="text-xl font-black text-slate-800 uppercase tracking-tighter">Elite<span class="text-blue-600">CV</span></span>
        </div>

       @if (resumeService.isLoggedIn) {
              <div class="hidden md:flex items-center gap-1">
                <a routerLink="/dashboard" ...>Dashboard</a>
                <a routerLink="/writer" ...>Studio</a>
                <a routerLink="/account" ...>Account</a>
                @if (resumeService.isAdmin) {
                  <a routerLink="/admin" ...>Admin</a>
                }
              </div>

              <div class="flex items-center gap-4">
                <button mat-stroked-button (click)="logout()">Logout</button>
              </div>
            } @else {
              <div class="flex items-center gap-4">
                <button mat-flat-button routerLink="/login">Sign In</button>
              </div>
            }
              </div>

                 <!-- Mobile Menu -->
                    <div class="flex md:hidden items-center gap-3">
                      <!-- Account Icon -->
                      <button routerLink="/account"
                              class="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
                        <mat-icon>person</mat-icon>
                      </button>

                      <!-- Hamburger -->
                      <button (click)="toggleMobileMenu()" class="w-10 h-10 flex items-center justify-center text-slate-600">
                        <mat-icon>menu</mat-icon>
                      </button>
                    </div>
                  </div>

                  <!-- Mobile Dropdown -->
                  <div *ngIf="mobileMenuOpen" class="md:hidden bg-white border-t border-slate-100">
                    <a routerLink="/dashboard" class="mobile-link">Dashboard</a>
                    <a routerLink="/writer" class="mobile-link">Studio</a>
                    <a routerLink="/cover-letter" class="mobile-link">Cover Letter</a>
                    <a routerLink="/viewer" class="mobile-link">Viewer</a>
                    <a *ngIf="resumeService.isAdmin" routerLink="/admin" class="mobile-link">Admin</a>
                    <button (click)="logout()" class="mobile-link text-red-500">Logout</button>
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

   mobileMenuOpen = false;

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  logout() {
    this.resumeService.logout();
    this.router.navigate(['/login']);
  }
}
