import type { VocabularyProgress } from "@game/learning/learning.types";
import type { RelationshipState } from "@game/relationship/relationship.types";
export interface GameState {
  saveVersion: number;
  playerId?: string;
  chapterId?: string;
  sceneId?: string;
  eventIndex: number;
  storyVariables: Record<string, unknown>;
  relationships: RelationshipState;
  vocabularyProgress: Record<string, VocabularyProgress>;
  completedExercises: string[];
  choicesMade: Record<string, string>;
  isDirty: boolean;
}
