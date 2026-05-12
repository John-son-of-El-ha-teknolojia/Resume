import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { AsyncPipe, isPlatformBrowser } from '@angular/common';
import { map, filter, startWith } from 'rxjs';
import { Inject, PLATFORM_ID } from '@angular/core';
// import { isPlatformBrowser } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, AsyncPipe],
  template: `
    @if (showNavbar$ | async) {
      <app-navbar />
    }
    <main class="min-h-screen">
      <router-outlet />
    </main>
  `,
  styleUrl: './app.css',
})
export class App {
  private router = inject(Router);
  private idleTimeout: any;
  private isActive = true; // track activity state

  showNavbar$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.urlAfterRedirects),
    startWith(this.router.url),
    map(url => !url.includes('/writer') && !url.includes('/viewer'))
  );

 constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.resetIdleTimer();
      ['click', 'mousemove', 'keydown'].forEach(evt =>
        document.addEventListener(evt, () => {
          this.isActive = true;
          this.resetIdleTimer();
        })
      );
    }
  }

  private resetIdleTimer() {
    clearTimeout(this.idleTimeout);
    this.idleTimeout = setTimeout(() => {
      this.isActive = false;
      localStorage.removeItem('jwt');
      this.router.navigate(['/login']);
    }, 10 * 60 * 1000); // 10 minutes
  }

  // Expose activity state for interceptor
  public getActivityState() {
    return this.isActive;
  }
}
