import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { Direction } from '@angular/cdk/bidi';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

export type ToastNotifyActions = "success" | "warning" | "danger" | "info"

interface ToastDialogData {
  message: string;
  title: string;
  action: ToastNotifyActions
}

@Component({
  selector: 'app-toasters',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslateModule,
    MatDialogModule
  ],
  templateUrl: './toasters.component.html',
  styleUrl: './toasters.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastersComponent {
  private _translate = inject(TranslateService);
  readonly sbRef = inject(MatSnackBarRef<ToastersComponent>);
  readonly data = inject<ToastDialogData>(MAT_SNACK_BAR_DATA);

  get direction(): Direction {
    return this._translate.currentLang === 'ar' ? 'rtl' : 'ltr';
  }

  close() {
    this.sbRef.dismiss();
  }
}


