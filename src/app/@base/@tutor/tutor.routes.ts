import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tutor.component'),
    title: 'Tutor Hub',
  },
];

export default routes;
