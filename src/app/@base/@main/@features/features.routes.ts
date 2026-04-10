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
        data: { animation: 'routeDashboard' },
      },
      {
        path: 'courses',
        canActivate: [UserGuard],
        loadComponent: () => import('./courses/courses.component'),
        title: 'Courses',
        data: { animation: 'routeCourses' },
      },
      {
        path: 'courses/:id',
        canActivate: [UserGuard],
        loadComponent: () => import('./course-details/course-details.component'),
        title: 'Course Details',
        data: { animation: 'routeCourseDetails' },
      },
      {
        path: 'lessons',
        canActivate: [UserGuard],
        loadComponent: () => import('./lessons/lessons.component'),
        title: 'Lessons',
        data: { animation: 'routeLessons' },
      },
      {
        path: 'lessons/:id',
        canActivate: [UserGuard],
        loadComponent: () => import('./lesson-details/lesson-details.component'),
        title: 'Lesson Details',
        data: { animation: 'routeLessonDetails' },
      },
      {
        path: 'bookings',
        canActivate: [UserGuard],
        loadComponent: () => import('./bookings/bookings.component'),
        title: 'Bookings',
        data: { animation: 'routeBookings' },
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./home/home.component').then((m) => m.HomePageComponent),
        title: 'pages.home.title',
        data: {
          description: 'pages.home.headerDescription',
          animation: 'routeHome',
        },
      },
      {
        path: 'about',
        loadComponent: () => import('./about/about.component'),
        title: 'About',
        data: { animation: 'routeAbout' },
      },
      {
        path: 'levels',
        loadComponent: () => import('./levels/levels.component'),
        title: 'English Levels',
        data: { animation: 'routeLevels' },
      },
      {
        path: 'placement-test',
        canActivate: [UserGuard, StudentGuard],
        loadComponent: () => import('./placement-test/placement-test.component'),
        title: 'Placement Test',
        data: { animation: 'routePlacementTest' },
      },
      {
        path: 'how-it-works',
        loadComponent: () => import('./how-it-works/how-it-works.component'),
        title: 'How it works',
        data: { animation: 'routeHowItWorks' },
      },
      {
        path: 'pricing',
        loadComponent: () => import('./pricing/pricing.component'),
        title: 'Schedule & Pricing',
        data: { animation: 'routePricing' },
      },
      {
        path: 'payments',
        canActivate: [UserGuard],
        loadComponent: () => import('./pricing/pricing.component'),
        title: 'Payments',
        data: { animation: 'routePayments' },
      },
      {
        path: 'contact',
        loadComponent: () => import('./contact/contact.component'),
        title: 'Contact',
        data: { animation: 'routeContact' },
      },
      {
        path: 'admin',
        canActivate: [UserGuard, AdminGuard],
        loadChildren: () =>
          import('../../@admin/admin.routes').then((m) => m.default),
        data: { animation: 'routeAdmin' },
      },
      {
        path: 'tutor',
        canActivate: [UserGuard, TutorGuard],
        loadChildren: () =>
          import('../../@tutor/tutor.routes').then((m) => m.default),
        data: { animation: 'routeTutor' },
      },
      {
        path: 'student',
        canActivate: [UserGuard, StudentGuard],
        loadChildren: () =>
          import('../../@student/student.routes').then((m) => m.default),
        data: { animation: 'routeStudent' },
      },
    ],
  },
];

export default featuresRoutes;
