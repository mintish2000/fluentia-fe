import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '@environments/environment';
import {
  PRICING_PLAN_DETAILS,
  type PricingPlanId,
} from '@shared/constants/pricing-plans';
import { PaypalCheckoutService } from '@shared/services/paypal/paypal-checkout.service';
import { ToastService } from '@shared/services/toast/toast.service';
import { ScrollRevealContainerDirective } from '@shared/directives/scroll-reveal-container.directive';
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

  readonly checkoutPlan = signal<PricingPlanId | null>(null);
  private readonly _paypalHost = viewChild<ElementRef<HTMLElement>>('paypalHost');

  private _mountedPlan: PricingPlanId | null = null;
  private _mountedEl: HTMLElement | null = null;

  constructor() {
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
            onSuccess: () => {
              this._toast.showSuccess('Payment successful. Thank you!');
              this.checkoutPlan.set(null);
              this._mountedPlan = null;
              this._mountedEl = null;
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

  planSummary(planId: PricingPlanId): string {
    const p = PRICING_PLAN_DETAILS[planId];
    return p
      ? `${p.description} ($${p.amount} ${environment.paypalCurrency})`
      : planId;
  }

  closeCheckout(): void {
    this.checkoutPlan.set(null);
    this._mountedPlan = null;
    this._mountedEl = null;
  }

  buyNow(planId: PricingPlanId): void {
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

    this.checkoutPlan.set(planId);
  }
}
