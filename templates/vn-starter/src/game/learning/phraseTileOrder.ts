import type { PhraseConstructionExercise, PhraseTile } from "./phraseConstruction.types";

/** Display-only order is stable by exercise identity; drafts and authored answer order stay intact. */
export function phraseTileOrder(exercise: PhraseConstructionExercise): PhraseTile[] {
  let state = 2166136261;
  for (const byte of new TextEncoder().encode(`phrase-bank-order-v1|${exercise.id}`))
    state = Math.imul(state ^ byte, 16777619) >>> 0;
  const shuffled = [...exercise.tiles];
  for (let index = shuffled.length - 1; index > 0; index--) {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    const random = ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    const other = Math.floor(random * (index + 1));
    [shuffled[index], shuffled[other]] = [shuffled[other]!, shuffled[index]!];
  }

  const answers = [exercise.modelTileIds, ...exercise.outcomes.map((outcome) => outcome.tileIds)];
  const exposesAnswer = (bank: PhraseTile[]) =>
    answers.some(
      (answer) =>
        answer.length === exercise.slots.length &&
        bank.some((_, start) => answer.every((id, offset) => bank[start + offset]?.id === id)),
    );
  for (let offset = 0; offset < shuffled.length; offset++) {
    const rotated = [...shuffled.slice(offset), ...shuffled.slice(0, offset)];
    if (!exposesAnswer(rotated)) return rotated;
  }

  // Reversing distinct slot roles prevents every complete forward answer in the current schema.
  // Stable sorting retains the seeded order within each role, without an unbounded random loop.
  const roleIndex = (tile: PhraseTile) =>
    exercise.slots.findIndex((slot) => slot.role === tile.role);
  const ordered = [...shuffled].sort((left, right) => roleIndex(right) - roleIndex(left));
  if (exposesAnswer(ordered))
    console.warn(`Phrase exercise ${exercise.id} cannot hide every answer in its bank order`);
  return ordered;
}
