import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { ExternalService } from '@base/@external/services/external/external.service';
import { BaseComponent } from '@shared/components/base/base.component';
import { ActionButtonComponent } from '@shared/components/buttons/action-button/action-button.component';
import { FormErrorsComponent } from '@shared/components/forms/form-errors/form-errors.component';
import { finalize, timeout } from 'rxjs';
import { ResetPasswordForm } from '../interfaces/login.interface';

const FORGOT_PASSWORD_STATIC_NOTICE =
  'Please call your Fluentia admin to change your password.';

@Component({
  selector: 'app-reset-password',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ActionButtonComponent,
    FormErrorsComponent,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export default class ResetPasswordComponent extends BaseComponent {
  private _externalService = inject(ExternalService);
  private _destroyRef = inject(DestroyRef);

  readonly resetHash = signal<string | null>(null);
  readonly forgotPasswordNotice = FORGOT_PASSWORD_STATIC_NOTICE;

  resetForm!: FormGroup<ResetPasswordForm>;

  constructor() {
    super();
    this._initForms();
    this._activatedRoute.queryParamMap
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((params) => {
        this.resetHash.set(params.get('hash'));
      });
  }

  /**
   * Determines whether page is in reset mode using hash query param.
   */
  isResetMode(): boolean {
    return !!this.resetHash();
  }

  /**
   * Initializes forgot/reset form controls.
   */
  private _initForms() {
    this.resetForm = this._formBuilder.group({
      password: this._formBuilder.control('', {
        validators: [Validators.required, Validators.minLength(6)],
        nonNullable: true,
      }),
      confirmPassword: this._formBuilder.control('', {
        validators: [Validators.required, Validators.minLength(6)],
        nonNullable: true,
      }),
    });
  }

  /**
   * Resets password using backend hash + new password payload.
   */
  submitNewPassword() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    const hash = this.resetHash();
    if (!hash) {
      this._toast.showError('Reset link is invalid or missing hash');
      return;
    }

    const { password, confirmPassword } = this.resetForm.getRawValue();
    if (password !== confirmPassword) {
      this._toast.showError('Password confirmation does not match');
      return;
    }

    this._isLoading.set(true);

    this._externalService
      .resetPassword({
        hash,
        password,
      })
      .pipe(
        timeout(this._defaultTimeout),
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this._toast.showSuccess('Password reset completed. Please login.');
          this._router.navigateByUrl('/external/login');
        },
      });
  }
}
