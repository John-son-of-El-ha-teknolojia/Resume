import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResumeService } from './services/resume';
import { isPlatformBrowser } from '@angular/common';
// import { PLATFORM_ID, Inject } from '@angular/core';

export const authGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  // ✅ Check both signal and localStorage
  const loggedInSignal = resumeService.isLoggedIn();
  const loggedInStorage = typeof window !== 'undefined' && localStorage.getItem('jwt');

  if (loggedInSignal || loggedInStorage) {
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
