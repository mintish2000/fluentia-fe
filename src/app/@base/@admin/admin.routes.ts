import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin.component'),
    title: 'Admin Hub',
  },
];

export default routes;
