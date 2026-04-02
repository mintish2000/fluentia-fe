import { Injectable, inject } from '@angular/core';
import { environment } from '@environments/environment';
import {
  PRICING_PLAN_DETAILS,
  type PricingPlanId,
} from '@shared/constants/pricing-plans';
import { ToastService } from '@shared/services/toast/toast.service';

type PayPalActions = {
  order: {
    create: (payload: Record<string, unknown>) => Promise<string>;
    capture: () => Promise<unknown>;
  };
};

@Injectable({ providedIn: 'root' })
export class PaypalCheckoutService {
  private readonly _toast = inject(ToastService);
  private _scriptPromise: Promise<void> | null = null;

  get clientId(): string {
    return environment.paypalClientId?.trim() ?? '';
  }

  /**
   * Loads PayPal JS SDK once. Requires `paypalClientId` in environment.
   */
  loadScript(): Promise<void> {
    const clientId = this.clientId;
    if (!clientId || typeof window === 'undefined') {
      return Promise.reject(new Error('PayPal client ID is not configured.'));
    }
    const w = window as Window & { paypal?: { Buttons: (o: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void> } } };
    if (w.paypal) {
      return Promise.resolve();
    }
    if (this._scriptPromise) {
      return this._scriptPromise;
    }
    const currency = environment.paypalCurrency ?? 'USD';
    this._scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        this._scriptPromise = null;
        reject(new Error('Failed to load PayPal.'));
      };
      document.body.appendChild(script);
    });
    return this._scriptPromise;
  }

  /**
   * Renders Smart Payment Buttons (create + capture on the client).
   * For production hardening, create/capture on your API instead.
   */
  async renderButtons(
    container: HTMLElement,
    planId: PricingPlanId,
    handlers: { onSuccess: () => void },
  ): Promise<void> {
    const plan = PRICING_PLAN_DETAILS[planId];
    if (!plan) {
      this._toast.showError('Unknown product.');
      return;
    }

    await this.loadScript();
    const w = window as Window & { paypal?: { Buttons: (o: Record<string, unknown>) => { render: (el: HTMLElement) => Promise<void> } } };
    const paypal = w.paypal;
    if (!paypal) {
      this._toast.showError('PayPal could not be loaded.');
      return;
    }

    container.replaceChildren();
    const currency = environment.paypalCurrency ?? 'USD';

    const buttons = paypal.Buttons({
      style: { layout: 'vertical', shape: 'rect', label: 'paypal' },
      createOrder: (_data: unknown, actions: PayPalActions) =>
        actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: plan.amount,
              },
              description: plan.description,
              custom_id: planId,
            },
          ],
        }),
      onApprove: (_data: unknown, actions: PayPalActions) =>
        actions.order.capture().then(() => {
          handlers.onSuccess();
        }),
      onError: (err: { message?: string } | Error) => {
        const msg =
          err && typeof err === 'object' && 'message' in err
            ? String(err.message)
            : 'PayPal could not complete checkout.';
        this._toast.showError(msg);
      },
    });

    await buttons.render(container);
  }
}
