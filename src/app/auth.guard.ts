import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResumeService } from './services/resume';

export const authGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  if (resumeService.isLoggedIn()) {
    return true;
  }

  // Return a UrlTree instead of navigate()
  return router.parseUrl('/login');
};


export const adminGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  if (resumeService.isLoggedIn() && resumeService.isAdmin()) {
    return true;
  }

  return router.parseUrl('/writer');
};


// Optional: Premium guard for paid features
export const premiumGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  if (resumeService.isLoggedIn() && resumeService.isPremium()) {
    return true;
  }

  return router.parseUrl('/account'); // redirect to upgrade page
};
