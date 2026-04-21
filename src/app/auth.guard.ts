import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { ResumeService } from './services/resume';

export const authGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  if (resumeService.isLoggedIn()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};

export const adminGuard = () => {
  const resumeService = inject(ResumeService);
  const router = inject(Router);

  if (resumeService.isLoggedIn() && resumeService.isAdmin()) {
    return true;
  }

  router.navigate(['/writer']);
  return false;
};
