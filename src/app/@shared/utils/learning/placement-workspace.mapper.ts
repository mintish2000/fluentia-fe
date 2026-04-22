import { Question, Quiz, QuizCourseSummary } from '@shared/interfaces/learning/learning.interface';
import {
  type PlacementWorkspacePayload,
  resolvePlacementWorkspaceId,
} from '@shared/interfaces/learning/placement-workspace.interface';

/**
 * Maps API placement workspace to {@link Quiz} for shared UI (student test + admin preview).
 */
export function mapPlacementWorkspaceToQuiz(payload: PlacementWorkspacePayload): Quiz {
  const now = new Date().toISOString();
  const course: QuizCourseSummary = {
    id: 'placement-course',
    title: payload.courseTitle?.trim() || 'Placement Course',
    description: (payload.description ?? payload.quizDescription)?.trim() || 'Placement exam',
    level: payload.courseLevel?.trim() || 'all',
    price: null,
    tutor: {
      id: 'system',
      email: null,
      firstName: 'Placement',
      lastName: 'Exam',
      role: { id: 'system', name: 'system' },
      status: { id: 1, name: 'active' },
    },
    createdAt: now,
    updatedAt: now,
  };

  const title =
    payload.title?.trim() ?? payload.quizTitle?.trim() ?? 'Placement Test';

  return {
    id: resolvePlacementWorkspaceId(payload) || 'placement-unknown',
    title,
    description: (payload.description ?? payload.quizDescription)?.trim() || 'Placement exam',
    course,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Maps workspace question rows to {@link Question} entities tied to the given quiz.
 */
export function mapPlacementRecordsToQuestions(
  payload: PlacementWorkspacePayload,
  quiz: Quiz,
): Question[] {
  const now = new Date().toISOString();
  return (payload.questions ?? [])
    .slice()
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    .map((item) => ({
      id: item.id,
      title: item.title?.trim() || undefined,
      prompt: item.prompt,
      options: JSON.stringify({ type: item.type, options: item.options }),
      correctAnswer: item.correctAnswer ?? '',
      quiz,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
    }));
}
