import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResumeService } from './services/resume';

export const authGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  // Check both signal and localStorage
  const loggedIn = resumeService.isLoggedIn() || localStorage.getItem('isLoggedIn') === 'true';

  if (loggedIn) {
    return true;
  }

  return router.parseUrl('/login');
};

export const adminGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  const loggedIn = resumeService.isLoggedIn() || localStorage.getItem('isLoggedIn') === 'true';
  const isAdmin = resumeService.isAdmin() || localStorage.getItem('isAdmin') === 'true';

  if (loggedIn && isAdmin) {
    return true;
  }

  return router.parseUrl('/writer');
};

export const premiumGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  const loggedIn = resumeService.isLoggedIn() || localStorage.getItem('isLoggedIn') === 'true';
  const isPremium = resumeService.isPremium() || localStorage.getItem('tier') !== 'free';

  if (loggedIn && isPremium) {
    return true;
  }

  return router.parseUrl('/account'); // redirect to upgrade page
};
