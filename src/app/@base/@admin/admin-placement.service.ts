import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  Question,
  Quiz,
  StudentAnswer,
} from '@shared/interfaces/learning/learning.interface';
import { QuizzesService } from '@shared/services/learning/quizzes.service';
import { ToastService } from '@shared/services/toast/toast.service';
import {
  normalizeComparableAnswer,
  parseQuestionMeta,
} from '@shared/utils/learning/quiz.utils';
import { finalize, forkJoin, map, merge, startWith } from 'rxjs';

@Injectable()
export class AdminPlacementService {
  private readonly _quizzesService = inject(QuizzesService);
  private readonly _toast = inject(ToastService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly isLoading = signal(false);
  readonly isOverviewLoaded = signal(false);
  readonly placementQuiz = signal<Quiz | null>(null);
  readonly placementQuestions = signal<Question[]>([]);
  readonly placementResults = signal<
    Array<{
      studentId: string;
      studentName: string;
      studentEmail: string;
      score: number;
      correctAnswers: number;
      totalQuestions: number;
      passed: boolean;
      submittedAt: string | null;
    }>
  >([]);
  readonly placementAttemptsCount = computed(() => this.placementResults().length);

  readonly placementCourseId = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly placementQuestionType = new FormControl<'single' | 'multi' | 'text'>(
    'single',
    {
      nonNullable: true,
      validators: [Validators.required],
    },
  );
  readonly placementQuestionPrompt = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly placementQuestionOptionA = new FormControl('', { nonNullable: true });
  readonly placementQuestionOptionB = new FormControl('', { nonNullable: true });
  readonly placementQuestionOptionC = new FormControl('', { nonNullable: true });
  readonly placementQuestionOptionD = new FormControl('', { nonNullable: true });
  readonly placementQuestionCorrectAnswer = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  readonly editingPlacementQuestionId = signal<string | null>(null);
  readonly placementMultiCorrectAnswers = signal<string[]>([]);
  /** Built from option controls' valueChanges — not a plain computed over .value (forms are not signals). */
  readonly placementQuestionOptions = toSignal(
    merge(
      this.placementQuestionOptionA.valueChanges,
      this.placementQuestionOptionB.valueChanges,
      this.placementQuestionOptionC.valueChanges,
      this.placementQuestionOptionD.valueChanges,
    ).pipe(
      startWith(null),
      map(() =>
        [
          this.placementQuestionOptionA.value.trim(),
          this.placementQuestionOptionB.value.trim(),
          this.placementQuestionOptionC.value.trim(),
          this.placementQuestionOptionD.value.trim(),
        ].filter(Boolean),
      ),
    ),
    { initialValue: [] as string[] },
  );
  readonly canCreatePlacementQuestion = computed(
    () => this.placementQuestions().length < 50,
  );

  /**
   * Loads placement quiz, questions, and grade summaries.
   */
  loadPlacementOverview(force = false) {
    if (!force && this.isOverviewLoaded()) {
      return;
    }

    this.isLoading.set(true);
    this._quizzesService
      .getPlacementQuiz()
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (placementQuiz) => {
          this.isOverviewLoaded.set(true);
          this.placementQuiz.set(placementQuiz);
          if (!placementQuiz) {
            this.placementQuestions.set([]);
            this.placementResults.set([]);
            return;
          }

          this._loadPlacementWorkspace(placementQuiz);
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
   * Creates placement quiz if currently missing.
   */
  createPlacementQuiz() {
    if (this.placementQuiz()) {
      this._toast.showError('Placement quiz already exists.');
      return;
    }
    if (this.placementCourseId.invalid) {
      this.placementCourseId.markAsTouched();
      return;
    }

    this.isLoading.set(true);
    this._quizzesService
      .createQuiz({
        course: { id: this.placementCourseId.value },
        title: 'Placement Test',
        description:
          'One-time entry assessment with 50 timed questions for level grading.',
        passingScore: 60,
      })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this._toast.showSuccess('Placement quiz created successfully.');
          this.placementCourseId.setValue('');
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
   * Loads selected placement question values into edit form.
   */
  editPlacementQuestion(question: Question) {
    const parsed = parseQuestionMeta(question.options);
    this.editingPlacementQuestionId.set(question.id);
    this.placementQuestionType.setValue(parsed.type);
    this.placementQuestionPrompt.setValue(question.prompt);
    this.placementQuestionOptionA.setValue(parsed.options[0] ?? '');
    this.placementQuestionOptionB.setValue(parsed.options[1] ?? '');
    this.placementQuestionOptionC.setValue(parsed.options[2] ?? '');
    this.placementQuestionOptionD.setValue(parsed.options[3] ?? '');
    this.placementQuestionCorrectAnswer.setValue(
      parsed.type === 'multi' ? '' : question.correctAnswer,
    );
    this.placementMultiCorrectAnswers.set(
      parsed.type === 'multi'
        ? question.correctAnswer
            .split('||')
            .map((value) => value.trim())
            .filter(Boolean)
        : [],
    );
  }

  /**
   * Creates or updates a placement question.
   */
  savePlacementQuestion() {
    const placementQuiz = this.placementQuiz();
    if (!placementQuiz) {
      this._toast.showError('Placement quiz is not available.');
      return;
    }

    const type = this.placementQuestionType.value;
    if (
      this.placementQuestionPrompt.invalid ||
      (type !== 'multi' && this.placementQuestionCorrectAnswer.invalid)
    ) {
      this.placementQuestionPrompt.markAsTouched();
      if (type !== 'multi') {
        this.placementQuestionCorrectAnswer.markAsTouched();
      }
      return;
    }

    const options = this.placementQuestionOptions();
    const correctAnswer = this.placementQuestionCorrectAnswer.value.trim();
    const multiCorrectAnswers = this.placementMultiCorrectAnswers();

    if (!this.editingPlacementQuestionId() && !this.canCreatePlacementQuestion()) {
      this._toast.showError(
        'Placement test already has 50 questions. Edit existing questions instead.',
      );
      return;
    }

    if (type !== 'text') {
      if (options.length < 2) {
        this._toast.showError('Provide at least two options for single or multi type.');
        return;
      }
      if (new Set(options).size !== options.length) {
        this._toast.showError('Placement question options must be unique.');
        return;
      }
    }

    if (type === 'single' && !options.includes(correctAnswer)) {
      this._toast.showError('Single-answer correct value must match one option.');
      return;
    }

    if (type === 'multi') {
      if (!multiCorrectAnswers.length) {
        this._toast.showError('Provide at least one correct option for multi-answer.');
        return;
      }
      if (!multiCorrectAnswers.every((value) => options.includes(value))) {
        this._toast.showError('Multi-answer correct values must match defined options.');
        return;
      }
    }

    const payload = {
      quiz: { id: placementQuiz.id },
      prompt: this.placementQuestionPrompt.value.trim(),
      options: JSON.stringify({
        type,
        options: type === 'text' ? [] : options,
      }),
      correctAnswer:
        type === 'multi'
          ? multiCorrectAnswers.slice().sort().join('||')
          : correctAnswer,
    };

    this.isLoading.set(true);
    const request$ = this.editingPlacementQuestionId()
      ? this._quizzesService.updateQuestion(
          this.editingPlacementQuestionId() as string,
          payload,
        )
      : this._quizzesService.createQuestion(payload);

    request$
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this._toast.showSuccess(
            this.editingPlacementQuestionId()
              ? 'Placement question updated successfully.'
              : 'Placement question created successfully.',
          );
          this.resetPlacementQuestionForm();
          this.loadPlacementOverview(true);
        },
      });
  }

  /**
   * Deletes a placement question.
   */
  deletePlacementQuestion(questionId: string) {
    this.isLoading.set(true);
    this._quizzesService
      .deleteQuestion(questionId)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: () => {
          this._toast.showSuccess('Placement question deleted successfully.');
          if (this.editingPlacementQuestionId() === questionId) {
            this.resetPlacementQuestionForm();
          }
          this.loadPlacementOverview(true);
        },
      });
  }

  /**
   * Resets placement question editor controls.
   */
  resetPlacementQuestionForm() {
    this.editingPlacementQuestionId.set(null);
    this.placementQuestionType.setValue('single');
    this.placementQuestionPrompt.setValue('');
    this.placementQuestionOptionA.setValue('');
    this.placementQuestionOptionB.setValue('');
    this.placementQuestionOptionC.setValue('');
    this.placementQuestionOptionD.setValue('');
    this.placementQuestionCorrectAnswer.setValue('');
    this.placementMultiCorrectAnswers.set([]);
  }

  /**
   * Handles placement question type changes and clears incompatible values.
   */
  onPlacementQuestionTypeChanged() {
    const type = this.placementQuestionType.value;
    if (type === 'text') {
      this.placementQuestionOptionA.setValue('');
      this.placementQuestionOptionB.setValue('');
      this.placementQuestionOptionC.setValue('');
      this.placementQuestionOptionD.setValue('');
    }
    this.placementQuestionCorrectAnswer.setValue('');
    this.placementMultiCorrectAnswers.set([]);
  }

  /**
   * Toggles one option as correct answer for multi-answer type.
   */
  togglePlacementMultiCorrectAnswer(option: string, checked: boolean) {
    this.placementMultiCorrectAnswers.update((current) => {
      if (checked) {
        return Array.from(new Set([...current, option]));
      }
      return current.filter((item) => item !== option);
    });
  }

  /**
   * Returns whether an option is selected as multi correct answer.
   */
  isPlacementMultiCorrectAnswerSelected(option: string): boolean {
    return this.placementMultiCorrectAnswers().includes(option);
  }

  /**
   * Loads placement quiz questions and result summaries.
   */
  private _loadPlacementWorkspace(placementQuiz: Quiz) {
    forkJoin({
      questions: this._quizzesService.getQuizQuestions(placementQuiz.id),
      answers: this._quizzesService.getQuizAnswers(placementQuiz.id),
    })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe({
        next: ({ questions, answers }) => {
          this.placementQuestions.set(
            (questions ?? [])
              .slice()
              .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)),
          );
          this.placementResults.set(
            this._buildPlacementSummaries(
              questions ?? [],
              answers ?? [],
              placementQuiz.passingScore ?? 70,
            ),
          );
        },
      });
  }

  /**
   * Computes latest-attempt score per student for placement test.
   */
  private _buildPlacementSummaries(
    questions: Question[],
    answers: StudentAnswer[],
    passingScore: number,
  ) {
    if (!questions.length || !answers.length) {
      return [];
    }

    const questionMap = new Map(questions.map((question) => [question.id, question]));
    const byStudent = new Map<string, StudentAnswer[]>();
    answers.forEach((answer) => {
      const studentId = String(answer.student.id);
      const existing = byStudent.get(studentId) ?? [];
      existing.push(answer);
      byStudent.set(studentId, existing);
    });

    return Array.from(byStudent.values())
      .map((studentAnswers) => {
        const latestByQuestion = new Map<string, StudentAnswer>();
        studentAnswers
          .slice()
          .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
          .forEach((answer) => {
            if (!latestByQuestion.has(answer.question.id)) {
              latestByQuestion.set(answer.question.id, answer);
            }
          });

        const latestAnswers = Array.from(latestByQuestion.values());
        const correctAnswers = latestAnswers.reduce((sum, answer) => {
          const question = questionMap.get(answer.question.id);
          if (!question) {
            return sum;
          }

          return (
            sum +
            (normalizeComparableAnswer(question.correctAnswer) ===
            normalizeComparableAnswer(answer.answer)
              ? 1
              : 0)
          );
        }, 0);
        const totalQuestions = questions.length;
        const score = totalQuestions
          ? Math.round((correctAnswers / totalQuestions) * 100)
          : 0;
        const student = latestAnswers[0]?.student;
        const studentName =
          `${student?.firstName ?? ''} ${student?.lastName ?? ''}`.trim() ||
          'Student';

        return {
          studentId: String(student?.id ?? ''),
          studentName,
          studentEmail: student?.email ?? '-',
          score,
          correctAnswers,
          totalQuestions,
          passed: score >= passingScore,
          submittedAt: latestAnswers[0]?.updatedAt ?? null,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

}
