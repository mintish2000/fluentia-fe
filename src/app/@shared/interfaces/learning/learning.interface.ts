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
  englishLevel?: string | null;
  learningGoals?: string | null;
}

export interface Course {
  id: string;
  title: string;
  description?: string | null;
  level: string;
  price?: number | null;
  tutor: BackendUser;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  id: string;
  title: string;
  content?: string | null;
  videoUrl?: string | null;
  lessonOrder: number;
  course: Course;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string | null;
  passingScore?: number | null;
  course: Course;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  prompt: string;
  options: string;
  correctAnswer: string;
  quiz: Quiz;
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  status: string;
  progress?: number | null;
  course: Course;
  /** Present when the API joins the student; may be missing on older payloads. */
  student?: BackendUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  tutor: BackendUser;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  status: string;
  startTime: string;
  bookingDate: string;
  meetingProvider?: 'zoom' | 'google_meet' | null;
  meetingLink?: string | null;
  tutor: BackendUser;
  student: BackendUser;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt?: string | null;
  enrollment: Enrollment;
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

export interface SubmitQuizPayload {
  answers: SubmitQuizAnswerPayload[];
}

export interface SubmitQuizAnswerResult {
  questionId: string;
  isCorrect: boolean;
}

export interface SubmitQuizResult {
  quizId: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  score: number;
  passingScore?: number | null;
  passed: boolean;
  answers: SubmitQuizAnswerResult[];
}

export interface CreateBookingPayload {
  tutor: { id: number | string };
  student: { id: number | string };
  status: string;
  startTime: string;
  bookingDate: string;
  meetingProvider?: 'zoom' | 'google_meet';
  meetingLink?: string;
}
