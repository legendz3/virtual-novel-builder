import type { ChapterDefinition } from "@content/content.types";
import type { GameState } from "@game/state/gameState.types";
import { chapterSixRelationshipAdditions } from "@game/relationship/chapterSixRelationshipRevision";
import legacyMap from "./chapterSixLegacyMap.json";

export const CHAPTER_SIX_CONTENT_REVISION = "content-revision:chapter-six";
export const CHAPTER_SIX_CONTENT_VERSION = 1;

const chapterId = "chapter-six";
const attendanceChoiceId = "ch6-attendance-choice";

function hasRecordedOption(state: GameState, choiceId: string): boolean {
  return chapterSixRelationshipAdditions.some(
    (row) => row.choiceId === choiceId && state.choicesMade[choiceId] === row.optionId,
  );
}

// A selected intention alone cannot prove that the original in-person acknowledgement happened.
function legacyAttendanceWitness(state: GameState): "attend" | "decline" | undefined {
  const choice = state.choicesMade[attendanceChoiceId];
  const index = state.eventIndex;
  const currentLegacy =
    state.chapterId === chapterId && Number.isInteger(index) && index >= 0 && index < 319;
  if (
    choice === "ch6-attend-outing" &&
    ((currentLegacy && ((index >= 30 && index <= 247) || index === 318)) ||
      hasRecordedOption(state, "ch6-courtyard-choice") ||
      hasRecordedOption(state, "ch6-contact-choice"))
  )
    return "attend";
  if (
    choice === "ch6-decline-outing" &&
    ((currentLegacy && index >= 262) || hasRecordedOption(state, "ch6-declined-contact-choice"))
  )
    return "decline";
  return undefined;
}

// Cursor repair follows recorded decisions without applying awards or turning a reload into an action.
function resolveRecordedPanel(
  chapter: ChapterDefinition,
  state: GameState,
  initialIndex: number,
): number {
  let index = initialIndex;
  const visited = new Set<number>();
  for (;;) {
    if (visited.has(index)) throw new Error("Chapter Six legacy destination cycle");
    visited.add(index);
    const event = chapter.events[index];
    if (!event) throw new Error("Missing Chapter Six legacy destination");
    const selected = state.choicesMade[event.id];
    let target: string | undefined;
    if (event.type === "choice_route") {
      const source = state.choicesMade[event.choiceEventId];
      target =
        source && Object.hasOwn(event.cases, source) ? event.cases[source] : event.defaultEventId;
    } else if (event.type === "choice" && selected) {
      target = event.options.find((option) => option.id === selected)?.targetEventId;
    } else if (
      event.type === "comprehension" &&
      selected &&
      event.exercise.options.some((option) => option.id === selected)
    ) {
      const correct = selected === event.exercise.correctOptionId;
      if (correct || !event.exercise.retryHint)
        target = correct ? event.correctEventId : event.incorrectEventId;
    } else if (event.type === "phrase_construction" && selected) {
      const outcome = event.exercise.outcomes.find((item) => item.id === selected);
      const draft = state.storyVariables[`phrase-draft:${chapterId}:${event.id}`];
      const assisted =
        typeof draft === "object" &&
        draft !== null &&
        "usedHelp" in draft &&
        draft.usedHelp === true;
      target = assisted
        ? (outcome?.assistedTargetEventId ?? outcome?.targetEventId)
        : outcome?.targetEventId;
    }
    if (!target) return index;
    index = chapter.events.findIndex((item) => item.id === target);
  }
}

/** Run with the loaded revised chapter before restoring, acting on, or replaying a legacy cursor. */
export function reconcileChapterSixContent<T extends GameState>(
  state: T,
  chapter: ChapterDefinition,
): T {
  const version = state.storyVariables[CHAPTER_SIX_CONTENT_REVISION];
  if (typeof version === "number" && version >= CHAPTER_SIX_CONTENT_VERSION) return state;
  if (chapter.id !== chapterId)
    throw new Error("Chapter Six revision requires its revised chapter");
  const storyVariables: Record<string, unknown> = {
    ...state.storyVariables,
    [CHAPTER_SIX_CONTENT_REVISION]: CHAPTER_SIX_CONTENT_VERSION,
  };
  let relationships = state.relationships;
  const witness = legacyAttendanceWitness(state);
  if (witness) {
    const eventId =
      witness === "attend" ? "ch6-yichen-you-came" : "ch6-campus-quiet-acknowledgement";
    const marker = `beat-effects:${chapterId}:${eventId}`;
    if (state.storyVariables[marker] !== true) {
      const key = witness === "attend" ? "Yichen_Affection" : "Yichen_Trust";
      relationships = { ...relationships, [key]: (relationships[key] ?? 0) + 1 };
      storyVariables[marker] = true;
    }
  }
  let eventIndex = state.eventIndex;
  let sceneId = state.sceneId;
  if (state.chapterId === chapterId && Number.isInteger(eventIndex)) {
    const targetId = legacyMap.targetEventIds[eventIndex];
    // Invalid old indices retain the established restoreArrivalIndex fallback instead of being clamped.
    if (targetId) {
      const mapped = chapter.events.findIndex((event) => event.id === targetId);
      if (mapped < 0) throw new Error(`Missing Chapter Six legacy anchor: ${targetId}`);
      eventIndex = resolveRecordedPanel(chapter, state, mapped);
      sceneId = chapter.events[eventIndex]?.sceneId ?? chapter.sceneId;
    }
  }
  return { ...state, relationships, storyVariables, eventIndex, sceneId };
}
