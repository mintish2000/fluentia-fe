import { Question } from '@shared/interfaces/learning/learning.interface';

export type {
  PlacementQuestionRecord,
  PlacementWorkspacePayload,
} from '@shared/interfaces/learning/placement-workspace.interface';

export type PlacementQuestionType = import('@shared/interfaces/learning/placement-workspace.interface').PlacementQuestionKind;

export interface PlacementQuestionDraft {
  type: PlacementQuestionType;
  prompt: string;
  options: string[];
  correctAnswer: string;
}

export interface PlacementQuestionDialogResult {
  draft: PlacementQuestionDraft;
}

export interface PlacementQuestionDialogData {
  mode: 'create' | 'edit';
  question?: Question;
}
