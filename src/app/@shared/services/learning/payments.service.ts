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

/** Body for {@code POST /api/v1/payments/orders}. */
export type CreatePaypalOrderPayload = { planId: string };

/** Response from {@code POST /api/v1/payments/orders}. */
export type CreatePaypalOrderResponse = { orderId: string };

/** Response from {@code POST /api/v1/payments/orders/:orderId/capture}. */
export type CapturePaypalOrderResponse = {
  providerReference: string;
  amount: number;
  currency: string;
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

  /**
   * Asks the backend to create a PayPal order server-to-server.
   * The backend uses the PayPal secret and returns only the {@code orderId}.
   */
  createPaypalOrder(payload: CreatePaypalOrderPayload) {
    return this._api.post<CreatePaypalOrderResponse>({
      path: '/payments/orders',
      body: payload,
    });
  }

  /**
   * Asks the backend to capture an approved PayPal order server-to-server.
   * The backend verifies the capture with PayPal and returns the result.
   */
  capturePaypalOrder(orderId: string) {
    return this._api.post<CapturePaypalOrderResponse>({
      path: `/payments/orders/${encodeURIComponent(orderId)}/capture`,
    });
  }
}
