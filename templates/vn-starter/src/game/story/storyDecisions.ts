import { reconcileRelationshipRewards } from "@game/relationship/relationshipRevisions";
import type { ChapterDefinition } from "@content/content.types";
import { gradeComprehension } from "@game/learning/comprehension";
import type { GameState } from "@game/state/gameState.types";
import type { StoryEffect, StoryEvent } from "./story.types";
import { enterChapterBeat } from "./chapterProgress";
import { applyStoryEffects, chapterBeatEffectKey, storyStatChanges } from "./storyEffects";
import { reconcileChapterSixContent } from "./chapterSixContentRevision";
import { phraseDraftKey } from "./phraseConstructionProgress";

// A decision and its destination are one saveable update. Stale/double clicks cannot award twice.
export function chooseStoryOption(
  chapter: ChapterDefinition,
  state: GameState,
  eventId: string,
  optionId: string,
): GameState {
  const event = chapter.events[state.eventIndex];
  if (state.chapterId !== chapter.id || event?.id !== eventId) return state;
  if (event.type !== "choice" && event.type !== "comprehension") return state;
  state = reconcileRelationshipRewards(state);
  const recorded = state.choicesMade[event.id];
  const retrying =
    event.type === "comprehension" &&
    event.exercise.retryHint &&
    recorded !== event.exercise.correctOptionId;
  const selected = retrying ? optionId : (recorded ?? optionId);
  let target: string;
  let next = state;
  if (event.type === "comprehension") {
    const result = gradeComprehension(event.exercise, selected);
    // Save the hint state, but do not complete or leave a retryable question on a missed answer.
    if (!result.correct && event.exercise.retryHint)
      return {
        ...state,
        choicesMade: { ...state.choicesMade, [event.id]: selected },
        isDirty: true,
      };
    target = result.correct ? event.correctEventId : event.incorrectEventId;
    next = {
      ...state,
      completedExercises: state.completedExercises.includes(result.exerciseId)
        ? state.completedExercises
        : [...state.completedExercises, result.exerciseId],
    };
  } else if (event.type === "choice") {
    const option = event.options.find((item) => item.id === selected);
    if (!option) throw new Error(`Unknown story option: ${selected}`);
    target = option.targetEventId;
    if (!recorded) next = applyStoryEffects(state, option.effects ?? []);
  } else return state;
  const eventIndex = chapter.events.findIndex((item) => item.id === target);
  if (eventIndex < 0) throw new Error(`Unknown decision destination: ${target}`);
  return enterChapterBeat(
    chapter,
    {
      ...next,
      choicesMade: { ...state.choicesMade, [event.id]: selected },
    },
    eventIndex,
  );
}

// Feedback reflects committed deltas, so restored choices and duplicate clicks show no new award.
export function choiceStatChanges(
  event: StoryEvent,
  previous: GameState,
  next: GameState,
): StoryEffect[] {
  if (event.type !== "choice" || previous === next) return [];
  const option = event.options.find((item) => item.id === next.choicesMade[event.id]);
  return storyStatChanges(option?.effects ?? [], previous, next);
}

// Replaying replaces this chapter's choices, instead of accumulating rewards on each playthrough.
export function replayChapterState(chapter: ChapterDefinition, state: GameState): GameState {
  if (chapter.id === "chapter-six") state = reconcileChapterSixContent(state, chapter);
  state = reconcileRelationshipRewards(state);
  let next = state;
  const choicesMade = { ...state.choicesMade };
  const exercises = new Set<string>();
  for (const event of chapter.events) {
    const effectKey = chapterBeatEffectKey(chapter.id, event.id);
    if (event.effects?.length && next.storyVariables[effectKey] === true) {
      next = applyStoryEffects(next, event.effects, -1);
      delete next.storyVariables[effectKey];
    }
    if (event.type === "choice") {
      const chosen = event.options.find((option) => option.id === choicesMade[event.id]);
      if (chosen) next = applyStoryEffects(next, chosen.effects ?? [], -1);
      delete choicesMade[event.id];
    } else if (event.type === "phrase_construction") {
      const outcome = event.exercise.outcomes.find((item) => item.id === choicesMade[event.id]);
      if (outcome) next = applyStoryEffects(next, outcome.effects, -1);
      next = { ...next, storyVariables: { ...next.storyVariables } };
      delete next.storyVariables[phraseDraftKey(chapter.id, event.id)];
      delete choicesMade[event.id];
      exercises.add(event.exercise.id);
    } else if (event.type === "comprehension") {
      exercises.add(event.exercise.id);
      delete choicesMade[event.id];
    }
  }
  return enterChapterBeat(
    chapter,
    {
      ...next,
      chapterId: chapter.id,
      sceneId: chapter.events[0]?.sceneId ?? chapter.sceneId,
      eventIndex: 0,
      choicesMade,
      completedExercises: state.completedExercises.filter((id) => !exercises.has(id)),
      isDirty: true,
    },
    0,
  );
}
