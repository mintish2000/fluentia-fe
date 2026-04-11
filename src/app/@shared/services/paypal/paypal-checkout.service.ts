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

export type PaypalCheckoutSuccessContext = {
  /** PayPal capture id ({@code purchase_units[0].payments.captures[0].id}), else order id fallback. */
  providerReference: string;
};

/**
 * Reads capture id from Orders API capture response; falls back to top-level order {@code id}.
 */
function extractPayPalProviderReference(details: unknown): string {
  if (!details || typeof details !== 'object') {
    return '';
  }
  const d = details as Record<string, unknown>;
  const units = d['purchase_units'];
  if (Array.isArray(units) && units[0] && typeof units[0] === 'object') {
    const pu = units[0] as Record<string, unknown>;
    const payments = pu['payments'];
    if (payments && typeof payments === 'object') {
      const captures = (payments as Record<string, unknown>)['captures'];
      if (Array.isArray(captures) && captures[0] && typeof captures[0] === 'object') {
        const id = (captures[0] as Record<string, unknown>)['id'];
        if (typeof id === 'string' && id.length > 0) {
          return id;
        }
      }
    }
  }
  const orderId = d['id'];
  return typeof orderId === 'string' ? orderId : '';
}

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
    handlers: { onSuccess: (ctx: PaypalCheckoutSuccessContext) => void },
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
      style: {
        layout: 'vertical',
        shape: 'pill',
        label: 'paypal',
        height: 48,
        borderRadius: 14,
      },
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
        actions.order.capture().then((details: unknown) => {
          const providerReference = extractPayPalProviderReference(details);
          handlers.onSuccess({
            providerReference: providerReference || 'paypal-capture-unknown',
          });
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
