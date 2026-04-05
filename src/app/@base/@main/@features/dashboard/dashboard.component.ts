import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { BaseComponent } from '@shared/components/base/base.component';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { Enrollment, Payment, StudentAnswer } from '@shared/interfaces/learning/learning.interface';
import { EnrollmentsService } from '@shared/services/learning/enrollments.service';
import { PaymentsService } from '@shared/services/learning/payments.service';
import { StudentAnswersService } from '@shared/services/learning/student-answers.service';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [ScrollRevealContainerDirective],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DashboardComponent extends BaseComponent {
  private _enrollmentsService = inject(EnrollmentsService);
  private _studentAnswersService = inject(StudentAnswersService);
  private _paymentsService = inject(PaymentsService);

  readonly currentUser = this._userService.currentUser;
  readonly enrollments = signal<Enrollment[]>([]);
  readonly answers = signal<StudentAnswer[]>([]);
  readonly payments = signal<Payment[]>([]);
  readonly isLoading = signal(false);

  readonly averageProgress = computed(() => {
    const list = this.enrollments();
    if (!list.length) {
      return 0;
    }

    const total = list.reduce((sum, item) => sum + Number(item.progress ?? 0), 0);
    return Math.round(total / list.length);
  });

  readonly completedEnrollments = computed(
    () => this.enrollments().filter((item) => item.status === 'completed').length,
  );
  readonly correctAnswerRate = computed(() => {
    const list = this.answers();
    if (!list.length) {
      return 0;
    }

    const correct = list.filter((answer) => answer.isCorrect).length;
    return Math.round((correct / list.length) * 100);
  });
  readonly totalPaid = computed(() =>
    this.payments().reduce((sum, payment) => sum + Number(payment.amount), 0),
  );

  constructor() {
    super();
    this.loadDashboardData();
  }

  /**
   * Loads dashboard aggregates from backend resources.
   */
  loadDashboardData(): void {
    this.isLoading.set(true);

    forkJoin({
      enrollments: this._enrollmentsService.getEnrollments({ page: 1, limit: 50 }),
      answers: this._studentAnswersService.getStudentAnswers({ page: 1, limit: 50 }),
      payments: this._paymentsService.getMyPayments({ page: 1, limit: 50 }),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ enrollments, answers, payments }) => {
          this.enrollments.set(enrollments.data ?? []);
          this.answers.set(answers.data ?? []);
          this.payments.set(payments.data ?? []);
        },
      });
  }
}
