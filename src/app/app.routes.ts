import { Routes } from '@angular/router';
import { PageNotFoundComponent } from './@shared/components/page-not-found/page-not-found.component';

export const routes: Routes = [
  {
    path: 'external',
    loadChildren: () => import('./@base/@external/external.routes'),
  },
  {
    path: 'main',
    loadChildren: () => import('./@base/@main/@features/features.routes'),
  },
  { path: 'admin', pathMatch: 'full', redirectTo: 'main/admin' },
  { path: 'tutor', pathMatch: 'full', redirectTo: 'main/tutor' },
  { path: 'student', pathMatch: 'full', redirectTo: 'main/student' },
  
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'main',
  },
  {
    path: '**',
    title: 'pages.notFound.title',
    component: PageNotFoundComponent,
  },
];
