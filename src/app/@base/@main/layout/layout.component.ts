import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import {
  NavigationEnd,
  RouterModule,
  RouterOutlet,
} from '@angular/router';
import { routerAnimations } from '@shared/animations/route-animations';
import { filter } from 'rxjs';
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
  animations: [routerAnimations],
  host: {
    '[style.--layout-landing-bg]': 'landingBackgroundUrl()',
  },
  imports: [
    CoreModule,
    RouterModule,
    RouterOutlet,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatSidenavModule,
    MatToolbarModule,
  ],
})
export class LayoutComponent extends BaseComponent {
  /**
   * Public marketing routes in navbar order — each step cycles landing-bg-1…3.
   * Other /main/* segments get a stable pseudo-random pick from the same set.
   */
  private static readonly LANDING_BG_SEGMENTS = [
    'home',
    'about',
    'levels',
    'how-it-works',
    'pricing',
    'contact',
  ] as const;

  private readonly _placementTestService = inject(PlacementTestService);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _document = inject(DOCUMENT);
  private _bodyScrollY = 0;

  private readonly _landingBgIndex = signal(0);

  /** CSS `url(...)` for `:host::before` (see layout.component.scss). */
  readonly landingBackgroundUrl = computed(
    () => `url('/images/landing-bg-${this._landingBgIndex() + 1}.png')`,
  );

  /** Mobile slide-out navigation (Material drawer). */
  readonly mobileDrawer = viewChild<MatDrawer>('mobileDrawer');
  private readonly _studentNavbarLinks: NavbarLink[] = [
    { path: '/main/student', label: 'Student Hub', exact: true },
    { path: '/main/payments', label: 'Payments', exact: true },
    // { path: '/main/lessons', label: 'Lessons', exact: true },
    // { path: '/main/bookings', label: 'Bookings', exact: true },
  ];

  private readonly _tutorNavbarLinks: NavbarLink[] = [
    { path: '/main/tutor', label: 'Tutor Hub', exact: true },
    // { path: '/main/courses', label: 'Courses', exact: true },
    // { path: '/main/lessons', label: 'Lessons', exact: true },
    // { path: '/main/bookings', label: 'Bookings', exact: true },
  ];

  private readonly _adminNavbarLinks: NavbarLink[] = [
    { path: '/main/admin', label: 'Admin Hub', exact: true },
    { path: '/main/dashboard', label: 'Dashboard', exact: true },
    // { path: '/main/courses', label: 'Courses', exact: true },
    // { path: '/main/lessons', label: 'Lessons', exact: true },
    // { path: '/main/bookings', label: 'Bookings', exact: true },
  ];

  readonly publicNavbarLinks: NavbarLink[] = [
    { path: '/main/home', label: 'HOME', exact: true },
    { path: '/main/about', label: 'ABOUT US', exact: true },
    { path: '/main/levels', label: 'ENGLISH LEVELS', exact: true },
    { path: '/main/how-it-works', label: 'HOW IT WORKS', exact: true },
    { path: '/main/pricing', label: 'SCHEDULE & PRICING', exact: true },
    { path: '/main/contact', label: 'CONTACT US', exact: true },
  ];
  readonly shouldShowPlacementFooterLink = computed(
    () => this._userService.isStudent && this._placementTestService.shouldShowPlacementEntry(),
  );

  /** Material icon names for mobile menu rows (path → icon). */
  private readonly _mobileMenuIcons: Readonly<Record<string, string>> = {
    '/main/admin': 'admin_panel_settings',
    '/main/student': 'school',
    '/main/tutor': 'co_present',
    '/main/dashboard': 'space_dashboard',
    '/main/home': 'home',
    '/main/about': 'info',
    '/main/levels': 'trending_up',
    '/main/how-it-works': 'auto_stories',
    '/main/pricing': 'payments',
    '/main/contact': 'mail',
    '/external/login': 'login',
  };

  constructor() {
    super();
    this._placementTestService.refreshStatus();
    this._landingBgIndex.set(this.resolveLandingBgIndex(this._router.url));
    this._router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe((e) => {
        this.closeMobileNav();
        this._landingBgIndex.set(this.resolveLandingBgIndex(e.urlAfterRedirects));
      });
  }

  private resolveLandingBgIndex(rawUrl: string): number {
    const path = (rawUrl.split(/[?#]/)[0] ?? '').replace(/\/+$/, '');
    const mainMarker = '/main/';
    const mainIdx = path.indexOf(mainMarker);
    const segment =
      mainIdx >= 0
        ? (path.slice(mainIdx + mainMarker.length).split('/')[0] ?? '')
        : (path.split('/').filter(Boolean).pop() ?? '');
    const orderIdx = LayoutComponent.LANDING_BG_SEGMENTS.indexOf(
      segment as (typeof LayoutComponent.LANDING_BG_SEGMENTS)[number],
    );
    if (orderIdx >= 0) {
      return orderIdx % 3;
    }
    let h = 0;
    for (let i = 0; i < segment.length; i++) {
      h = (Math.imul(31, h) + segment.charCodeAt(i)) | 0;
    }
    return Math.abs(h) % 3;
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

  openMobileNav(): void {
    void this.mobileDrawer()?.open();
  }

  closeMobileNav(): void {
    void this.mobileDrawer()?.close();
  }

  /**
   * Prevents the page behind the drawer from scrolling (including iOS overscroll).
   */
  onMobileDrawerOpenedChange(opened: boolean): void {
    const doc = this._document;
    const body = doc.body;
    const html = doc.documentElement;
    const win = doc.defaultView;

    if (opened) {
      /*
       * Use window + documentElement for scroll position (iOS / some emulators differ).
       * Global `html, body { height: 100% }` makes body viewport-tall; with `position: fixed`
       * that clips the document to ~100vh so the visible “window” goes blank after scrolling.
       * `height: auto` lets the fixed body span full content height while `top` preserves scroll.
       */
      this._bodyScrollY = win?.scrollY ?? html.scrollTop ?? body.scrollTop ?? 0;
      html.style.overflow = 'hidden';
      body.style.overflow = 'hidden';
      body.style.overscrollBehavior = 'none';
      body.style.position = 'fixed';
      body.style.top = `-${this._bodyScrollY}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      body.style.height = 'auto';
      body.style.minHeight = '100%';
    } else {
      html.style.removeProperty('overflow');
      body.style.removeProperty('overflow');
      body.style.removeProperty('overscroll-behavior');
      body.style.removeProperty('position');
      body.style.removeProperty('top');
      body.style.removeProperty('left');
      body.style.removeProperty('right');
      body.style.removeProperty('width');
      body.style.removeProperty('height');
      body.style.removeProperty('min-height');
      win?.scrollTo(0, this._bodyScrollY);
    }
  }

  onMobileLogout(): void {
    this.closeMobileNav();
    this.logout();
  }

  /**
   * Icon for a mobile menu route row.
   */
  mobileNavIcon(path: string): string {
    return this._mobileMenuIcons[path] ?? 'chevron_right';
  }

  /** Route transition state for `@routerAnimations` (see route `data.animation`). */
  prepareRoute(outlet: RouterOutlet): string {
    return (outlet.activatedRouteData['animation'] as string | undefined) ?? 'routeDefault';
  }
}
