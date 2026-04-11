import type { StudentGroup } from './admin-group.models';

export type { StudentGroup };

/** Hub metadata from {@code GET /admin/hub} / {@code GET /admin/students}. */
export interface AdminStudentsMeta {
  adminDisplayName: string;
}

export interface StudentMistakeDetail {
  questionId: string;
  questionPrompt: string;
  studentAnswer: string;
  correctAnswer: string;
}

export interface StudentPlacementDegree {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  submittedAt: string;
  mistakes: StudentMistakeDetail[];
}

export interface StudentPaymentRecord {
  id: string;
  amount: number;
  currency: string;
  paidAt: string;
  status: 'paid' | 'failed' | 'refunded';
}

export interface AdminStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive';
  /** Assigned group id from {@code GET /admin/groups}. */
  groupId: string | null;
  notes: string;
  placement: StudentPlacementDegree;
  payments: StudentPaymentRecord[];
  nextPaymentDate: string;
  nextPaymentAmount: number;
  createdAt: string;
  updatedAt: string;
}

/** Response bundle for admin student roster (see FRONTEND_API.md). */
export interface AdminStudentsPayload {
  meta?: AdminStudentsMeta;
  students: AdminStudent[];
}

export interface AdminStudentDraft {
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'inactive';
  nextPaymentDate: string;
  nextPaymentAmount: number;
  groupId: string | null;
  notes: string;
}

export interface AdminStudentDialogData {
  mode: 'create' | 'edit';
  student?: AdminStudent;
  groups: StudentGroup[];
}

export interface AdminStudentDialogResult {
  draft: AdminStudentDraft;
}
