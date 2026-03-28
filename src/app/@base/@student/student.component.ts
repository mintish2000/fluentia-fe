import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CoreModule } from '@core/core.module';
import { BaseComponent } from '@shared/components/base/base.component';
import { Booking, Enrollment } from '@shared/interfaces/learning/learning.interface';
import { BookingsService } from '@shared/services/learning/bookings.service';
import { EnrollmentsService } from '@shared/services/learning/enrollments.service';
import { PlacementTestService } from '@shared/services/learning/placement-test.service';
import { PaymentsService } from '@shared/services/learning/payments.service';
import { finalize, forkJoin } from 'rxjs';

@Component({
  selector: 'app-student',
  imports: [CoreModule, RouterLink],
  templateUrl: './student.component.html',
  styleUrl: './student.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class StudentComponent extends BaseComponent {
  private _enrollmentsService = inject(EnrollmentsService);
  private _bookingsService = inject(BookingsService);
  private _paymentsService = inject(PaymentsService);
  private _placementTestService = inject(PlacementTestService);
  private _destroyRef = inject(DestroyRef);

  readonly currentUser = this._userService.currentUser;
  readonly displayName = computed(() => this.currentUser()?.name || 'Student');
  readonly isLoading = this._isLoading;
  readonly lastSyncedAt = signal<Date | null>(null);
  readonly studentEnrollments = signal<Enrollment[]>([]);
  readonly studentBookings = signal<Booking[]>([]);
  readonly hasEnrollments = computed(() => this.studentEnrollments().length > 0);
  readonly hasBookings = computed(() => this.studentBookings().length > 0);
  readonly activeEnrollmentsCount = computed(
    () =>
      this.studentEnrollments().filter(
        (enrollment) => (enrollment.status || '').toLowerCase() === 'active',
      ).length,
  );
  readonly enrolledCoursesCount = signal(0);
  readonly activeBookingsCount = signal(0);
  readonly completedEnrollmentsCount = signal(0);
  readonly averageProgress = signal(0);
  readonly paymentsCount = signal(0);
  readonly shouldShowPlacementEntry = this._placementTestService.shouldShowPlacementEntry;

  constructor() {
    super();
    this._placementTestService.refreshStatus();
    this._loadStudentOverview();
  }

  /**
   * Loads student overview counters from existing APIs.
   */
  private _loadStudentOverview() {
    const studentId = this.currentUser()?.id;
    if (!studentId) {
      return;
    }

    this._isLoading.set(true);

    forkJoin({
      enrollments: this._enrollmentsService.getEnrollments(),
      bookings: this._bookingsService.getBookings(),
      payments: this._paymentsService.getMyPayments(),
    })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (response) => {
          const studentEnrollments = response.enrollments.data.filter(
            (enrollment) => String(enrollment.student?.id) === String(studentId),
          );
          const studentBookings = response.bookings.data.filter(
            (booking) => String(booking.student?.id) === String(studentId),
          );
          const completedEnrollments = studentEnrollments.filter(
            (enrollment) => (enrollment.status || '').toLowerCase() === 'completed',
          );
          const progressValues = studentEnrollments
            .map((enrollment) => Number(enrollment.progress ?? 0))
            .filter((progress) => !Number.isNaN(progress));
          const progressAverage = progressValues.length
            ? Math.round(
                progressValues.reduce((sum, value) => sum + value, 0) /
                  progressValues.length,
              )
            : 0;

          this.enrolledCoursesCount.set(studentEnrollments.length);
          this.studentEnrollments.set(
            studentEnrollments
              .slice()
              .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
          );
          this.studentBookings.set(
            studentBookings
              .slice()
              .sort((a, b) => Date.parse(b.bookingDate) - Date.parse(a.bookingDate)),
          );
          this.activeBookingsCount.set(studentBookings.length);
          this.completedEnrollmentsCount.set(completedEnrollments.length);
          this.averageProgress.set(progressAverage);
          this.paymentsCount.set(response.payments.data.length);
          this.lastSyncedAt.set(new Date());
        },
      });
  }

  /**
   * Reloads student overview data from backend.
   */
  refreshOverview() {
    this._loadStudentOverview();
  }
}
