import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { GroupDialogData, GroupDialogResult } from '../../models/admin-group.models';

@Component({
  selector: 'app-admin-group-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './group-dialog.component.html',
  styleUrl: './group-dialog.component.scss',
})
export class GroupDialogComponent {
  private readonly _dialogRef = inject(MatDialogRef<GroupDialogComponent, GroupDialogResult>);
  private readonly _fb = inject(FormBuilder);

  readonly data = inject<GroupDialogData>(MAT_DIALOG_DATA);

  /** Form for create / edit student group (name, description, link). */
  readonly form = this._fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(120)]],
    description: ['', [Validators.maxLength(2000)]],
    link: [
      '',
      [Validators.required, Validators.pattern(/^https?:\/\/.+/i), Validators.maxLength(2000)],
    ],
  });

  constructor() {
    const g = this.data.group;
    if (!g) {
      return;
    }
    this.form.patchValue({
      name: g.name,
      description: g.description,
      link: g.link,
    });
  }

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this._dialogRef.close({
      draft: {
        name: v.name.trim(),
        description: v.description.trim(),
        link: v.link.trim(),
      },
    });
  }
}
