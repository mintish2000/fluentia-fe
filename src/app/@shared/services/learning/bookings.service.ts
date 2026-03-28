import { inject, Injectable } from '@angular/core';
import {
  Booking,
  CreateBookingPayload,
  InfinityListResponse,
  PaginationQuery,
} from '@shared/interfaces/learning/learning.interface';
import { ApiService } from '@shared/services/api/api.service';

@Injectable({ providedIn: 'root' })
export class BookingsService {
  private _api = inject(ApiService);

  /**
   * Returns paginated booking records.
   */
  getBookings(params: PaginationQuery = {}) {
    return this._api.get<InfinityListResponse<Booking>>({
      path: '/bookings',
      params,
    });
  }

  /**
   * Creates a booking from selected availability and student context.
   */
  createBooking(payload: CreateBookingPayload) {
    return this._api.post<Booking>({
      path: '/bookings',
      body: payload,
    });
  }

  /**
   * Updates booking fields such as status and schedule.
   */
  updateBooking(
    bookingId: string,
    payload: Partial<
      Pick<
        Booking,
        'status' | 'bookingDate' | 'startTime' | 'meetingProvider' | 'meetingLink'
      >
    >,
  ) {
    return this._api.patch<Booking>({
      path: `/bookings/${bookingId}`,
      body: payload,
    });
  }
}
