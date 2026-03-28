import { Routes } from '@angular/router';

const loginRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component'),
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.component'),
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./reset-password/reset-password.component'),
  },
];

export default loginRoutes;
