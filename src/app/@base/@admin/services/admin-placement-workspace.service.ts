import { Injectable, inject, signal } from '@angular/core';
import { PlacementQuestionDraft, PlacementWorkspacePayload } from '../models/admin-placement.models';
import { Observable, map, of, tap } from 'rxjs';
import { AdminApiService } from './admin-api.service';

/**
 * Cached placement workspace for admin CRUD; synced from hub or {@code GET /admin/placement}.
 */
@Injectable()
export class AdminPlacementWorkspaceService {
  private readonly _adminApi = inject(AdminApiService);

  readonly exam = signal<PlacementWorkspacePayload | null>(null);

  /**
   * Applies hub/placement API payload for local CRUD helpers.
   */
  applyPlacementPayload(payload: PlacementWorkspacePayload | null): void {
    if (!payload) {
      this.exam.set(null);
      return;
    }
    this.exam.set(this._normalizePayload(payload));
  }

  /**
   * Loads from cache, or {@code GET /admin/placement} when forced or empty.
   */
  loadQuestions(force = false): Observable<PlacementWorkspacePayload | null> {
    if (!force && this.exam()) {
      return of(this.exam());
    }

    return this._adminApi.getPlacement().pipe(
      tap((payload) => {
        this.applyPlacementPayload(payload);
      }),
    );
  }

  createQuestion(draft: PlacementQuestionDraft): Observable<void> {
    return this._adminApi
      .createPlacementQuestion({
        prompt: draft.prompt.trim(),
        type: draft.type,
        options: draft.type === 'text' ? [] : draft.options,
        correctAnswer: draft.correctAnswer.trim(),
      })
      .pipe(map(() => void 0));
  }

  updateQuestion(questionId: string, draft: PlacementQuestionDraft): Observable<void> {
    return this._adminApi
      .updatePlacementQuestion(questionId, {
        prompt: draft.prompt.trim(),
        type: draft.type,
        options: draft.type === 'text' ? [] : draft.options,
        correctAnswer: draft.correctAnswer.trim(),
      })
      .pipe(map(() => void 0));
  }

  deleteQuestion(questionId: string): Observable<void> {
    return this._adminApi.deletePlacementQuestion(questionId);
  }

  private _normalizePayload(payload: PlacementWorkspacePayload): PlacementWorkspacePayload {
    return {
      ...payload,
      quizDescription: (payload.quizDescription ?? '').trim() || undefined,
      courseTitle: (payload.courseTitle ?? '').trim() || undefined,
      courseLevel: payload.courseLevel?.trim() || undefined,
      questions: (payload.questions ?? []).map((question) => ({
        ...question,
        prompt: (question.prompt || '').trim(),
        options: Array.from(
          new Set((question.options ?? []).map((option) => String(option).trim()).filter(Boolean)),
        ),
        correctAnswer: (question.correctAnswer || '').trim(),
      })),
    };
  }
}
