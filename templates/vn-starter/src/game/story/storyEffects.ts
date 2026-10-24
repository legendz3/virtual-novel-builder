import { reconcileRelationshipRewards } from "@game/relationship/relationshipRevisions";
import type { GameState } from "@game/state/gameState.types";
import type { StoryEffect } from "./story.types";

export function applyStoryEffects(
  state: GameState,
  effects: StoryEffect[],
  direction = 1,
): GameState {
  const relationships = { ...state.relationships };
  const storyVariables = { ...state.storyVariables };
  for (const effect of effects) {
    const values = effect.type === "relationship" ? relationships : storyVariables;
    const previous = values[effect.key];
    values[effect.key] =
      (typeof previous === "number" && Number.isFinite(previous) ? previous : 0) +
      direction * effect.delta;
  }
  return { ...state, relationships, storyVariables };
}

// Stored in schema-v1 storyVariables so resuming a beat cannot duplicate its award.
export function chapterBeatEffectKey(chapterId: string, eventId: string): string {
  return `beat-effects:${chapterId}:${eventId}`;
}

export function storyStatChanges(
  effects: StoryEffect[],
  previous: GameState,
  next: GameState,
): StoryEffect[] {
  // Historical maintenance is silent even for defensive entry of an unhydrated state.
  previous = reconcileRelationshipRewards(previous);
  const seen = new Set<string>();
  return effects.flatMap((effect) => {
    if (seen.has(effect.key)) return [];
    seen.add(effect.key);
    const before =
      effect.type === "relationship"
        ? previous.relationships[effect.key]
        : previous.storyVariables[effect.key];
    const after =
      effect.type === "relationship"
        ? next.relationships[effect.key]
        : next.storyVariables[effect.key];
    const delta =
      (typeof after === "number" && Number.isFinite(after) ? after : 0) -
      (typeof before === "number" && Number.isFinite(before) ? before : 0);
    return delta === 0 ? [] : [{ ...effect, delta }];
  });
}
