import { Injectable, inject, signal } from '@angular/core';
import { Question, Quiz, QuizCourseSummary } from '@shared/interfaces/learning/learning.interface';
import { ToastService } from '@shared/services/toast/toast.service';
import { parseQuestionMeta } from '@shared/utils/learning/quiz.utils';
import { finalize } from 'rxjs';
import { AdminPlacementWorkspaceService } from './admin-placement-workspace.service';
import { PlacementQuestionDraft, PlacementWorkspacePayload } from '../models/admin-placement.models';

@Injectable()
export class AdminPlacementService {
  private readonly _workspace = inject(AdminPlacementWorkspaceService);
  private readonly _toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly isOverviewLoaded = signal(false);
  readonly placementQuiz = signal<Quiz | null>(null);
  readonly placementQuestions = signal<Question[]>([]);
  readonly placementExamDurationMinutes = signal(50);

  /**
   * Applies placement workspace from {@code GET /admin/hub} without another HTTP round-trip.
   */
  hydrateFromWorkspacePayload(payload: PlacementWorkspacePayload | null) {
    this._workspace.applyPlacementPayload(payload);
    this._applyPayload(payload);
  }

  /**
   * Loads placement exam metadata and questions from {@code GET /admin/placement}.
   */
  loadPlacementOverview(force = false) {
    if (!force && this.isOverviewLoaded()) {
      return;
    }

    this.isLoading.set(true);
    this._workspace
      .loadQuestions(force)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (payload) => {
          this._applyPayload(payload);
        },
      });
  }

  /**
   * Reloads placement question editor and grade list.
   */
  refreshPlacementWorkspace() {
    this.isOverviewLoaded.set(false);
    this.loadPlacementOverview(true);
  }

  /**
   * Ensures placement workspace is loaded once when needed.
   */
  ensurePlacementOverviewLoaded() {
    this.loadPlacementOverview(false);
  }

  /**
   * Creates a placement question via admin API.
   */
  createPlacementQuestion(draft: PlacementQuestionDraft) {
    this.isLoading.set(true);
    this._workspace
      .createQuestion(draft)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this._toast.showSuccess('Placement question created successfully.');
          this.isOverviewLoaded.set(false);
          this.loadPlacementOverview(true);
        },
      });
  }

  /**
   * Updates a placement question via admin API.
   */
  updatePlacementQuestion(questionId: string, draft: PlacementQuestionDraft) {
    this.isLoading.set(true);
    this._workspace
      .updateQuestion(questionId, draft)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this._toast.showSuccess('Placement question updated successfully.');
          this.isOverviewLoaded.set(false);
          this.loadPlacementOverview(true);
        },
      });
  }

  /**
   * Returns parsed options for a placement question.
   */
  parsePlacementQuestionOptions(question: Question): string[] {
    return parseQuestionMeta(question.options).options;
  }

  /**
   * Returns parsed type for a placement question.
   */
  getPlacementQuestionType(question: Question): 'single' | 'multi' | 'text' {
    return parseQuestionMeta(question.options).type;
  }

  /**
   * Returns human-readable correct answer text for admin preview list.
   */
  getPlacementCorrectAnswerLabel(question: Question): string {
    const type = this.getPlacementQuestionType(question);
    if (type === 'multi') {
      const values = Array.from(
        new Set(
          (question.correctAnswer || '')
            .split(/\|\||,/)
            .map((value) => value.trim())
            .filter(Boolean),
        ),
      );
      return values.length ? values.join(', ') : '-';
    }
    return question.correctAnswer || '-';
  }

  /**
   * Deletes a placement question.
   */
  deletePlacementQuestion(questionId: string) {
    this.isLoading.set(true);
    this._workspace
      .deleteQuestion(questionId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this._toast.showSuccess('Placement question deleted successfully.');
          this.isOverviewLoaded.set(false);
          this.loadPlacementOverview(true);
        },
      });
  }

  private _applyPayload(payload: PlacementWorkspacePayload | null) {
    if (!payload) {
      this.isOverviewLoaded.set(true);
      this.placementQuiz.set(null);
      this.placementQuestions.set([]);
      this.placementExamDurationMinutes.set(50);
      return;
    }

    this.isOverviewLoaded.set(true);
    this.placementExamDurationMinutes.set(payload.examDurationMinutes);
    this.placementQuiz.set(this._createQuizFromPayload(payload));
    this.placementQuestions.set(
      payload.questions
        .slice()
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
        .map((item) => this._toQuestion(item)),
    );
  }

  private _createQuizFromPayload(payload: PlacementWorkspacePayload): Quiz {
    const now = new Date().toISOString();
    const course: QuizCourseSummary = {
      id: 'placement-course',
      title: payload.courseTitle?.trim() || 'Placement Course',
      description:
        (payload.description ?? payload.quizDescription)?.trim() || 'Placement course',
      level: payload.courseLevel?.trim() || 'all',
      price: null,
      tutor: {
        id: 'system',
        email: null,
        firstName: 'System',
        lastName: 'Placement',
        role: { id: 'admin', name: 'admin' },
        status: { id: 1, name: 'active' },
      },
      createdAt: now,
      updatedAt: now,
    };

    const description =
      (payload.description ?? payload.quizDescription)?.trim() || 'Placement exam';
    const title =
      payload.title?.trim() ?? payload.quizTitle?.trim() ?? 'Placement Test';

    return {
      id: payload.placementId ?? payload.quizId ?? 'placement-unknown',
      title,
      description,
      course,
      createdAt: now,
      updatedAt: now,
    };
  }

  private _toQuestion(item: {
    id: string;
    title?: string;
    prompt: string;
    type: 'single' | 'multi' | 'text';
    options: string[];
    correctAnswer?: string;
    createdAt: string;
    updatedAt: string;
  }): Question {
    const quiz = this.placementQuiz() as Quiz;
    const now = new Date().toISOString();

    return {
      id: item.id,
      title: item.title?.trim() || undefined,
      prompt: item.prompt,
      options: JSON.stringify({ type: item.type, options: item.options }),
      correctAnswer: item.correctAnswer ?? '',
      quiz: quiz,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
    };
  }
}
