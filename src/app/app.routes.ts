import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent) 
  },
  { 
    path: 'signup', 
    loadComponent: () => import('./components/signup/signup').then(m => m.SignupComponent) 
  },
  { 
    path: 'dashboard', 
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'cover-letter', 
    loadComponent: () => import('./components/cover-letter/cover-letter').then(m => m.CoverLetterComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'writer', 
    loadComponent: () => import('./components/studio/studio').then(m => m.StudioComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'viewer', 
    loadComponent: () => import('./components/viewer/viewer').then(m => m.ViewerComponent),
    canActivate: [authGuard]
  },
  { 
    path: 'account', 
    loadComponent: () => import('./components/account/account').then(m => m.AccountComponent),
    canActivate: [authGuard]
  },
  {
    path: 'pdf-editor',
    loadComponent: () => import('./components/pdf-editor/pdf-editor').then(m => m.PdfEditorComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard]
  },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];
