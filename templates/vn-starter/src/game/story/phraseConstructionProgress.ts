import type { ChapterDefinition } from "@content/content.types";
import type { GameState } from "@game/state/gameState.types";
import {
  editPhraseDraft,
  evaluatePhrase,
  readPhraseDraft,
} from "@game/learning/phraseConstruction";
import type { PhraseEdit } from "@game/learning/phraseConstruction.types";
import { enterChapterBeat } from "./chapterProgress";
import { applyStoryEffects } from "./storyEffects";

export function phraseDraftKey(chapterId: string, eventId: string): string {
  return `phrase-draft:${chapterId}:${eventId}`;
}

export function editPhraseConstruction(
  chapter: ChapterDefinition,
  state: GameState,
  eventId: string,
  edit: PhraseEdit,
): GameState {
  const event = chapter.events[state.eventIndex];
  if (
    state.chapterId !== chapter.id ||
    event?.id !== eventId ||
    event.type !== "phrase_construction" ||
    state.choicesMade[eventId]
  )
    return state;
  const key = phraseDraftKey(chapter.id, event.id);
  const draft = readPhraseDraft(event.exercise, state.storyVariables[key]);
  const updated = editPhraseDraft(event.exercise, draft, edit);
  return updated === draft
    ? state
    : { ...state, storyVariables: { ...state.storyVariables, [key]: updated }, isDirty: true };
}

// Submission, its reward, and its story destination commit together; a retry stays in the builder.
export function submitPhraseConstruction(
  chapter: ChapterDefinition,
  state: GameState,
  eventId: string,
): GameState {
  const event = chapter.events[state.eventIndex];
  if (
    state.chapterId !== chapter.id ||
    event?.id !== eventId ||
    event.type !== "phrase_construction" ||
    state.choicesMade[eventId]
  )
    return state;
  const key = phraseDraftKey(chapter.id, event.id);
  const draft = readPhraseDraft(event.exercise, state.storyVariables[key]);
  const result = evaluatePhrase(event.exercise, draft.tiles);
  if (result.kind === "incomplete") return state;
  if (result.kind !== "accepted")
    return {
      ...state,
      storyVariables: {
        ...state.storyVariables,
        [key]: { ...draft, coaching: result.kind, usedHelp: true },
      },
      isDirty: true,
    };
  const target =
    draft.usedHelp && result.outcome.assistedTargetEventId
      ? result.outcome.assistedTargetEventId
      : result.outcome.targetEventId;
  const index = chapter.events.findIndex((item) => item.id === target);
  if (index < 0) throw new Error(`Unknown phrase destination: ${target}`);
  const next = applyStoryEffects(state, result.outcome.effects);
  return enterChapterBeat(
    chapter,
    {
      ...next,
      choicesMade: { ...state.choicesMade, [event.id]: result.outcome.id },
      completedExercises: state.completedExercises.includes(event.exercise.id)
        ? state.completedExercises
        : [...state.completedExercises, event.exercise.id],
    },
    index,
  );
}
