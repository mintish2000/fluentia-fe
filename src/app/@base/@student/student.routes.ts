import { Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./student.component'),
    title: 'Student Hub',
  },
  // {
];

export default routes;
