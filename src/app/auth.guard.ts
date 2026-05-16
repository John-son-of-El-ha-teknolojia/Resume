import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResumeService } from './services/resume';
import { isPlatformBrowser } from '@angular/common';
// import { PLATFORM_ID, Inject } from '@angular/core';

export const authGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  // ✅ Check query params first
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    const tier = params.get('tier');

    if (token) {
      localStorage.setItem('jwt', token);
      if (email) localStorage.setItem('userEmail', email);
      if (tier) localStorage.setItem('tier', tier);

      // Clean up query string
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }

  // ✅ Now check both signal and localStorage
  const loggedInSignal = resumeService.isLoggedIn();
  const loggedInStorage = typeof window !== 'undefined' && localStorage.getItem('jwt');

  if (loggedInSignal || loggedInStorage) {
    // If user tries to hit /login while logged in, reroute to dashboard
    if (router.url === '/login') {
      return router.parseUrl('/dashboard');
    }
    return true;
  }

  return router.parseUrl('/login');
};


export const adminGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  const loggedIn = resumeService.isLoggedIn();
  const isAdmin = resumeService.isAdmin();

  if (loggedIn && isAdmin) {
    return true;
  }

  return router.parseUrl('/writer');
};

export const premiumGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  const loggedIn = resumeService.isLoggedIn();
  const isPremium = resumeService.isPremium();

  if (loggedIn && isPremium) {
    return true;
  }

  return router.parseUrl('/account'); // redirect to upgrade page
};

export function loginGuard(): boolean {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  if (resumeService.isLoggedIn()) {
    router.navigate(['/dashboard']);
    return false;
  }
  return true;
}


export function rootGuard(): boolean {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  if (resumeService.isLoggedIn()) {
    router.navigate(['/dashboard']);
  } else {
    router.navigate(['/login']);
  }
  return false; // prevent direct navigation
}
