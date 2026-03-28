import { inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { UserService } from '@shared/services/user/user.service';

@Injectable({
  providedIn: 'root',
})
export class TutorGuard implements CanActivate {
  readonly _router = inject(Router);
  readonly _userService = inject(UserService);

  async canActivate(): Promise<boolean> {
    if (this._userService.isTutor) {
      return true;
    }

    this._router.navigateByUrl('/main/dashboard');
    return false;
  }
}
