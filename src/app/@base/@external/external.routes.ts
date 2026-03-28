import { Routes } from '@angular/router';

const externalRoutes: Routes = [
  {
    path: '',
    title: 'Login',
    loadChildren: () => import('./login/login.routes'),
  },
];

export default externalRoutes;
