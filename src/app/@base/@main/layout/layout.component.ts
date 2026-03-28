import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterModule } from '@angular/router';
import { CoreModule } from '@core/core.module';

import { BaseComponent } from '@shared/components/base/base.component';
import { ChangeLanguageComponent } from '@shared/components/buttons/change-language/change-language.component';
import { PlacementTestService } from '@shared/services/learning/placement-test.service';

type NavbarLink = {
  path: string;
  label: string;
  exact?: boolean;
};

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CoreModule,
    RouterModule,
    MatToolbarModule,
    ChangeLanguageComponent,
  ],
})
export class LayoutComponent extends BaseComponent {
  private readonly _placementTestService = inject(PlacementTestService);
  private readonly _studentNavbarLinks: NavbarLink[] = [
    { path: '/main/student', label: 'Student Hub', exact: true },
    { path: '/main/dashboard', label: 'Dashboard', exact: true },
    { path: '/main/courses', label: 'Courses', exact: true },
    { path: '/main/lessons', label: 'Lessons', exact: true },
    { path: '/main/bookings', label: 'Bookings', exact: true },
  ];

  private readonly _tutorNavbarLinks: NavbarLink[] = [
    { path: '/main/tutor', label: 'Tutor Hub', exact: true },
    { path: '/main/dashboard', label: 'Dashboard', exact: true },
    { path: '/main/courses', label: 'Courses', exact: true },
    { path: '/main/lessons', label: 'Lessons', exact: true },
    { path: '/main/bookings', label: 'Bookings', exact: true },
  ];

  private readonly _adminNavbarLinks: NavbarLink[] = [
    { path: '/main/admin', label: 'Admin Hub', exact: true },
    { path: '/main/dashboard', label: 'Dashboard', exact: true },
    { path: '/main/courses', label: 'Courses', exact: true },
    { path: '/main/lessons', label: 'Lessons', exact: true },
    { path: '/main/bookings', label: 'Bookings', exact: true },
  ];

  readonly publicNavbarLinks: NavbarLink[] = [
    { path: '/main/home', label: 'Home', exact: true },
    { path: '/main/about', label: 'About', exact: true },
    { path: '/main/levels', label: 'English Levels', exact: true },
    { path: '/main/how-it-works', label: 'How it works', exact: true },
    { path: '/main/pricing', label: 'Schedule & Pricing', exact: true },
    { path: '/main/contact', label: 'Contact', exact: true },
  ];
  readonly shouldShowPlacementFooterLink = computed(
    () => this._userService.isStudent && this._placementTestService.shouldShowPlacementEntry(),
  );

  constructor() {
    super();
    this._placementTestService.refreshStatus();
  }

  /**
   * Resolves whether the app should show authenticated navigation.
   */
  isAuthenticated(): boolean {
    return this._userService.isAuthenticated() || !!this._authService.isLoggedIn();
  }

  /**
   * Resolves navbar links by authenticated user role.
   */
  getPrivateNavbarLinks(): NavbarLink[] {
    if (this._userService.isAdmin) {
      return this._adminNavbarLinks;
    }

    if (this._userService.isTutor) {
      return this._tutorNavbarLinks;
    }

    return this._studentNavbarLinks.filter(
      (link) =>
        link.path !== '/main/placement-test' ||
        this._placementTestService.shouldShowPlacementEntry(),
    );
  }

  /**
   * Returns the current authenticated user role label.
   */
  getCurrentRoleLabel(): string {
    return this._userService.roleLabel;
  }

  /**
   * Resolves current user hub path by role.
   */
  getRoleHubPath(): string {
    if (this._userService.isAdmin) {
      return '/main/admin';
    }
    if (this._userService.isTutor) {
      return '/main/tutor';
    }
    return '/main/student';
  }

  /**
   * Returns whether current authenticated user has student role.
   */
  isStudentRole(): boolean {
    return this._userService.isStudent;
  }

  /**
   * Resolves whether role-based navbar should be visible.
   */
  shouldShowRoleNavbar(): boolean {
    return this.isAuthenticated();
  }

  /**
   * Ends the active session and redirects to login.
   */
  logout(): void {
    this._authService.kickOut({ redirectToLogin: true });
  }
}
