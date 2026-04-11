export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface InfinityListResponse<T> {
  data: T[];
  hasNextPage: boolean;
}

export interface BackendRole {
  id: number | string;
  name?: string;
}

export interface BackendStatus {
  id: number | string;
  name?: string;
}

export interface BackendUser {
  id: number | string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role?: BackendRole | null;
  status?: BackendStatus | null;
}

/**
 * Course snapshot embedded in quiz/placement payloads only (no standalone catalog CRUD).
 */
export interface QuizCourseSummary {
  id: string;
  title: string;
  description?: string | null;
  level: string;
  price?: number | null;
  tutor: BackendUser;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  course: QuizCourseSummary;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  /** Optional label from API; prefer over {@link prompt} in result summaries. */
  title?: string;
  prompt: string;
  options: string;
  correctAnswer: string;
  quiz: Quiz;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string | null;
  student: BackendUser;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAnswer {
  id: string;
  answer: string;
  isCorrect?: boolean;
  submittedAt?: string;
  question: Question;
  quiz: Quiz;
  student: BackendUser;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitQuizAnswerPayload {
  questionId: string;
  answer: string;
}

/** Body for {@code POST /api/v1/placement/:placementId/submit} (PLACEMENT_SUBMISSION.md). */
export interface SubmitPlacementAnswersPayload {
  answers: SubmitQuizAnswerPayload[];
}

export interface SubmitQuizAnswerResult {
  questionId: string;
  isCorrect: boolean;
}

/** Response from {@code POST /placement/:placementId/submit}. */
export interface SubmitPlacementResponse {
  placementId: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number;
  passingScore: number | null;
  passed: boolean;
  answers: SubmitQuizAnswerResult[];
}
