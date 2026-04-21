import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent) 
  },
  { 
    path: 'writer', 
    loadComponent: () => import('./components/writer/writer').then(m => m.WriterComponent),
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
    path: 'admin',
    loadComponent: () => import('./components/admin/admin').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard]
  },
  { path: '', redirectTo: 'writer', pathMatch: 'full' },
  { path: '**', redirectTo: 'writer' }
];
