import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { ExternalService } from '@base/@external/services/external/external.service';
import { BaseComponent } from '@shared/components/base/base.component';
import { ActionButtonComponent } from '@shared/components/buttons/action-button/action-button.component';
import { FormErrorsComponent } from '@shared/components/forms/form-errors/form-errors.component';
import { finalize, timeout } from 'rxjs';
import { RegisterForm } from '../interfaces/login.interface';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ActionButtonComponent,
    FormErrorsComponent,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export default class RegisterComponent extends BaseComponent {
  private _externalService = inject(ExternalService);
  private _destroyRef = inject(DestroyRef);

  form!: FormGroup<RegisterForm>;

  constructor() {
    super();
    this._initForm();
  }

  /**
   * Initializes register form controls and constraints.
   */
  private _initForm() {
    this.form = this._formBuilder.group({
      firstName: this._formBuilder.control('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      lastName: this._formBuilder.control('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      email: this._formBuilder.control('', {
        validators: [Validators.required, Validators.email],
        nonNullable: true,
      }),
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
   * Submits registration payload to backend register endpoint.
   */
  register() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { firstName, lastName, email, password, confirmPassword } =
      this.form.getRawValue();

    if (password !== confirmPassword) {
      this._toast.showError('Password confirmation does not match');
      return;
    }

    this._isLoading.set(true);

    this._externalService
      .register({
        firstName,
        lastName,
        email,
        password,
      })
      .pipe(
        timeout(this._defaultTimeout),
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this._toast.showSuccess('Account created successfully. Please login.');
          this._router.navigateByUrl('/external/login');
        },
      });
  }
}
