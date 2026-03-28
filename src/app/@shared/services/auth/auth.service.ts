import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { LoginResponse } from '@base/@external/login/interfaces/login.interface';
import { AppUserType } from '@shared/enums/user/app-user-type.enum';
import { BackendUser } from '@shared/interfaces/learning/learning.interface';
import { AppUser } from '@shared/interfaces/user/app-user.interface';
import { ApiService } from '@shared/services/api/api.service';
import { LocalStorageService } from '@shared/services/local-storage/local-storage.service';
import { map, Observable, take } from 'rxjs';
import { UserService } from '../user/user.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private _router = inject(Router);
  private _localStorageService = inject(LocalStorageService);
  private _apiService = inject(ApiService);
  private _userService = inject(UserService);

  isLoggedIn() {
    return this._localStorageService.getItem('access-token');
  }

  /**
   * Stores authenticated user session and mapped user profile.
   */
  handleLoggedInUser(payload: LoginResponse) {
    this._userService.setCurrentUser(this._mapBackendUser(payload.user));
    this._localStorageService.setItem('access-token', payload.token);
    this._localStorageService.setItem('refresh-token', payload.refreshToken);
  }

  handleLoggedInUserRedirection() {
    if (this._userService.isAdmin) {
      this._router.navigateByUrl('/main/admin');
    } else if (this._userService.isTutor) {
      this._router.navigateByUrl('/main/tutor');
    } else if (this._userService.isStudent) {
      this._router.navigateByUrl('/main/student');
    } else {
      this._router.navigateByUrl('/main/dashboard');
    }
  }

  fetchCurrentUserData() {
    return this._apiService.get<BackendUser>({
      path: '/auth/me',
    });
  }

  kickOut(options: { redirectToLogin?: boolean } = { redirectToLogin: true }) {
    this._apiService
      .post({
        path: '/auth/logout',
      })
      .pipe(take(1))
      .subscribe({
        next: (res) => {
          this._userService.setCurrentUser(null);
          this._localStorageService.removeItems([
            'currentUser',
            'access-token',
            'refresh-token',
          ]);

          if (options.redirectToLogin) {
            this._router.navigateByUrl('/external/login', {});
          }
        },
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
        map((res) => {
          return {
            accessToken: res.token,
            refreshToken: res.refreshToken,
          };
        }),
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
      englishLevel: user.englishLevel ?? null,
      learningGoals: user.learningGoals ?? null,
    };
  }

  /**
   * Resolves backend role payload into a valid frontend role enum.
   */
  private _resolveUserRole(user: BackendUser): AppUserType {
    const roleId = Number(user.role?.id);

    if (!Number.isNaN(roleId)) {
      if (roleId === AppUserType.ADMIN) {
        return AppUserType.ADMIN;
      }
      if (roleId === AppUserType.TUTOR) {
        return AppUserType.TUTOR;
      }
      if (roleId === AppUserType.STUDENT) {
        return AppUserType.STUDENT;
      }
      if (roleId === AppUserType.USER) {
        return AppUserType.USER;
      }
    }

    const roleName = user.role?.name?.trim().toLowerCase();
    if (roleName === 'admin') {
      return AppUserType.ADMIN;
    }
    if (roleName === 'tutor') {
      return AppUserType.TUTOR;
    }
    if (roleName === 'student') {
      return AppUserType.STUDENT;
    }
    if (roleName === 'user') {
      return AppUserType.USER;
    }

    return AppUserType.USER;
  }

  /**
   * Resolves user-role label for UI display when backend name is missing.
   */
  private _resolveRoleLabel(role: AppUserType): string {
    if (role === AppUserType.ADMIN) {
      return 'Admin';
    }
    if (role === AppUserType.TUTOR) {
      return 'Tutor';
    }
    if (role === AppUserType.STUDENT) {
      return 'Student';
    }

    return 'User';
  }
}
