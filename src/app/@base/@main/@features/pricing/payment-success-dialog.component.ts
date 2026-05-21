import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-payment-success-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule, TranslateModule],
  template: `
    <div class="payment-success-dialog">
      <div class="payment-success-dialog__icon-wrap">
        <mat-icon class="payment-success-dialog__icon">check_circle</mat-icon>
      </div>
      <h2 mat-dialog-title>{{ 'pages.pricing.paymentSuccessDialog.title' | translate }}</h2>
      <mat-dialog-content>
        <p>{{ 'pages.pricing.paymentSuccessDialog.message1' | translate }}</p>
        <p>{{ 'pages.pricing.paymentSuccessDialog.message2' | translate }}</p>
        <p>{{ 'pages.pricing.paymentSuccessDialog.message3' | translate }}</p>
        <div class="email-box">
          <a class="v" href="mailto:FluentiaAcademy@outlook.com">FluentiaAcademy&#64;outlook.com</a>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-flat-button color="primary" [mat-dialog-close]="true">
          {{ 'pages.pricing.paymentSuccessDialog.close' | translate }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    .v {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 44px;
      padding: 0 16px;
      word-break: break-all;
      color: #0b57d0;
      font-weight: 600;
      text-decoration: none;
      border-radius: 12px;
      border: 1px solid rgba(11, 87, 208, 0.2);
      background: #ffffff;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .v:hover {
      box-shadow: 0 8px 20px rgba(11, 87, 208, 0.18);
      transform: translateY(-1px);
    }
    .v:focus-visible {
      outline: 2px solid #0b57d0;
      outline-offset: 3px;
    }
    .payment-success-dialog {
      width: min(460px, 92vw);
      padding: 16px 14px 12px;
      text-align: center;
      border-radius: 20px;
      background: linear-gradient(180deg, #f8fbff 0%, #f4fff8 100%);
    }
    .payment-success-dialog__icon-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 10px;
    }
    .payment-success-dialog__icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #4caf50;
    }
    h2[mat-dialog-title] {
      text-align: center;
      margin-bottom: 8px;
      font-size: 1.4rem;
      font-weight: 700;
    }
    mat-dialog-content {
      margin: 0;
      padding: 0 6px;
      display: grid;
      gap: 8px;
      justify-items: center;
    }
    mat-dialog-content p {
      font-size: 1rem;
      line-height: 1.6;
      margin: 0;
      color: #233443;
    }
    .email-box {
      width: 100%;
      margin-top: 8px;
      display: flex;
      justify-content: center;
      padding: 14px 10px;
      border-radius: 14px;
      background: rgba(11, 87, 208, 0.06);
      border: 1px dashed rgba(11, 87, 208, 0.28);
    }
    mat-dialog-actions {
      padding: 10px 6px 4px;
      justify-content: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSuccessDialogComponent {}
