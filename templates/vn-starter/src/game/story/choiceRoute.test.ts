import { expect, it } from "vitest";
import { chapterSchema } from "@content/chapterSchema";
import type { ChapterDefinition } from "@content/content.types";
import { initialGameState } from "@game/state/gameStore";
import { resolveChoiceRouteIndex } from "./choiceRoute";
import { chooseStoryOption, replayChapterState } from "./storyDecisions";
import { enterChapterBeat } from "./chapterProgress";

const definition = (): ChapterDefinition => ({
  id: "route-test",
  sceneId: "test",
  events: [
    { id: "choice", type: "choice", options: [{ id: "yes", text: "Yes", targetEventId: "route" }] },
    {
      id: "route",
      type: "choice_route",
      choiceEventId: "choice",
      cases: { yes: "nested" },
      defaultEventId: "end",
    },
    {
      id: "nested",
      type: "choice_route",
      choiceEventId: "choice",
      cases: { yes: "reply" },
      defaultEventId: "end",
    },
    { id: "reply", type: "dialogue", characterId: "PERSON", text: "Reply", nextEventId: "end" },
    { id: "end", type: "narration", text: "End", nextEventId: null },
  ],
});
it("choice routes resolve nested decision destinations using the atomically recorded new answer", () => {
  const chapter = definition();
  expect(chapterSchema.safeParse(chapter).success).toBe(true);
  const result = chooseStoryOption(
    chapter,
    enterChapterBeat(chapter, initialGameState(), 0),
    "choice",
    "yes",
  );
  expect(result.eventIndex).toBe(3);
  expect(result.choicesMade).toEqual({ choice: "yes" });
  expect(resolveChoiceRouteIndex(chapter, {}, 1)).toBe(4);
  expect(resolveChoiceRouteIndex(chapter, { choice: "constructor" }, 1)).toBe(4);
});
it("choice route validation rejects nonexistent choices, options, destinations, effects, and route cycles", () => {
  for (const change of [
    { choiceEventId: "missing" },
    { cases: { unknown: "end" } },
    { defaultEventId: "missing" },
    { cases: { yes: "route" } },
    { effects: [{ type: "relationship", key: "LiWei_Affection", delta: 1 }] },
    { nextEventId: "end" },
  ]) {
    const chapter = definition();
    const events = [...chapter.events];
    events[1] = { ...events[1]!, ...change } as (typeof events)[number];
    expect(chapterSchema.safeParse({ ...chapter, events }).success).toBe(false);
  }
  const chapter = definition();
  const route = chapter.events[2]!;
  if (route.type !== "choice_route") throw new Error("Missing route");
  route.cases.yes = "route";
  expect(chapterSchema.safeParse(chapter).success).toBe(false);
  expect(() => resolveChoiceRouteIndex(chapter, { choice: "yes" }, 1)).toThrow(
    "Choice route cycle",
  );
});
it("entry and replay resolve an opening route without recording the invisible index", () => {
  const original = definition();
  const chapter = {
    ...original,
    events: [original.events[1]!, original.events[0]!, ...original.events.slice(2)],
  };
  const state = { ...initialGameState(), choicesMade: { choice: "yes" } };
  expect(enterChapterBeat(chapter, state, 0).eventIndex).toBe(3);
  expect(replayChapterState(chapter, state).eventIndex).toBe(4);
  expect(() => resolveChoiceRouteIndex(chapter, {}, 0.5)).toThrow("Invalid chapter event index");
});
