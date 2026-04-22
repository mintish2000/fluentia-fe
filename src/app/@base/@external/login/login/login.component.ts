import { CdkTrapFocus } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { ExternalService } from '@base/@external/services/external/external.service';
import { BaseComponent } from '@shared/components/base/base.component';
import { ActionButtonComponent } from '@shared/components/buttons/action-button/action-button.component';
import { FormErrorsComponent } from '@shared/components/forms/form-errors/form-errors.component';
import { finalize, timeout } from 'rxjs';
import { LoginForm } from '../interfaces/login.interface';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    RouterModule,
    CdkTrapFocus,
    ReactiveFormsModule,
    FormErrorsComponent,
    ActionButtonComponent,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export default class LoginComponent extends BaseComponent {
  private _externalService = inject(ExternalService);
  private _destroyRef = inject(DestroyRef);
  private readonly _rememberedEmailKey = 'remembered-auth-email';

  form!: FormGroup<LoginForm>;
  hide = signal<boolean>(true);

  constructor() {
    super();
    this._initForm();
    this._restoreRememberedEmail();
  }

  /**
   * Initializes login form controls and validation rules.
   */
  private _initForm() {
    this.form = this._formBuilder.group({
      email: this._formBuilder.control('', {
        validators: [Validators.required, Validators.email],
        nonNullable: true,
      }),
      password: this._formBuilder.control('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      rememberMe: this._formBuilder.control(false, {
        nonNullable: true,
      }),
    });
  }

  /**
   * Handles form submission from keyboard interaction.
   */
  onSubmit() {
    this.authenticate();
  }

  /**
   * Opens the public home page without signing in.
   */
  continueAsGuest(): void {
    void this._router.navigateByUrl('/main/home');
  }

  /**
   * Authenticates user with email/password against backend.
   * Ignores duplicate submissions while a request is in flight (avoids double fire from submit + click).
   */
  authenticate() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this._isLoading()) {
      return;
    }

    const { email, password } = this.form.getRawValue();
    this._isLoading.set(true);

    this._externalService
      .login({ email, password })
      .pipe(
        timeout(this._defaultTimeout),
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this._isLoading.set(false)),
      )
      .subscribe({
        next: (res) => {
          this._persistRememberedEmail();
          this._authService.handleLoggedInUser(res);
          this._toast.showSuccess('Authenticated successfully');
          this._authService.handleLoggedInUserRedirection();
        },
      });
  }

  /**
   * Toggles password field visibility.
   */
  togglePassword() {
    this.hide.update((prev: boolean) => !prev);
  }

  /**
   * Prevents suffix click bubbling while toggling password visibility.
   * @param event click event from suffix icon
   */
  onTogglePasswordClick(event: MouseEvent) {
    this.togglePassword();
    event.stopPropagation();
  }

  /**
   * Restores remembered email for faster authentication.
   */
  private _restoreRememberedEmail() {
    const rememberedEmail =
      this._localStorageService.getItem<string>(this._rememberedEmailKey);

    if (!rememberedEmail) {
      return;
    }

    this.form.patchValue({
      email: rememberedEmail,
      rememberMe: true,
    });
  }

  /**
   * Persists or removes remembered email based on form preference.
   */
  private _persistRememberedEmail() {
    const { email, rememberMe } = this.form.getRawValue();

    if (rememberMe) {
      this._localStorageService.setItem(this._rememberedEmailKey, email);
      return;
    }

    this._localStorageService.removeItems([this._rememberedEmailKey]);
  }
}
