import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoginResponse } from '@base/@external/login/interfaces/login.interface';
import { AppUserType } from '@shared/enums/user/app-user-type.enum';
import { BackendUser } from '@shared/interfaces/learning/learning.interface';
import { AppUser } from '@shared/interfaces/user/app-user.interface';
import { ApiService } from '@shared/services/api/api.service';
import { LocalStorageService } from '@shared/services/local-storage/local-storage.service';
import { finalize, lastValueFrom, map, Observable, take } from 'rxjs';
import { UserService } from '../user/user.service';

const CURRENT_USER_STORAGE_KEY = 'currentUser';

const ROLE_BY_ID: Readonly<Record<number, AppUserType>> = {
  [AppUserType.ADMIN]: AppUserType.ADMIN,
  [AppUserType.STUDENT]: AppUserType.STUDENT,
};

const ROLE_BY_NAME: Readonly<Record<string, AppUserType>> = {
  admin: AppUserType.ADMIN,
  student: AppUserType.STUDENT,
};

const ROLE_LABEL_BY_TYPE: Readonly<Record<AppUserType, string>> = {
  [AppUserType.ADMIN]: 'Admin',
  [AppUserType.TUTOR]: 'Tutor',
  [AppUserType.STUDENT]: 'Student',
  [AppUserType.USER]: 'User',
};

const REDIRECTION_RULES: ReadonlyArray<{ isMatch: (userService: UserService) => boolean; path: string }> = [
  { isMatch: (userService) => userService.isAdmin, path: '/main/admin' },
  { isMatch: (userService) => userService.isStudent, path: '/main/student' },
];

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly _router = inject(Router);
  private readonly _localStorageService = inject(LocalStorageService);
  private readonly _apiService = inject(ApiService);
  private readonly _userService = inject(UserService);

  /** In-flight promise so parallel {@code UserGuard} runs share one {@code GET /auth/me}. */
  private _hydrateUserPromise: Promise<void> | null = null;

  isLoggedIn() {
    return this._localStorageService.getItem('access-token');
  }

  /**
   * Stores authenticated user session and mapped user profile.
   */
  handleLoggedInUser(payload: LoginResponse) {
    const mappedUser = this._mapBackendUser(payload.user);
    if (!this._isAllowedRole(mappedUser.userRole)) {
      this._clearSession(true, true);
      return;
    }

    this._userService.setCurrentUser(mappedUser);
    this._localStorageService.setItem(
      CURRENT_USER_STORAGE_KEY,
      JSON.stringify(mappedUser),
    );

    this._localStorageService.setItem('access-token', payload.token);
    this._localStorageService.setItem('refresh-token', payload.refreshToken);
  }

  handleLoggedInUserRedirection() {
    const path =
      REDIRECTION_RULES.find((rule) => rule.isMatch(this._userService))?.path ??
      null;

    if (!path) {
      this.kickOut();
      return;
    }

    this._router.navigateByUrl(path);
  }

  fetchCurrentUserData() {
    return this._apiService.get<BackendUser>({
      path: '/auth/me',
    });
  }

  /**
   * Loads the current user from the API when a token exists but the in-memory profile is empty.
   * Rejects when there is no access token; concurrent callers await the same request.
   */
  ensureCurrentUserHydrated(): Promise<void> {
    if (this._userService.isAuthenticated()) {
      return Promise.resolve();
    }
    if (!this.isLoggedIn()) {
      return Promise.reject(new Error('NO_SESSION'));
    }

    const cachedUser = this._readCachedUser();
    if (cachedUser) {
      if (!this._isAllowedRole(cachedUser.userRole)) {
        this._clearSession(true, true);
        return Promise.reject(new Error('UNAUTHORIZED_ROLE'));
      }

      this._userService.setCurrentUser(cachedUser);
      return Promise.resolve();
    }

    this._hydrateUserPromise ??= lastValueFrom(this.fetchCurrentUserData())
      .then((response) => {
        const mappedUser = this.mapBackendUser(response);

        if (!this._isAllowedRole(mappedUser.userRole)) {
          this._clearSession(true, true);
          throw new Error('UNAUTHORIZED_ROLE');
        }

        this._userService.setCurrentUser(mappedUser);
        this._localStorageService.setItem(
          CURRENT_USER_STORAGE_KEY,
          JSON.stringify(mappedUser),
        );
      })
      .finally(() => {
        this._hydrateUserPromise = null;
      });
    return this._hydrateUserPromise;
  }

  kickOut(options: { redirectToLogin?: boolean } = { redirectToLogin: true }) {
    const shouldRedirect = options.redirectToLogin ?? true;

    this._apiService
      .post({
        path: '/auth/logout',
      })
      .pipe(
        take(1),
        finalize(() => {
          this._clearSession(shouldRedirect, true);
        }),
      )
      .subscribe({
        error: () => void 0,
      });
  }

  /**
   * Updates the stored access and refresh tokens in localStorage
   * Used after successful token refresh to maintain user session
   */
  updateStoredTokens(accessToken: string, refreshToken: string): void {
    this._localStorageService.setItem('access-token', accessToken);
    this._localStorageService.setItem('refresh-token', refreshToken);
  }

  refreshToken(): Observable<{ accessToken: string; refreshToken: string }> {
    return this._apiService
      .post<{
        token: string;
        refreshToken: string;
        tokenExpires: number;
      }>({
        path: '/auth/refresh',
        body: {},
      })
      .pipe(
        map((res) => ({
          accessToken: res.token,
          refreshToken: res.refreshToken,
        })),
      );
  }

  /**
   * Maps backend user payload to the frontend AppUser shape.
   */
  mapBackendUser(user: BackendUser): AppUser {
    return this._mapBackendUser(user);
  }

  /**
   * Maps backend user payload to the frontend AppUser shape.
   */
  private _mapBackendUser(user: BackendUser): AppUser {
    const roleId = this._resolveUserRole(user);
    const firstName = user.firstName ?? '';
    const lastName = user.lastName ?? '';
    const fullName = `${firstName} ${lastName}`.trim();
    const roleName = user.role?.name ?? this._resolveRoleLabel(roleId);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      name: fullName || user.email || 'Student',
      userRole: roleId,
      role: roleName,
    };
  }

  /**
   * Resolves backend role payload into a valid frontend role enum.
   */
  private _resolveUserRole(user: BackendUser): AppUserType {
    const roleId = Number(user.role?.id);

    if (!Number.isNaN(roleId) && ROLE_BY_ID[roleId] != null) {
      return ROLE_BY_ID[roleId];
    }

    const roleName = user.role?.name?.trim().toLowerCase();
    return (roleName && ROLE_BY_NAME[roleName]) || AppUserType.USER;
  }

  /**
   * Resolves user-role label for UI display when backend name is missing.
   */
  private _resolveRoleLabel(role: AppUserType): string {
    return ROLE_LABEL_BY_TYPE[role] ?? 'User';
  }

  /**
   * Only admin and student roles are allowed to keep an authenticated session.
   */
  private _isAllowedRole(role: AppUserType): boolean {
    return role === AppUserType.ADMIN || role === AppUserType.STUDENT;
  }

  /**
   * Reads cached user snapshot from localStorage.
   */
  private _readCachedUser(): AppUser | null {
    const raw = this._localStorageService.getItem<string>(CURRENT_USER_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as AppUser;
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      this._localStorageService.removeItems([CURRENT_USER_STORAGE_KEY]);
      return null;
    }
  }

  /**
   * Clears local auth session and optionally redirects to login page.
   */
  private _clearSession(redirectToLogin: boolean, refreshApplication = false): void {
    this._userService.setCurrentUser(null);
    this._localStorageService.clear();
    sessionStorage.clear();

    if (refreshApplication) {
      if (redirectToLogin) {
        window.location.assign('/external/login');
      } else {
        window.location.reload();
      }
      return;
    }

    if (redirectToLogin) {
      this._router.navigateByUrl('/external/login', {});
    }
  }
}
