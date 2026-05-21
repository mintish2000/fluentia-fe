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
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { PaymentSuccessDialogComponent } from './payment-success-dialog.component';

@Component({
  selector: 'app-pricing',
  standalone: true,
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ScrollRevealContainerDirective, TranslateModule],
})
export default class PricingComponent {
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);
  private readonly _toast = inject(ToastService);
  private readonly _paypal = inject(PaypalCheckoutService);
  private readonly _paymentsService = inject(PaymentsService);
  private readonly _studentHubService = inject(StudentHubService);
  private readonly _placementTestService = inject(PlacementTestService);
  private readonly _translate = inject(TranslateService);
  private readonly _dialog = inject(MatDialog);
  private readonly _destroyRef = inject(DestroyRef);

  readonly checkoutPlan = signal<PricingPlanId | null>(null);
  readonly paymentChoicePlan = signal<PricingPlanId | null>(null);
  readonly cliqPlan = signal<PricingPlanId | null>(null);
  /** Derived from the shared hub signal — no manual set() needed. */
  readonly isCheckingStudentCourses = computed(() => this._studentHubService.isLoading());
  readonly hasStudentEnrollments = computed(() => {
    const hub = this._studentHubService.hub();
    return hub === null || hub.group != null;
  });
  readonly hasActiveStudentPayment = computed(() => {
    const hub = this._studentHubService.hub();
    return hub !== null && (hub.status ?? '').trim().toLowerCase() === 'active';
  });
  readonly paymentSaveError = signal<string | null>(null);
  readonly isRetryingPaymentSave = signal(false);
  readonly isSavingPayment = signal(false);
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
    // Load hub for authenticated students — service signal drives all derived state.
    if (this._userService.isAuthenticated() && this._userService.isStudentSignal()) {
      this._studentHubService.load().pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
    }
    // Pre-load the PayPal SDK in the background so it is already cached when
    // the user opens checkout — eliminates the script-fetch delay on first click.
    this._paypal.loadScript().catch(() => { /* will retry on demand */ });

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
              this.persistPaymentRecord({
                amount: ctx.amount,
                currency: ctx.currency,
                providerReference: ctx.providerReference,
              });
            },
          })
          .catch(() =>
            this._toast.showError(
              this._translate.instant('pages.pricing.errors.paypalLoadFailed'),
            ),
          );
      });
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

  closePaymentChoice(): void {
    this.paymentChoicePlan.set(null);
  }

  closeCliqPopup(): void {
    this.cliqPlan.set(null);
  }

  choosePaypal(planId: PricingPlanId): void {
    this.openPaypalFlow(planId);
  }

  chooseCliq(planId: PricingPlanId): void {
    this.paymentChoicePlan.set(null);
    this.cliqPlan.set(planId);
  }

  retrySavePayment(): void {
    const payload = this._pendingPaymentPayload();
    if (!payload || this.isRetryingPaymentSave()) {
      return;
    }

    this.persistPaymentRecord(payload, { isRetry: true });
  }

  buyNow(planId: PricingPlanId): void {
    if (this.hasActiveStudentPayment() && !planId.startsWith('private-')) {
      this._toast.showError(
        this._translate.instant('pages.pricing.errors.activePaymentExists'),
      );
      return;
    }

    if (!this._userService.isAuthenticated()) {
      void this._router.navigateByUrl('/external/login');
      return;
    }

    this.paymentSaveError.set(null);
    this.isRetryingPaymentSave.set(false);
    this._pendingPaymentPayload.set(null);
    this.paymentChoicePlan.set(planId);
  }

  private openPaypalFlow(planId: PricingPlanId): void {
    this.paymentChoicePlan.set(null);
    this.cliqPlan.set(null);

    const hosted = environment.paypalHostedCheckoutUrlByPlan[planId];
    if (hosted) {
      window.open(hosted, '_blank', 'noopener,noreferrer');
      return;
    }

    if (!this._paypal.clientId) {
      this._toast.showError(
        this._translate.instant('pages.pricing.errors.paypalNotConfigured'),
      );
      return;
    }

    this.checkoutPlan.set(planId);
  }

  private persistPaymentRecord(
    payload: RecordMyPaymentPayload,
    options: { isRetry?: boolean } = {},
  ): void {
    const isRetry = options.isRetry === true;
    this.paymentSaveError.set(null);
    this.isRetryingPaymentSave.set(isRetry);
    this.isSavingPayment.set(true);

    this._paymentsService
      .recordMyPayment(payload)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: () => {
          this.paymentSaveError.set(null);
          this.isRetryingPaymentSave.set(false);
          this.isSavingPayment.set(false);
          this._pendingPaymentPayload.set(null);
          // Open the dialog before clearing the checkout so there is no
          // frame where neither the checkout nor the dialog is visible.
          this._dialog.open(PaymentSuccessDialogComponent, {
            width: '420px',
            disableClose: false,
          });
          this.checkoutPlan.set(null);
          this._mountedPlan = null;
          this._mountedEl = null;
          // Reload hub bypassing cache — hub signal updates instantly for all consumers.
          this._studentHubService.load().pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
        },
        error: () => {
          this.isRetryingPaymentSave.set(false);
          this.isSavingPayment.set(false);
          this._pendingPaymentPayload.set(payload);
          this.paymentSaveError.set(
            this._translate.instant('pages.pricing.errors.receiptSaveFailedShort'),
          );
          this._toast.showError(
            this._translate.instant('pages.pricing.errors.receiptSaveFailed'),
          );
        },
      });
  }
}
