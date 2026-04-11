/**
 * Shared placement workspace shapes for {@code GET /admin/placement} and {@code GET /student/placement}
 * (see FRONTEND_API.md, PLACEMENT_SUBMISSION.md).
 */
export type PlacementQuestionKind = 'single' | 'multi' | 'text';

export interface PlacementQuestionRecord {
  id: string;
  /** Short label for UI (e.g. "Single 1"); falls back to {@link prompt} when absent. */
  title?: string;
  prompt: string;
  type: PlacementQuestionKind;
  options: string[];
  /** Omitted on learner load when answers are not exposed. */
  correctAnswer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlacementWorkspacePayload {
  /** From {@code GET /student/placement} (PLACEMENT_SUBMISSION.md). */
  placementId?: string;
  /** Legacy / admin alias. */
  quizId?: string;
  title?: string;
  quizTitle?: string;
  examDurationMinutes: number;
  maxQuestions?: number;
  description?: string;
  quizDescription?: string;
  courseTitle?: string;
  courseLevel?: string;
  questions: PlacementQuestionRecord[];
}

/**
 * Resolves the placement id used for {@code POST /placement/:placementId/submit}.
 */
export function resolvePlacementWorkspaceId(
  payload: PlacementWorkspacePayload,
): string {
  return (payload.placementId ?? payload.quizId ?? '').trim();
}
