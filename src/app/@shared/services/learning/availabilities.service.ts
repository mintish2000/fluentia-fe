import { inject, Injectable } from '@angular/core';
import {
  Availability,
  InfinityListResponse,
  PaginationQuery,
} from '@shared/interfaces/learning/learning.interface';
import { ApiService } from '@shared/services/api/api.service';

@Injectable({ providedIn: 'root' })
export class AvailabilitiesService {
  private _api = inject(ApiService);

  /**
   * Returns paginated tutor availabilities.
   */
  getAvailabilities(params: PaginationQuery = {}) {
    return this._api.get<InfinityListResponse<Availability>>({
      path: '/availabilities',
      params,
    });
  }
}
