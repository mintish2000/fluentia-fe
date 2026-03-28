import { inject, Injectable } from '@angular/core';
import {
  InfinityListResponse,
  PaginationQuery,
  Payment,
} from '@shared/interfaces/learning/learning.interface';
import { ApiService } from '@shared/services/api/api.service';

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private _api = inject(ApiService);

  /**
   * Returns the current user's paginated payment records.
   */
  getMyPayments(params: PaginationQuery = {}) {
    return this._api.get<InfinityListResponse<Payment>>({
      path: '/payments/my',
      params,
    });
  }
}
