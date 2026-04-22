import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  AdminStudentDialogData,
  AdminStudentDialogResult,
} from '../../models/admin-student.models';

@Component({
  selector: 'app-admin-student-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
  ],
  /** Required so `DateAdapter` is available when this dialog opens in the CDK overlay injector. */
  providers: [provideNativeDateAdapter()],
  templateUrl: './student-dialog.component.html',
  styleUrl: './student-dialog.component.scss',
})
export class StudentDialogComponent {
  private readonly _dialogRef = inject(
    MatDialogRef<StudentDialogComponent, AdminStudentDialogResult>,
  );

  readonly data = inject<AdminStudentDialogData>(MAT_DIALOG_DATA);
  readonly formError = signal('');
  readonly hidePassword = signal(true);
  readonly editPasswordEnabled = signal(false);

  readonly firstNameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly lastNameControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  readonly passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.minLength(8)],
  });
  readonly statusControl = new FormControl<'active' | 'inactive'>('active', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly groupIdControl = new FormControl<string>('', { nonNullable: true });
  readonly notesControl = new FormControl('', { nonNullable: true });
  /** Next payment date (Material datepicker uses `Date`; persisted as ISO string on save). */
  readonly nextPaymentDateControl = new FormControl<Date | null>(null, {
    validators: [Validators.required],
  });
  readonly nextPaymentAmountControl = new FormControl(0, {
    nonNullable: true,
    validators: [Validators.min(0)],
  });

  constructor() {
    if (!this.data.student) {
      return;
    }
    const s = this.data.student;
    this.firstNameControl.setValue(s.firstName);
    this.lastNameControl.setValue(s.lastName);
    this.emailControl.setValue(s.email);
    this.statusControl.setValue(s.status);
    this.groupIdControl.setValue(s.groupId ?? '');
    this.notesControl.setValue(s.notes ?? '');
    this.nextPaymentDateControl.setValue(
      s.nextPaymentDate ? new Date(s.nextPaymentDate) : null,
    );
    this.nextPaymentAmountControl.setValue(s.nextPaymentAmount);
  }

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  togglePasswordVisibility(): void {
    this.hidePassword.update((value) => !value);
  }

  toggleEditPassword(): void {
    const enabled = !this.editPasswordEnabled();
    this.editPasswordEnabled.set(enabled);
    if (!enabled) {
      this.passwordControl.setValue('');
      this.passwordControl.markAsPristine();
      this.passwordControl.markAsUntouched();
    }
  }

  submit() {
    this.formError.set('');
    const isCreateMode = !this.isEditMode;
    const password = this.passwordControl.value.trim();
    const isUpdatingPassword =
      (isCreateMode || this.editPasswordEnabled()) && password.length >= 8;
    if (
      this.firstNameControl.invalid ||
      this.lastNameControl.invalid ||
      this.emailControl.invalid ||
      this.statusControl.invalid ||
      this.nextPaymentDateControl.invalid ||
      this.nextPaymentAmountControl.invalid ||
      (isCreateMode && password.length < 8)
    ) {
      this.formError.set('Please complete all required fields correctly.');
      return;
    }

    const paymentDate = this.nextPaymentDateControl.value;
    if (!paymentDate) {
      this.formError.set('Please select the next payment date.');
      return;
    }

    const groupId = this.groupIdControl.value.trim();
    this._dialogRef.close({
      draft: {
        firstName: this.firstNameControl.value,
        lastName: this.lastNameControl.value,
        email: this.emailControl.value,
        status: this.statusControl.value,
        ...(isUpdatingPassword ? { password } : {}),
        groupId: groupId ? groupId : null,
        notes: this.notesControl.value,
        nextPaymentDate: paymentDate.toISOString(),
        nextPaymentAmount: this.nextPaymentAmountControl.value,
      },
    });
  }
}
