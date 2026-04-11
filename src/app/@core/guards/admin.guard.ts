import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from '@shared/services/user/user.service';

@Injectable({
  providedIn: 'root',
})
export class AdminGuard implements CanActivate {
  readonly _router = inject(Router);
  readonly _userService = inject(UserService);

  async canActivate(): Promise<boolean> {
    if (this._userService.isAdmin) {
      return true;
    }

    if (this._userService.isTutor) {
      this._router.navigateByUrl('/main/tutor');
      return false;
    }

    this._router.navigateByUrl('/main/student');
    return false;
  }
}
