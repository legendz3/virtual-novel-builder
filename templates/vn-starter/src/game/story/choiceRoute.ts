import type { ChapterDefinition } from "@content/content.types";
import type { GameState } from "@game/state/gameState.types";

// Routing has no side effects: only visible destinations may enter saves, audio, or rendering.
export function resolveChoiceRouteIndex(
  chapter: ChapterDefinition,
  choicesMade: GameState["choicesMade"],
  eventIndex: number,
): number {
  const visited = new Set<number>();
  let index = eventIndex;
  for (;;) {
    const event = chapter.events[index];
    if (!Number.isInteger(index) || !event) throw new Error("Invalid chapter event index");
    if (event.type !== "choice_route") return index;
    if (visited.has(index)) throw new Error(`Choice route cycle: ${event.id}`);
    visited.add(index);
    const selected = choicesMade[event.choiceEventId];
    const target =
      selected && Object.hasOwn(event.cases, selected)
        ? event.cases[selected]!
        : event.defaultEventId;
    index = chapter.events.findIndex((item) => item.id === target);
  }
}
