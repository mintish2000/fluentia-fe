import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import type {
  Question,
  SubmitPlacementResponse,
} from '@shared/interfaces/learning/learning.interface';
import { RouterLink } from '@angular/router';

/** Data passed into {@link PlacementResultDialogComponent}. */
export interface PlacementResultDialogData {
  result: SubmitPlacementResponse;
  /** Snapshot of test questions (for prompts in the per-answer list). */
  questions: Question[];
}

/**
 * Presents placement submit response summary and per-question correctness.
 */
@Component({
  selector: 'app-placement-result-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, RouterLink],
  templateUrl: './placement-result-dialog.component.html',
  styleUrl: './placement-result-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacementResultDialogComponent {
  readonly data = inject<PlacementResultDialogData>(MAT_DIALOG_DATA);

  /**
   * Human-readable label from {@link Question.title} and/or {@link Question.prompt} (no ids).
   */
  questionLabelForAnswer(questionId: string): string {
    const q = this.data.questions.find((row) =>
      this._idsMatch(row.id, questionId),
    );
    if (!q) {
      return '';
    }
    const title = q.title?.trim() ?? '';
    const prompt = q.prompt?.trim() ?? '';
    if (title && prompt) {
      if (prompt.startsWith(title)) {
        return prompt;
      }
      return `${title}: ${prompt}`;
    }
    return title || prompt;
  }

  /**
   * Compares API question ids with optional {@code q_} prefix used in load payload.
   */
  private _idsMatch(a: string, b: string): boolean {
    if (a === b) {
      return true;
    }
    const na = a.replace(/^q_/i, '');
    const nb = b.replace(/^q_/i, '');
    return na === nb;
  }

}
