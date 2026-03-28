import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@shared/services/auth/auth.service';
import { UserService } from '@shared/services/user/user.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserGuard implements CanActivate {
  readonly _router = inject(Router);
  readonly _userService = inject(UserService);
  readonly _authService = inject(AuthService);

  async canActivate(): Promise<boolean> {
    try {
      if (this._userService.isAuthenticated()) {
        return true;
      } else {
        const response = await lastValueFrom(
          this._authService.fetchCurrentUserData(),
        );
        this._userService.setCurrentUser(this._authService.mapBackendUser(response));
        return true;
      }
    } catch (error) {
      // Not logged in or error fetching user data, redirect to login page
      this._router.navigateByUrl('/external/login');
      return false;
    }
  }
}
