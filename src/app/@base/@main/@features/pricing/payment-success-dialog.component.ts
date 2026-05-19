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
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-flat-button color="primary" [mat-dialog-close]="true">
          {{ 'pages.pricing.paymentSuccessDialog.close' | translate }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .payment-success-dialog {
      padding: 8px 4px 4px;
      text-align: center;
    }
    .payment-success-dialog__icon-wrap {
      display: flex;
      justify-content: center;
      margin-bottom: 8px;
    }
    .payment-success-dialog__icon {
      font-size: 56px;
      width: 56px;
      height: 56px;
      color: #4caf50;
    }
    h2[mat-dialog-title] {
      text-align: center;
    }
    mat-dialog-content p {
      font-size: 1rem;
      line-height: 1.6;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentSuccessDialogComponent {}
