import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { UserService } from '@shared/services/user/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
})
export class HomePageComponent {
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);

  goToPayment(): void {
    if (!this._userService.isAuthenticated()) {
      void this._router.navigateByUrl('/external/login');
      return;
    }
    void this._router.navigateByUrl('/main/pricing');
  }

  navigateToLogin(): void {
    void this._router.navigateByUrl('/external/login');
  }

  navigateToLevels(): void {
    void this._router.navigateByUrl('/main/levels');
  }
}
