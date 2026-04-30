import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { AsyncPipe } from '@angular/common';
import { map, filter, startWith } from 'rxjs';

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

  showNavbar$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.urlAfterRedirects),
    startWith(this.router.url),
    map(url => !url.includes('/writer') && !url.includes('/viewer'))
  );
}
