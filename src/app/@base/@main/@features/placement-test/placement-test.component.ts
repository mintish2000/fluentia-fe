import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  Question,
  SubmitQuizResult,
} from '@shared/interfaces/learning/learning.interface';
import { PlacementTestService } from '@shared/services/learning/placement-test.service';
import { QuizzesService } from '@shared/services/learning/quizzes.service';
import { parseQuestionMeta } from '@shared/utils/learning/quiz.utils';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-placement-test',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './placement-test.component.html',
  styleUrl: './placement-test.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class PlacementTestComponent implements OnDestroy {
  private readonly _quizzesService = inject(QuizzesService);
  private readonly _placementTestService = inject(PlacementTestService);
  private _timerHandle: ReturnType<typeof setInterval> | null = null;
  private readonly _durationSeconds = 50 * 60;

  readonly isLoadingQuestions = signal(false);
  readonly isSubmitting = signal(false);
  readonly timerSecondsLeft = signal(this._durationSeconds);
  readonly loadedQuizId = signal('');
  readonly questions = signal<Question[]>([]);
  readonly singleAnswerMap = signal<Record<string, string>>({});
  readonly multiAnswerMap = signal<Record<string, string[]>>({});
  readonly textAnswerMap = signal<Record<string, string>>({});
  readonly submitResult = signal<SubmitQuizResult | null>(null);
  readonly placementQuiz = this._placementTestService.placementQuiz;
  readonly hasCompletedPlacement = this._placementTestService.hasCompletedPlacement;
  readonly hasQuestions = computed(() => this.questions().length > 0);
  readonly timerText = computed(() =>
    this._formatTime(this.timerSecondsLeft()),
  );
  readonly answerProgress = computed(() =>
    this.questions().reduce((count, question) => {
      const type = this.getQuestionType(question);
      if (type === 'multi') {
        return count + (this.multiAnswerMap()[question.id]?.length ? 1 : 0);
      }
      if (type === 'text') {
        return count + (this.textAnswerMap()[question.id]?.trim() ? 1 : 0);
      }
      return count + (this.singleAnswerMap()[question.id] ? 1 : 0);
    }, 0),
  );
  readonly unansweredQuestionIds = computed(() =>
    this.questions()
      .filter((question) => !this.isQuestionAnswered(question))
      .map((question) => question.id),
  );
  readonly canSubmit = computed(
    () =>
      this.answerProgress() === this.questions().length &&
      this.questions().length > 0 &&
      !this.hasCompletedPlacement(),
  );

  constructor() {
    this._placementTestService.refreshStatus();
    effect(() => {
      const quizId = this.placementQuiz()?.id ?? '';
      if (!quizId || this.hasCompletedPlacement() || this.loadedQuizId() === quizId) {
        return;
      }

      this.loadedQuizId.set(quizId);
      this.loadPlacementQuestions();
    });
  }

  /**
   * Clears interval on component destroy.
   */
  ngOnDestroy(): void {
    this._stopTimer();
  }

  /**
   * Loads and trims placement questions to 50 max.
   */
  loadPlacementQuestions(): void {
    const quiz = this.placementQuiz();
    if (!quiz || this.hasCompletedPlacement()) {
      this.questions.set([]);
      return;
    }

    this.submitResult.set(null);
    this.singleAnswerMap.set({});
    this.multiAnswerMap.set({});
    this.textAnswerMap.set({});
    this.isLoadingQuestions.set(true);
    this._quizzesService
      .getQuizQuestions(quiz.id)
      .pipe(finalize(() => this.isLoadingQuestions.set(false)))
      .subscribe({
        next: (response) => {
          this.questions.set((response ?? []).slice(0, 50));
          if (this.questions().length) {
            this._startTimer();
          }
        },
      });
  }

  /**
   * Updates single-choice answer for a question.
   */
  setSingleAnswer(questionId: string, answer: string): void {
    this.singleAnswerMap.update((current) => ({
      ...current,
      [questionId]: answer,
    }));
  }

  /**
   * Toggles multi-choice answer for a question.
   */
  toggleMultiAnswer(questionId: string, answer: string, checked: boolean): void {
    this.multiAnswerMap.update((current) => {
      const previous = current[questionId] ?? [];
      const next = checked
        ? Array.from(new Set([...previous, answer]))
        : previous.filter((item) => item !== answer);
      return {
        ...current,
        [questionId]: next,
      };
    });
  }

  /**
   * Updates text answer for a question.
   */
  setTextAnswer(questionId: string, answer: string): void {
    this.textAnswerMap.update((current) => ({
      ...current,
      [questionId]: answer,
    }));
  }

  /**
   * Returns parsed option list from question options payload.
   */
  getQuestionOptions(question: Question): string[] {
    const parsed = parseQuestionMeta(question.options);
    return parsed.options;
  }

  /**
   * Resolves question answer type from options metadata.
   */
  getQuestionType(question: Question): 'single' | 'multi' | 'text' {
    return parseQuestionMeta(question.options).type;
  }

  /**
   * Submits placement answers once and locks future attempts.
   */
  submitTest(): void {
    const quiz = this.placementQuiz();
    if (!quiz || !this.questions().length || !this.canSubmit()) {
      return;
    }

    const answers = this.questions()
      .map((question) => {
        const type = this.getQuestionType(question);
        if (type === 'multi') {
          const multiAnswer = this.multiAnswerMap()[question.id] ?? [];
          return {
            questionId: question.id,
            answer: multiAnswer.slice().sort().join('||'),
          };
        }
        if (type === 'text') {
          return {
            questionId: question.id,
            answer: this.textAnswerMap()[question.id]?.trim() ?? '',
          };
        }
        return {
          questionId: question.id,
          answer: this.singleAnswerMap()[question.id] ?? '',
        };
      });

    this.isSubmitting.set(true);
    this._quizzesService
      .submitQuiz(quiz.id, { answers })
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: (result) => {
          this.submitResult.set(result);
          this._placementTestService.markCompleted();
          this._stopTimer();
        },
      });
  }

  /**
   * Returns whether an option is selected in multi-answer mode.
   */
  isMultiChecked(questionId: string, answer: string): boolean {
    return (this.multiAnswerMap()[questionId] ?? []).includes(answer);
  }

  /**
   * Returns whether a question currently has an answer.
   */
  isQuestionAnswered(question: Question): boolean {
    const type = this.getQuestionType(question);
    if (type === 'multi') {
      return (this.multiAnswerMap()[question.id] ?? []).length > 0;
    }
    if (type === 'text') {
      return Boolean(this.textAnswerMap()[question.id]?.trim());
    }
    return Boolean(this.singleAnswerMap()[question.id]);
  }

  /**
   * Starts countdown timer for placement attempt.
   */
  private _startTimer(): void {
    this._stopTimer();
    this.timerSecondsLeft.set(this._durationSeconds);
    this._timerHandle = setInterval(() => {
      this.timerSecondsLeft.update((current) => {
        if (current <= 1) {
          this._stopTimer();
          if (!this.hasCompletedPlacement()) {
            this.submitTest();
          }
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  /**
   * Stops countdown timer if active.
   */
  private _stopTimer(): void {
    if (!this._timerHandle) {
      return;
    }
    clearInterval(this._timerHandle);
    this._timerHandle = null;
  }

  /**
   * Converts duration seconds into mm:ss format.
   */
  private _formatTime(totalSeconds: number): string {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

}

