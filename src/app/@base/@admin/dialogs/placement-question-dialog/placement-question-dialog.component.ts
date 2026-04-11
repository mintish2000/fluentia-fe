import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import {
  PlacementQuestionDialogData,
  PlacementQuestionDialogResult,
  PlacementQuestionType,
} from '../../models/admin-placement.models';
import { parseQuestionMeta } from '@shared/utils/learning/quiz.utils';

@Component({
  selector: 'app-placement-question-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
  ],
  templateUrl: './placement-question-dialog.component.html',
  styleUrl: './placement-question-dialog.component.scss',
})
export class PlacementQuestionDialogComponent {
  private readonly _dialogRef = inject(
    MatDialogRef<PlacementQuestionDialogComponent, PlacementQuestionDialogResult>,
  );

  readonly data = inject<PlacementQuestionDialogData>(MAT_DIALOG_DATA);

  readonly typeControl = new FormControl<PlacementQuestionType>('single', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly promptControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly optionAControl = new FormControl('', { nonNullable: true });
  readonly optionBControl = new FormControl('', { nonNullable: true });
  readonly optionCControl = new FormControl('', { nonNullable: true });
  readonly optionDControl = new FormControl('', { nonNullable: true });
  readonly correctAnswerControl = new FormControl('', { nonNullable: true });
  /** Marks which options are correct when type is `multi` (aligned with A–D slots). */
  readonly multiCorrectA = new FormControl(false, { nonNullable: true });
  readonly multiCorrectB = new FormControl(false, { nonNullable: true });
  readonly multiCorrectC = new FormControl(false, { nonNullable: true });
  readonly multiCorrectD = new FormControl(false, { nonNullable: true });
  readonly validationError = signal('');

  readonly options = computed(() =>
    [
      this.optionAControl.value.trim(),
      this.optionBControl.value.trim(),
      this.optionCControl.value.trim(),
      this.optionDControl.value.trim(),
    ].filter(Boolean),
  );

  constructor() {
    const sourceQuestion = this.data.question;
    if (!sourceQuestion) {
      return;
    }

    const parsed = parseQuestionMeta(sourceQuestion.options);
    this.typeControl.setValue(parsed.type);
    this.promptControl.setValue(sourceQuestion.prompt);
    this.optionAControl.setValue(parsed.options[0] ?? '');
    this.optionBControl.setValue(parsed.options[1] ?? '');
    this.optionCControl.setValue(parsed.options[2] ?? '');
    this.optionDControl.setValue(parsed.options[3] ?? '');

    if (parsed.type === 'multi') {
      const correct = new Set(
        sourceQuestion.correctAnswer
          .split('||')
          .map((value) => value.trim())
          .filter(Boolean),
      );
      const opts = parsed.options;
      this.multiCorrectA.setValue(!!opts[0] && correct.has(opts[0]));
      this.multiCorrectB.setValue(!!opts[1] && correct.has(opts[1]));
      this.multiCorrectC.setValue(!!opts[2] && correct.has(opts[2]));
      this.multiCorrectD.setValue(!!opts[3] && correct.has(opts[3]));
    } else {
      this.correctAnswerControl.setValue(sourceQuestion.correctAnswer);
    }
  }

  get isEditMode(): boolean {
    return this.data.mode === 'edit';
  }

  /** Clears answer fields when question type changes. */
  onTypeChanged(): void {
    this.validationError.set('');
    this.correctAnswerControl.setValue('');
    this.multiCorrectA.setValue(false);
    this.multiCorrectB.setValue(false);
    this.multiCorrectC.setValue(false);
    this.multiCorrectD.setValue(false);
    if (this.typeControl.value === 'text') {
      this.optionAControl.setValue('');
      this.optionBControl.setValue('');
      this.optionCControl.setValue('');
      this.optionDControl.setValue('');
    }
  }

  submit(): void {
    this.validationError.set('');

    if (this.promptControl.invalid) {
      this.promptControl.markAsTouched();
      return;
    }

    const type = this.typeControl.value;
    const options = this.options();
    if (type !== 'text') {
      if (options.length < 2) {
        this.validationError.set('Add at least two options.');
        return;
      }
      if (new Set(options).size !== options.length) {
        this.validationError.set('Options must be unique.');
        return;
      }
    }

    if (type === 'single') {
      const correct = this.correctAnswerControl.value.trim();
      if (!correct) {
        this.validationError.set('Select the correct answer.');
        return;
      }
      if (!options.includes(correct)) {
        this.validationError.set('Correct answer must match one option.');
        return;
      }

      this._dialogRef.close({
        draft: {
          type,
          prompt: this.promptControl.value.trim(),
          options,
          correctAnswer: correct,
        },
      });
      return;
    }

    if (type === 'multi') {
      const slots: Array<{ text: string; correct: boolean }> = [
        { text: this.optionAControl.value.trim(), correct: this.multiCorrectA.value },
        { text: this.optionBControl.value.trim(), correct: this.multiCorrectB.value },
        { text: this.optionCControl.value.trim(), correct: this.multiCorrectC.value },
        { text: this.optionDControl.value.trim(), correct: this.multiCorrectD.value },
      ];
      const parsedCorrect = Array.from(
        new Set(
          slots.filter((slot) => slot.text && slot.correct).map((slot) => slot.text),
        ),
      );
      if (!parsedCorrect.length) {
        this.validationError.set('Select at least one correct answer using the checkboxes.');
        return;
      }
      if (!parsedCorrect.every((value) => options.includes(value))) {
        this.validationError.set('Each selected correct answer must match one of the options.');
        return;
      }

      this._dialogRef.close({
        draft: {
          type,
          prompt: this.promptControl.value.trim(),
          options,
          correctAnswer: parsedCorrect.join('||'),
        },
      });
      return;
    }

    const textCorrect = this.correctAnswerControl.value.trim();
    if (!textCorrect) {
      this.validationError.set('Enter the expected text answer.');
      return;
    }

    this._dialogRef.close({
      draft: {
        type,
        prompt: this.promptControl.value.trim(),
        options: [],
        correctAnswer: textCorrect,
      },
    });
  }
}
