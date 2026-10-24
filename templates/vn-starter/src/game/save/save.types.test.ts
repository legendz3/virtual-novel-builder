import { expect, it } from "vitest";
import { initialGameState } from "@game/state/gameStore";
import { serializeGameSave } from "./SaveManager";
import { migrateSave } from "./save.types";
it("GameSave serializes as versioned JSON without transient fields", () => {
  const save = serializeGameSave({ ...initialGameState(), playerId: "private", isDirty: true });
  expect(migrateSave(JSON.parse(JSON.stringify(save)))).toEqual(save);
  expect(save.version).toBe(1);
  expect(save).not.toHaveProperty("isDirty");
  expect(save).not.toHaveProperty("playerId");
});
it("save migration rejects unknown versions, corrupt counters, invalid timestamps and non-JSON variables", () => {
  const save = serializeGameSave(initialGameState());
  for (const patch of [
    { version: 2 },
    { version: 0 },
    { eventIndex: -1 },
    { createdAt: "bad" },
    { storyVariables: { callback: () => {} } },
    {
      vocabularyProgress: {
        word: { vocabularyId: "word", exposures: 0, correct: 0, incorrect: 0, mastery: 101 },
      },
    },
  ])
    expect(() => migrateSave({ ...save, ...patch })).toThrow();
});
