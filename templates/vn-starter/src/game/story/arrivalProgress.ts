import type { ChapterDefinition } from "@content/content.types";
import type { GameState } from "@game/state/gameState.types";
import type { PhoneMessageEvent } from "./story.types";

// Foundation saves have no chapter. Invalid or obsolete cursors safely restart this installed scene.
export function restoreArrivalIndex(chapter: ChapterDefinition, state: GameState): number {
  return state.chapterId === chapter.id &&
    state.sceneId === (chapter.events[state.eventIndex]?.sceneId ?? chapter.sceneId) &&
    Number.isInteger(state.eventIndex) &&
    state.eventIndex >= 0 &&
    state.eventIndex < chapter.events.length
    ? state.eventIndex
    : 0;
}
export function arrivalPhoneMessages(
  chapter: ChapterDefinition,
  eventIndex: number,
): PhoneMessageEvent[] {
  return chapter.events
    .slice(0, eventIndex + 1)
    .filter((event): event is PhoneMessageEvent => event.type === "phone_message");
}
