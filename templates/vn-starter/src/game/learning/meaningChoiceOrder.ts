import type { MeaningChoiceExercise } from "./learning.types";

// Versioned per-question order stays stable across retry, reload and replay; correctness is never an input.
export function meaningChoiceOrder(
  chapterId: string,
  eventId: string,
  options: MeaningChoiceExercise["options"],
): MeaningChoiceExercise["options"] {
  let state = 2166136261;
  for (const byte of new TextEncoder().encode(`meaning-choice-order-v1|${chapterId}|${eventId}`))
    state = Math.imul(state ^ byte, 16777619) >>> 0;
  const ordered = [...options];
  for (let index = ordered.length - 1; index > 0; index--) {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    const random = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    const other = Math.floor(random * (index + 1));
    [ordered[index], ordered[other]] = [ordered[other]!, ordered[index]!];
  }
  return ordered;
}
