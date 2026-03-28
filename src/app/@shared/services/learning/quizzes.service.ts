import { inject, Injectable } from '@angular/core';
import {
  Course,
  StudentAnswer,
  Question,
  Quiz,
  SubmitQuizPayload,
  SubmitQuizResult,
} from '@shared/interfaces/learning/learning.interface';
import { ApiService } from '@shared/services/api/api.service';

type UpsertQuizPayload = {
  course: Pick<Course, 'id'>;
  title: string;
  description?: string | null;
  passingScore?: number | null;
};

type UpsertQuestionPayload = {
  quiz: Pick<Quiz, 'id'>;
  prompt: string;
  options: string;
  correctAnswer: string;
};

@Injectable({ providedIn: 'root' })
export class QuizzesService {
  private _api = inject(ApiService);

  /**
   * Returns the configured placement quiz.
   */
  getPlacementQuiz() {
    return this._api.get<Quiz | null>({
      path: '/quizzes/placement-test',
    });
  }

  /**
   * Returns all questions for a given quiz.
   */
  getQuizQuestions(quizId: string) {
    return this._api.get<Question[]>({
      path: `/quizzes/${quizId}/questions`,
    });
  }

  /**
   * Returns all answers submitted for a quiz.
   */
  getQuizAnswers(quizId: string) {
    return this._api.get<StudentAnswer[]>({
      path: `/quizzes/${quizId}/answers`,
    });
  }

  /**
   * Returns whether current student has already attempted a quiz.
   */
  getMyQuizAttemptStatus(quizId: string) {
    return this._api.get<{
      hasAttempt: boolean;
      attemptCount: number;
      retakeCount: number;
      lastSubmittedAt: string | null;
    }>({
      path: `/quizzes/${quizId}/my-attempt-status`,
    });
  }

  /**
   * Submits a quiz attempt payload.
   */
  submitQuiz(quizId: string, payload: SubmitQuizPayload) {
    return this._api.post<SubmitQuizResult>({
      path: `/quizzes/${quizId}/submit`,
      body: payload,
    });
  }

  /**
   * Creates a new quiz.
   */
  createQuiz(payload: UpsertQuizPayload) {
    return this._api.post<Quiz>({
      path: '/quizzes',
      body: payload,
    });
  }

  /**
   * Creates a question for a quiz.
   */
  createQuestion(payload: UpsertQuestionPayload) {
    return this._api.post<Question>({
      path: '/questions',
      body: payload,
    });
  }

  /**
   * Updates an existing question.
   */
  updateQuestion(
    questionId: string,
    payload: Partial<UpsertQuestionPayload>,
  ) {
    return this._api.patch<Question>({
      path: `/questions/${questionId}`,
      body: payload,
    });
  }

  /**
   * Deletes a question by id.
   */
  deleteQuestion(questionId: string) {
    return this._api.delete<void>({
      path: `/questions/${questionId}`,
    });
  }
}
