import { inject, Injectable } from '@angular/core';
import { ApiService } from '@shared/services/api/api.service';
import { StudentHubPayload } from './student-hub.models';

/**
 * {@code GET /api/v1/student/hub} — placement, group, payments (see FRONTEND_API.md).
 */
@Injectable({ providedIn: 'root' })
export class StudentHubService {
  private readonly _api = inject(ApiService);

  /**
   * Returns the authenticated student's hub snapshot.
   */
  getHub() {
    return this._api.get<StudentHubPayload>({ path: '/student/hub' });
  }
}
