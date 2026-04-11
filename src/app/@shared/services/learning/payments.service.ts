import { inject, Injectable } from '@angular/core';
import {
  InfinityListResponse,
  PaginationQuery,
  Payment,
} from '@shared/interfaces/learning/learning.interface';
import { ApiService } from '@shared/services/api/api.service';

/** Body for {@code POST /api/v1/payments/my} (see payment.md). */
export type RecordMyPaymentPayload = {
  amount: number;
  currency: string;
  providerReference?: string;
};

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

  /**
   * Persists a paid payment for the authenticated student after PSP success.
   */
  recordMyPayment(payload: RecordMyPaymentPayload) {
    return this._api.post<Payment>({
      path: '/payments/my',
      body: payload,
    });
  }
}
