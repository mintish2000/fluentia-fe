/**
 * Response shape for {@code GET /api/v1/student/hub} (see FRONTEND_API.md).
 */
export interface StudentHubPlacement {
  score: number;
  totalQuestions?: number;
  correctAnswers?: number;
  submittedAt?: string;
}

export interface StudentHubGroup {
  id: string;
  name: string;
  description?: string;
  link?: string;
}

export interface StudentHubPayment {
  id: string;
  amount: number;
  currency: string;
  paidAt: string;
  status: string;
}

export type StudentShift = 'morning' | 'evening';

export interface StudentHubPayload {
  status?: string;
  placementCompleted: boolean;
  placement: StudentHubPlacement | null;
  group: StudentHubGroup | null;
  payments: StudentHubPayment[];
  nextPaymentDate: string | null;
  nextPaymentAmount: number | null;
  nextPaymentCurrency: string;
  shift: StudentShift | null;
}
