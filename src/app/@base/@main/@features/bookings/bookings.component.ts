import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Booking } from '@shared/interfaces/learning/learning.interface';
import { BookingsService } from '@shared/services/learning/bookings.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-bookings',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bookings.component.html',
  styleUrl: './bookings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class BookingsComponent {
  private _bookingsService = inject(BookingsService);

  readonly isLoading = signal(false);
  readonly hasNextPage = signal(false);
  readonly page = signal(1);
  readonly bookings = signal<Booking[]>([]);
  readonly hasBookings = computed(() => this.bookings().length > 0);

  constructor() {
    this.loadBookings();
  }

  /**
   * Loads paginated booking list for current user context.
   */
  loadBookings(): void {
    this.isLoading.set(true);
    this._bookingsService
      .getBookings({
        page: this.page(),
        limit: 10,
      })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (response) => {
          this.bookings.set(response.data ?? []);
          this.hasNextPage.set(response.hasNextPage);
        },
      });
  }

  /**
   * Advances booking pagination page.
   */
  nextPage(): void {
    if (!this.hasNextPage()) {
      return;
    }

    this.page.update((value) => value + 1);
    this.loadBookings();
  }

  /**
   * Goes to previous booking page.
   */
  previousPage(): void {
    if (this.page() <= 1) {
      return;
    }

    this.page.update((value) => value - 1);
    this.loadBookings();
  }
}
