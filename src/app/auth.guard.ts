import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResumeService } from './services/resume';
import { isPlatformBrowser } from '@angular/common';
// import { PLATFORM_ID, Inject } from '@angular/core';

export const authGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  const loggedInSignal = resumeService.isLoggedIn;
  const loggedInStorage = typeof window !== 'undefined' && localStorage.getItem('jwt');

  // 1. Signal takes priority
  if (loggedInSignal) {
    // If already logged in, block access to /login
    if (router.routerState.snapshot.url === '/login') {
      return router.parseUrl('/dashboard');
    }
    return true;
  }

  // 2. Fallback: JWT in localStorage
  if (loggedInStorage) {
    // Hydrate signals if needed
    resumeService.initializeSession?.();
    if (router.routerState.snapshot.url === '/login') {
      return router.parseUrl('/dashboard');
    }
    return true;
  }

  // 3. Not logged in at all
  return router.parseUrl('/login');
};


export const adminGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  const loggedIn = resumeService.isLoggedIn;
  const isAdmin = resumeService.isAdmin;

  if (loggedIn && isAdmin) {
    return true;
  }

  return router.parseUrl('/writer');
};

export const premiumGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  const loggedIn = resumeService.isLoggedIn;
  const isPremium = resumeService.isPremium;

  if (loggedIn && isPremium) {
    return true;
  }

  return router.parseUrl('/account'); // redirect to upgrade page
};

export function loginGuard() {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  if (resumeService.isLoggedIn) {
    return router.parseUrl('/dashboard');
  }
  return true;
}



export function rootGuard() {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  if (resumeService.isLoggedIn) {
    return router.parseUrl('/dashboard');
  }
  return router.parseUrl('/login');
}
