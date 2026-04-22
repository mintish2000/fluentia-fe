import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import {
  PRICING_PLAN_DETAILS,
  type PricingPlanId,
} from '@shared/constants/pricing-plans';
import { PaypalCheckoutService } from '@shared/services/paypal/paypal-checkout.service';
import {
  PaymentsService,
  type RecordMyPaymentPayload,
} from '@shared/services/learning/payments.service';
import { ToastService } from '@shared/services/toast/toast.service';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
import { StudentHubService } from '@base/@student/student-hub.service';
import { PlacementTestService } from '@shared/services/learning/placement-test.service';
import { UserService } from '@shared/services/user/user.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollRevealContainerDirective],
})
export default class PricingComponent {
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);
  private readonly _toast = inject(ToastService);
  private readonly _paypal = inject(PaypalCheckoutService);
  private readonly _paymentsService = inject(PaymentsService);
  private readonly _studentHubService = inject(StudentHubService);
  private readonly _placementTestService = inject(PlacementTestService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly checkoutPlan = signal<PricingPlanId | null>(null);
  readonly isCheckingStudentCourses = signal(false);
  readonly hasStudentEnrollments = signal(true);
  readonly hasActiveStudentPayment = signal(false);
  readonly paymentSaveError = signal<string | null>(null);
  readonly isRetryingPaymentSave = signal(false);
  readonly shouldShowPlacementEntry = this._placementTestService.shouldShowPlacementEntry;
  readonly shouldShowNoCoursesMessage = computed(
    () =>
      this._userService.isAuthenticated() &&
      this._userService.isStudentSignal() &&
      this.shouldShowPlacementEntry() &&
      !this.isCheckingStudentCourses() &&
      !this.hasStudentEnrollments(),
  );
  private readonly _paypalHost = viewChild<ElementRef<HTMLElement>>('paypalHost');

  private _mountedPlan: PricingPlanId | null = null;
  private _mountedEl: HTMLElement | null = null;
  private _pendingPaymentPayload = signal<RecordMyPaymentPayload | null>(null);

  constructor() {
    this._placementTestService.refreshStatus();
    this._loadStudentHubForPricing();

    effect(() => {
      const plan = this.checkoutPlan();
      const ref = this._paypalHost();
      if (!plan || !ref) {
        this._mountedPlan = null;
        this._mountedEl = null;
        return;
      }
      const el = ref.nativeElement;
      if (
        this._mountedPlan === plan &&
        this._mountedEl === el &&
        el.childElementCount > 0
      ) {
        return;
      }
      this._mountedPlan = plan;
      this._mountedEl = el;
      untracked(() => {
        void this._paypal
          .renderButtons(el, plan, {
            onSuccess: (ctx) => {
              const planDetail = PRICING_PLAN_DETAILS[plan];
              if (!planDetail) {
                this._toast.showError('Unknown product.');
                return;
              }
              this.persistPaymentRecord({
                amount: Number.parseFloat(planDetail.amount),
                currency: environment.paypalCurrency ?? 'USD',
                providerReference: ctx.providerReference,
              });
            },
          })
          .catch(() =>
            this._toast.showError(
              'Could not load PayPal checkout. Check paypalClientId in environment.',
            ),
          );
      });
    });
  }

  /**
   * Uses {@code GET /student/hub} — group assignment replaces legacy enrollment listing.
   */
  private _loadStudentHubForPricing(): void {
    const user = this._userService.currentUser();
    if (!user || !this._userService.isStudentSignal()) {
      this.hasStudentEnrollments.set(true);
      this.hasActiveStudentPayment.set(false);
      return;
    }

    this.isCheckingStudentCourses.set(true);
    this._studentHubService
      .getHub()
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: (hub) => {
          this.hasActiveStudentPayment.set(
            (hub.status ?? '').trim().toLowerCase() === 'active',
          );
          this.hasStudentEnrollments.set(hub.group != null);
          this.isCheckingStudentCourses.set(false);
        },
        error: () => {
          this.hasActiveStudentPayment.set(false);
          this.hasStudentEnrollments.set(true);
          this.isCheckingStudentCourses.set(false);
        },
      });
  }

  planSummary(planId: PricingPlanId): string {
    const p = PRICING_PLAN_DETAILS[planId];
    return p
      ? `${p.description} ($${p.amount} ${environment.paypalCurrency})`
      : planId;
  }

  closeCheckout(): void {
    this.checkoutPlan.set(null);
    this.paymentSaveError.set(null);
    this.isRetryingPaymentSave.set(false);
    this._pendingPaymentPayload.set(null);
    this._mountedPlan = null;
    this._mountedEl = null;
  }

  retrySavePayment(): void {
    const payload = this._pendingPaymentPayload();
    if (!payload || this.isRetryingPaymentSave()) {
      return;
    }

    this.persistPaymentRecord(payload, { isRetry: true });
  }

  buyNow(planId: PricingPlanId): void {

    if (this.hasActiveStudentPayment()) {
      this._toast.showError(
        'Your payment is still active. You can buy a new package after your current one ends.',
      );
      return;
    }

    if (!this._userService.isAuthenticated()) {
      void this._router.navigateByUrl('/external/login');
      return;
    }

    const hosted = environment.paypalHostedCheckoutUrlByPlan[planId];
    if (hosted) {
      window.open(hosted, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!this._paypal.clientId) {
      this._toast.showError(
        'PayPal is not configured. Set paypalClientId in src/environments/environment.ts (sandbox or live Client ID from developer.paypal.com).',
      );
      return;
    }

    this.paymentSaveError.set(null);
    this.isRetryingPaymentSave.set(false);
    this._pendingPaymentPayload.set(null);
    this.checkoutPlan.set(planId);
  }

  private persistPaymentRecord(
    payload: RecordMyPaymentPayload,
    options: { isRetry?: boolean } = {},
  ): void {
    const isRetry = options.isRetry === true;
    this.paymentSaveError.set(null);
    this.isRetryingPaymentSave.set(isRetry);

    this._paymentsService
      .recordMyPayment(payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.paymentSaveError.set(null);
          this.isRetryingPaymentSave.set(false);
          this._pendingPaymentPayload.set(null);
          this._toast.showSuccess('Payment successful. Thank you!');
          this.checkoutPlan.set(null);
          this._mountedPlan = null;
          this._mountedEl = null;
          this._loadStudentHubForPricing();
        },
        error: () => {
          this.isRetryingPaymentSave.set(false);
          this._pendingPaymentPayload.set(payload);
          this.paymentSaveError.set(
            'Payment went through PayPal, but we could not save your receipt yet.',
          );
          this._toast.showError(
            'Payment went through PayPal, but we could not save your receipt. Please retry now or contact support with your PayPal confirmation.',
          );
        },
      });
  }
}
