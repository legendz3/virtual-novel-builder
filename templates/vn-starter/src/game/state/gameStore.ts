import { CHAPTERS_ONE_FIVE_RELATIONSHIP_REVISION } from "@game/relationship/relationshipRevisions";
import { CHAPTER_SIX_RELATIONSHIP_REVISION } from "@game/relationship/chapterSixRelationshipRevision";
import {
  CHAPTER_SIX_CONTENT_REVISION,
  CHAPTER_SIX_CONTENT_VERSION,
} from "@game/story/chapterSixContentRevision";
import { create } from "zustand";
import type { GameState } from "./gameState.types";
import type { VocabularyProgress } from "@game/learning/learning.types";
import { SAVE_VERSION } from "@game/save/save.types";
export interface GameActions {
  setStoryProgress(chapterId: string, sceneId: string, eventIndex: number): void;
  setChapter(chapterId: string): void;
  setScene(sceneId: string): void;
  setEventIndex(eventIndex: number): void;
  setStoryVariable(key: string, value: unknown): void;
  setRelationship(characterId: string, value: number): void;
  setVocabularyProgress(vocabularyId: string, progress: VocabularyProgress): void;
  recordChoice(choiceId: string, optionId: string): void;
  markDirty(): void;
  resetGame(): void;
}
export const initialGameState = (): GameState => ({
  saveVersion: SAVE_VERSION,
  eventIndex: 0,
  storyVariables: {
    [CHAPTERS_ONE_FIVE_RELATIONSHIP_REVISION]: true,
    [CHAPTER_SIX_RELATIONSHIP_REVISION]: true,
    [CHAPTER_SIX_CONTENT_REVISION]: CHAPTER_SIX_CONTENT_VERSION,
  },
  relationships: {},
  vocabularyProgress: {},
  completedExercises: [],
  choicesMade: {},
  isDirty: false,
});
export function createGameStore() {
  return create<GameState & GameActions>((set) => ({
    ...initialGameState(),
    setStoryProgress: (chapterId, sceneId, eventIndex) => {
      if (!Number.isInteger(eventIndex) || eventIndex < 0) throw new Error("Invalid event index");
      set({ chapterId, sceneId, eventIndex, isDirty: true });
    },
    setChapter: (chapterId) => set({ chapterId, sceneId: undefined, eventIndex: 0, isDirty: true }),
    setScene: (sceneId) => set({ sceneId, eventIndex: 0, isDirty: true }),
    setEventIndex: (eventIndex) => {
      if (!Number.isInteger(eventIndex) || eventIndex < 0) throw new Error("Invalid event index");
      set({ eventIndex, isDirty: true });
    },
    setStoryVariable: (key, value) =>
      set((s) => ({ storyVariables: { ...s.storyVariables, [key]: value }, isDirty: true })),
    setRelationship: (id, value) =>
      set((s) => ({ relationships: { ...s.relationships, [id]: value }, isDirty: true })),
    setVocabularyProgress: (id, progress) =>
      set((s) => ({
        vocabularyProgress: { ...s.vocabularyProgress, [id]: { ...progress } },
        isDirty: true,
      })),
    recordChoice: (id, optionId) =>
      set((s) => ({ choicesMade: { ...s.choicesMade, [id]: optionId }, isDirty: true })),
    markDirty: () => set({ isDirty: true }),
    resetGame: () =>
      set({
        ...initialGameState(),
        chapterId: undefined,
        sceneId: undefined,
        playerId: undefined,
        isDirty: true,
      }),
  }));
}
export type GameStore = ReturnType<typeof createGameStore>;
export const useGameStore = createGameStore();
