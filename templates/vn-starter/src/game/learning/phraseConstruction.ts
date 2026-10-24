import type {
  PhraseConstructionExercise,
  PhraseDraft,
  PhraseEdit,
  PhraseEvaluation,
} from "./phraseConstruction.types";

export function readPhraseDraft(exercise: PhraseConstructionExercise, value: unknown): PhraseDraft {
  const empty: PhraseDraft = {
    tiles: exercise.slots.map(() => null),
    coaching: null,
    usedHelp: false,
  };
  if (!value || typeof value !== "object" || !("tiles" in value) || !Array.isArray(value.tiles))
    return empty;
  const tiles: unknown[] = value.tiles;
  const known = new Set(exercise.tiles.map((tile) => tile.id));
  const placed = tiles.filter((id) => id !== null);
  if (
    tiles.length !== exercise.slots.length ||
    placed.some((id) => typeof id !== "string" || !known.has(id)) ||
    new Set(placed).size !== placed.length
  )
    return empty;
  return {
    tiles: tiles as (string | null)[],
    coaching:
      "coaching" in value && (value.coaching === "structure" || value.coaching === "request")
        ? value.coaching
        : null,
    usedHelp: "usedHelp" in value && value.usedHelp === true,
  };
}

// Slot labels scaffold the sentence without preventing learners from trying a different order.
export function evaluatePhrase(
  exercise: PhraseConstructionExercise,
  tileIds: (string | null)[],
): PhraseEvaluation {
  if (tileIds.length !== exercise.slots.length || tileIds.some((id) => id === null))
    return { kind: "incomplete" };
  const tiles = tileIds.map((id) => exercise.tiles.find((tile) => tile.id === id));
  if (
    new Set(tileIds).size !== tileIds.length ||
    tiles.some((tile, index) => tile?.role !== exercise.slots[index]!.role)
  )
    return { kind: "structure" };
  if (exercise.requestTileId && !tileIds.includes(exercise.requestTileId))
    return { kind: "request" };
  const outcome = exercise.outcomes.find((item) =>
    item.tileIds.every((id, index) => id === tileIds[index]),
  );
  // Content validation guarantees a story destination for every grammatically valid combination.
  if (!outcome) throw new Error("Missing phrase outcome");
  return { kind: "accepted", outcome };
}

export function editPhraseDraft(
  exercise: PhraseConstructionExercise,
  draft: PhraseDraft,
  edit: PhraseEdit,
): PhraseDraft {
  const tiles = [...draft.tiles];
  if (edit.type === "clear") return { ...draft, tiles: tiles.map(() => null), coaching: null };
  if (edit.type === "help") {
    if (!draft.coaching) return draft;
    // Keep the learner's chosen meaning when repairing phrase order, including unintended meanings.
    const requestRole = exercise.tiles.find((tile) => tile.id === exercise.requestTileId)?.role;
    const ordered = exercise.slots.map((slot, index) =>
      slot.role === requestRole && exercise.requestTileId
        ? exercise.requestTileId
        : (tiles.find((id) => exercise.tiles.find((tile) => tile.id === id)?.role === slot.role) ??
          exercise.modelTileIds[index]!),
    );
    return { tiles: ordered, coaching: null, usedHelp: true };
  }
  if (edit.type === "remove") {
    if (!Number.isInteger(edit.slotIndex) || edit.slotIndex < 0 || edit.slotIndex >= tiles.length)
      return draft;
    tiles[edit.slotIndex] = null;
  } else {
    if (!exercise.tiles.some((tile) => tile.id === edit.tileId)) return draft;
    const slot = edit.slotIndex ?? tiles.indexOf(null);
    if (!Number.isInteger(slot) || slot < 0 || slot >= tiles.length) return draft;
    const previous = tiles.indexOf(edit.tileId);
    if (previous === slot) return draft;
    if (previous >= 0) tiles[previous] = tiles[slot]!;
    tiles[slot] = edit.tileId;
  }
  return { ...draft, tiles, coaching: null };
}
