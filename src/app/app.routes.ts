import { Routes } from '@angular/router';
import { authGuard, adminGuard, loginGuard, rootGuard } from './auth.guard';
import { AccountComponent } from './components/account/account';
import { PaymentCallbackComponent } from './components/payment/payment-callback.component';
export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./components/login/login').then(m => m.LoginComponent), canActivate: [loginGuard] },
  { path: 'signup', loadComponent: () => import('./components/signup/signup').then(m => m.SignupComponent) },
  { path: 'dashboard', loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent), canActivate: [authGuard] },
  { path: 'writer', loadComponent: () => import('./components/studio/studio.components').then(m => m.StudioComponent), canActivate: [authGuard] },
  { path: 'payment', loadComponent: () => import('./components/payment/payment').then(m => m.PaymentDialogComponent), canActivate: [authGuard] },
  { path: 'payment/callback', component: PaymentCallbackComponent },
  { path: 'viewer', loadComponent: () => import('./components/viewer/viewer').then(m => m.ViewerComponent), canActivate: [authGuard] },
  { path: 'account', component: AccountComponent, canActivate: [authGuard] },
  { path: 'admin', loadComponent: () => import('./components/admin/admin').then(m => m.AdminDashboardComponent), canActivate: [adminGuard] },

  
  {
    path: 'pdf-editor',
    loadChildren: async () => {
      // Initialize sharing scope
      // @ts-ignore
      await __webpack_init_sharing__('default');
      const container = (window as any).pdfEditor; // remote container
      // @ts-ignore
      await container.init(__webpack_share_scopes__.default);
      const factory = await container.get('./PdfEditorModule');
      const Module = factory();
      return Module.PdfEditorModule;
    },
  },
  {
    path: 'cover-letter',
    loadChildren: async () => {
      // @ts-ignore
      await __webpack_init_sharing__('default');
      const container = (window as any).coverLetter;
      // @ts-ignore
      await container.init(__webpack_share_scopes__.default);
      const factory = await container.get('./CoverLetterModule');
      const Module = factory();
      return Module.CoverLetterModule;
    },
  },

{
  path: 'jobSearch',
  loadComponent: async () => {
    // @ts-ignore
    await __webpack_init_sharing__('default');
    const container = (window as any).jobSearch;
    // @ts-ignore
    await container.init(__webpack_share_scopes__.default);
    const factory = await container.get('./Auth');
    return factory().JobSearch;   // ✅ standalone component
  },
  canActivate: [authGuard]
},




  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];