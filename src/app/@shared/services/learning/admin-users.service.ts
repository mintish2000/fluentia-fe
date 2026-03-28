import { inject, Injectable } from '@angular/core';
import {
  BackendUser,
  InfinityListResponse,
  PaginationQuery,
} from '@shared/interfaces/learning/learning.interface';
import { ApiService } from '@shared/services/api/api.service';

type UpdateUserPayload = {
  status?: { id: number };
};

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private _api = inject(ApiService);

  /**
   * Returns paginated users list for admin operations.
   */
  getUsers(params: PaginationQuery = {}) {
    return this._api.get<InfinityListResponse<BackendUser>>({
      path: '/users',
      params,
    });
  }

  /**
   * Updates admin-managed user fields (status, role, etc.).
   */
  updateUser(userId: number | string, payload: UpdateUserPayload) {
    return this._api.patch<BackendUser>({
      path: `/users/${userId}`,
      body: payload,
    });
  }

  /**
   * Deletes a user by id (admin only).
   */
  deleteUser(userId: number | string) {
    return this._api.delete<void>({
      path: `/users/${userId}`,
    });
  }
}
