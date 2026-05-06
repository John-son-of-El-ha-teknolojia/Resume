import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResumeService } from './services/resume';

export const authGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  // Check if user is logged in
  if (resumeService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const adminGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  // Check if user is logged in and has admin privileges
  if (resumeService.isLoggedIn() && resumeService.isAdmin()) {
    return true;
  }

  router.navigate(['/writer']);
  return false;
};

// Optional: Premium guard for paid features
export const premiumGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  // Check if user is logged in and has premium tier
  if (resumeService.isLoggedIn() && resumeService.isPremium()) {
    return true;
  }

  router.navigate(['/account']); // redirect to account/upgrade page
  return false;
};
