import { Injectable, NgZone, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '@environments/environment';
import { type PricingPlanId } from '@shared/constants/pricing-plans';
import { ToastService } from '@shared/services/toast/toast.service';
import { PaymentsService } from '@shared/services/learning/payments.service';

type PayPalButtonsConfig = {
  style?: Record<string, unknown>;
  createOrder: () => Promise<string>;
  onApprove: (data: { orderID: string }) => Promise<void>;
  onError: (err: unknown) => void;
};

export type PaypalCheckoutSuccessContext = {
  /** PayPal capture id returned by the backend after server-side capture. */
  providerReference: string;
  /** Captured amount as confirmed by the backend. */
  amount: number;
  /** Currency code as confirmed by the backend. */
  currency: string;
};

@Injectable({ providedIn: 'root' })
export class PaypalCheckoutService {
  private readonly _toast = inject(ToastService);
  private readonly _paymentsService = inject(PaymentsService);
  private readonly _ngZone = inject(NgZone);
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
    const w = window as Window & { paypal?: unknown };
    if (w.paypal) {
      return Promise.resolve();
    }
    if (this._scriptPromise) {
      return this._scriptPromise;
    }
    const currency = environment.paypalCurrency ?? 'USD';
    this._scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=capture&components=buttons`;
      script.async = true;
      (script as HTMLScriptElement & { fetchPriority: string }).fetchPriority = 'high';
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
   * Renders Smart Payment Buttons backed by server-side order create and capture.
   * The backend uses the PayPal secret key — it never reaches the browser.
   */
  async renderButtons(
    container: HTMLElement,
    planId: PricingPlanId,
    handlers: { onSuccess: (ctx: PaypalCheckoutSuccessContext) => void },
  ): Promise<void> {
    await this.loadScript();

    const w = window as Window & {
      paypal?: { Buttons: (cfg: PayPalButtonsConfig) => { render: (el: HTMLElement) => Promise<void> } };
    };
    const paypal = w.paypal;
    if (!paypal) {
      this._toast.showError('PayPal could not be loaded.');
      return;
    }

    container.replaceChildren();

    const buttons = paypal.Buttons({
      style: {
        layout: 'vertical',
        shape: 'pill',
        label: 'paypal',
        height: 48,
        borderRadius: 14,
      },
      // Order is created server-to-server; the secret never leaves the backend.
      createOrder: () =>
        firstValueFrom(this._paymentsService.createPaypalOrder({ planId })).then(
          (res) => res.orderId,
        ),
      // Capture is verified server-to-server; backend returns confirmed amount/currency.
      // NgZone.run() ensures Angular change detection fires so isSavingPayment
      // and other signals trigger the loading spinner in the template.
      onApprove: (data) =>
        firstValueFrom(
          this._paymentsService.capturePaypalOrder(data.orderID),
        ).then((capture) => {
          this._ngZone.run(() => {
            handlers.onSuccess({
              providerReference: capture.providerReference,
              amount: capture.amount,
              currency: capture.currency,
            });
          });
        }),
      onError: (err: unknown) => {
        this._ngZone.run(() => {
          const msg =
            err && typeof err === 'object' && 'message' in err
              ? String((err as { message: unknown }).message)
              : 'PayPal could not complete checkout.';
          this._toast.showError(msg);
        });
      },
    });

    await buttons.render(container);
  }
}
