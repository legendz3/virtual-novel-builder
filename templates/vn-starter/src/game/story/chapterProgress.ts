import { reconcileRelationshipRewards } from "@game/relationship/relationshipRevisions";
import type { ChapterDefinition } from "@content/content.types";
import type { GameState } from "@game/state/gameState.types";
import { resolveChoiceRouteIndex } from "./choiceRoute";
import { applyStoryEffects, chapterBeatEffectKey } from "./storyEffects";

// Progress, authored effects, and vocabulary unlock together in one saveable update.
export function enterChapterBeat(
  chapter: ChapterDefinition,
  state: GameState,
  eventIndex: number,
): GameState {
  eventIndex = resolveChoiceRouteIndex(chapter, state.choicesMade, eventIndex);
  const event = chapter.events[eventIndex];
  if (!Number.isInteger(eventIndex) || !event) throw new Error("Invalid chapter event index");
  state = reconcileRelationshipRewards(state);
  let next = state;
  const effectKey = chapterBeatEffectKey(chapter.id, event.id);
  if (event.effects?.length && state.storyVariables[effectKey] !== true) {
    next = applyStoryEffects(state, event.effects);
    next.storyVariables[effectKey] = true;
  }
  const vocabularyProgress = { ...state.vocabularyProgress };
  if (event.type === "chapter_end") {
    for (const word of event.vocabulary) {
      // Unlocking is an exposure, not a correct answer or a mastery award. Replays retain learning.
      vocabularyProgress[word.id] ??= {
        vocabularyId: word.id,
        exposures: 1,
        correct: 0,
        incorrect: 0,
        mastery: 0,
      };
    }
  }
  return {
    ...next,
    chapterId: chapter.id,
    sceneId: event.sceneId ?? chapter.sceneId,
    eventIndex,
    vocabularyProgress,
    isDirty: true,
  };
}
