import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '@shared/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class UserGuard implements CanActivate {
  readonly _router = inject(Router);
  readonly _authService = inject(AuthService);

  async canActivate(): Promise<boolean> {
    try {
      await this._authService.ensureCurrentUserHydrated();
      return true;
    } catch {
      this._router.navigateByUrl('/external/login');
      return false;
    }
  }
}
