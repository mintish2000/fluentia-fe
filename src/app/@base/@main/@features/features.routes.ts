import { Routes } from '@angular/router';
import { AdminGuard } from '@core/guards/admin.guard';
import { StudentGuard } from '@core/guards/student.guard';
import { TutorGuard } from '@core/guards/tutor.guard';
import { UserGuard } from '@core/guards/user.guard';
import { LayoutComponent } from '../layout/layout.component';

export const featuresRoutes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
      {
        path: 'dashboard',
        canActivate: [UserGuard],
        loadComponent: () => import('./dashboard/dashboard.component'),
        title: 'pages.dashboard.title',
      },
      {
        path: 'courses',
        canActivate: [UserGuard],
        loadComponent: () => import('./courses/courses.component'),
        title: 'Courses',
      },
      {
        path: 'courses/:id',
        canActivate: [UserGuard],
        loadComponent: () => import('./course-details/course-details.component'),
        title: 'Course Details',
      },
      {
        path: 'lessons',
        canActivate: [UserGuard],
        loadComponent: () => import('./lessons/lessons.component'),
        title: 'Lessons',
      },
      {
        path: 'lessons/:id',
        canActivate: [UserGuard],
        loadComponent: () => import('./lesson-details/lesson-details.component'),
        title: 'Lesson Details',
      },
      {
        path: 'bookings',
        canActivate: [UserGuard],
        loadComponent: () => import('./bookings/bookings.component'),
        title: 'Bookings',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./home/home.component').then((m) => m.HomePageComponent),
        title: 'pages.home.title',
        data: {
          description: 'pages.home.headerDescription',
        }
      },
      {
        path: 'about',
        loadComponent: () => import('./about/about.component'),
        title: 'About',
      },
      {
        path: 'levels',
        loadComponent: () => import('./levels/levels.component'),
        title: 'English Levels',
      },
      {
        path: 'placement-test',
        canActivate: [UserGuard, StudentGuard],
        loadComponent: () => import('./placement-test/placement-test.component'),
        title: 'Placement Test',
      },
      {
        path: 'how-it-works',
        loadComponent: () => import('./how-it-works/how-it-works.component'),
        title: 'How it works',
      },
      {
        path: 'pricing',
        loadComponent: () => import('./pricing/pricing.component'),
        title: 'Schedule & Pricing',
      },
      {
        path: 'contact',
        loadComponent: () => import('./contact/contact.component'),
        title: 'Contact',
      },
      {
        path: 'admin',
        canActivate: [UserGuard, AdminGuard],
        loadChildren: () =>
          import('../../@admin/admin.routes').then((m) => m.default),
      },
      {
        path: 'tutor',
        canActivate: [UserGuard, TutorGuard],
        loadChildren: () =>
          import('../../@tutor/tutor.routes').then((m) => m.default),
      },
      {
        path: 'student',
        canActivate: [UserGuard, StudentGuard],
        loadChildren: () =>
          import('../../@student/student.routes').then((m) => m.default),
      },
    ],
  },
];

export default featuresRoutes;
