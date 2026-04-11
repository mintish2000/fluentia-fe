import { computed, inject, Injectable } from '@angular/core';
import { UserService } from '@shared/services/user/user.service';

/**
 * Tutor shell: profile display only (legacy course/lesson/booking/enrollment APIs removed).
 */
@Injectable()
export class TutorHubService {
  private readonly _userService = inject(UserService);

  readonly currentUser = this._userService.currentUser;
  readonly displayName = computed(() => this.currentUser()?.name || 'Tutor');
}
