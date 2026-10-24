import { expect, it } from "vitest";
import { createGameStore } from "./gameStore";
it("gameStore publishes one atomic chapter, scene and beat update for autosave", () => {
  const store = createGameStore();
  const changes: number[] = [];
  store.subscribe((state) => changes.push(state.eventIndex));
  store.getState().setStoryProgress("chapter-one", "arrival", 6);
  expect(changes).toEqual([6]);
  expect(store.getState()).toMatchObject({
    chapterId: "chapter-one",
    sceneId: "arrival",
    eventIndex: 6,
    isDirty: true,
  });
  expect(() => store.getState().setStoryProgress("chapter-one", "arrival", -1)).toThrow();
});
it("gameStore actions mutate immutable progress and mark it dirty", () => {
  const store = createGameStore();
  const before = store.getState();
  store.getState().setChapter("test");
  store.getState().setScene("test-scene");
  store.getState().setEventIndex(2);
  store.getState().setStoryVariable("test", true);
  store.getState().setRelationship("test", 1);
  store.getState().recordChoice("test", "option");
  expect(before.isDirty).toBe(false);
  expect(store.getState()).toMatchObject({
    chapterId: "test",
    sceneId: "test-scene",
    eventIndex: 2,
    isDirty: true,
    storyVariables: { test: true },
    relationships: { test: 1 },
    choicesMade: { test: "option" },
  });
  store.getState().resetGame();
  expect(store.getState().chapterId).toBeUndefined();
  expect(store.getState().eventIndex).toBe(0);
  expect(store.getState().isDirty).toBe(true);
});
