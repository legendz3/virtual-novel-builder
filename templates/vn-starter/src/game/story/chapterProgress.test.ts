import { describe, expect, it } from "vitest";
import chapterContent from "@content/chapters/chapter-one.json";
import { loadChapter } from "@content/chapterLoader";
import { chapterSchema } from "@content/chapterSchema";
import { initialGameState } from "@game/state/gameStore";
import { serializeGameSave } from "@game/save/SaveManager";
import { migrateSave } from "@game/save/save.types";
import { enterChapterBeat } from "./chapterProgress";
import { chooseStoryOption, replayChapterState } from "./storyDecisions";
import { restoreArrivalIndex } from "./arrivalProgress";
import { StoryEngine } from "./StoryEngine";

const chapter = await loadChapter("chapter-one");
const indexOf = (id: string) => chapter.events.findIndex((event) => event.id === id);
const end = chapter.events.find((event) => event.type === "chapter_end")!;

describe("chapterProgress train finale", () => {
  for (const [option, branchEnd, affection, rivalry, confidence] of [
    ["fluent", "sounds-like-challenge", 0, 2, 1],
    ["teach-me", "lingering-look", 2, 0, 0],
    ["prove-it", "prove-it", 0, 1, 0],
  ] as const) {
    it(`routes ${option} through its authored response to the chapter end with exact rewards`, async () => {
      const previous = enterChapterBeat(
        chapter,
        {
          ...initialGameState(),
          relationships: { LiWei_Affection: 1, LiWei_Rivalry: 1 },
          storyVariables: { ...initialGameState().storyVariables, Mandarin: 1, Independence: 1 },
          choicesMade: { "suitcase-choice": "tease" },
        },
        indexOf("train-challenge-choice"),
      );
      let state = chooseStoryOption(chapter, previous, "train-challenge-choice", option);
      expect(state.relationships).toEqual({
        LiWei_Affection: 1 + affection,
        LiWei_Rivalry: 1 + rivalry,
      });
      expect(state.storyVariables).toEqual({
        ...initialGameState().storyVariables,
        Mandarin: 1,
        Independence: 1,
        ...(confidence ? { Confidence: confidence } : {}),
      });
      expect(chooseStoryOption(chapter, state, "train-challenge-choice", option)).toBe(state);
      const engine = new StoryEngine(async () => chapter);
      await engine.loadChapter(chapter.id);
      let beat = engine.goto(chapter.events[state.eventIndex]!.id);
      const visited: string[] = [];
      for (let steps = 0; steps < chapter.events.length; steps++) {
        visited.push(beat.id);
        state = enterChapterBeat(chapter, state, indexOf(beat.id));
        const next = engine.next();
        if (!next) break;
        beat = next;
      }
      expect(visited).toContain(branchEnd);
      expect(visited.at(-1)).toBe("chapter-one-end");
      expect(visited.filter((id) => id === "beijing-skyline")).toHaveLength(1);
      expect(
        visited.filter((id) =>
          ["sounds-like-challenge", "lingering-look", "prove-it"].includes(id),
        ),
      ).toEqual([branchEnd]);
      expect(Object.keys(state.vocabularyProgress)).toHaveLength(6);
      const replay = replayChapterState(chapter, state);
      expect(replay.relationships).toEqual({ LiWei_Affection: 0, LiWei_Rivalry: 0 });
      expect(replay.storyVariables.Confidence ?? 0).toBe(0);
      expect(replay.vocabularyProgress).toEqual(state.vocabularyProgress);
    });
  }
  it("unlocks all six vocabulary entries in schema-v1 saves without overwriting learning or awarding twice", () => {
    const learned = {
      vocabularyId: "beijing",
      exposures: 7,
      correct: 3,
      incorrect: 1,
      mastery: 42,
    };
    const previous = { ...initialGameState(), vocabularyProgress: { beijing: learned } };
    expect(
      enterChapterBeat(chapter, previous, indexOf("looks-away-first")).vocabularyProgress,
    ).toEqual(previous.vocabularyProgress);
    const complete = enterChapterBeat(chapter, previous, indexOf(end.id));
    expect(complete.vocabularyProgress.beijing).toEqual(learned);
    expect(complete.vocabularyProgress.bucuo).toEqual({
      vocabularyId: "bucuo",
      exposures: 1,
      correct: 0,
      incorrect: 0,
      mastery: 0,
    });
    expect(Object.keys(complete.vocabularyProgress)).toEqual([
      "beijing",
      "jiaohuansheng",
      "meiguo",
      "ziji",
      "kan-lu",
      "bucuo",
    ]);
    const save = migrateSave(serializeGameSave(complete));
    expect(save.version).toBe(1);
    expect(save.vocabularyProgress).toEqual(complete.vocabularyProgress);
    const restored = { ...initialGameState(), ...save };
    expect(restoreArrivalIndex(chapter, restored)).toBe(indexOf(end.id));
    expect(enterChapterBeat(chapter, restored, restored.eventIndex).vocabularyProgress).toEqual(
      complete.vocabularyProgress,
    );
  });
  it("continues the shipped crossing endpoint into the train without changing its saved index", async () => {
    const previous = {
      ...initialGameState(),
      chapterId: "chapter-one",
      sceneId: "airport-crossing",
      eventIndex: 77,
    };
    expect(chapter.events[77]!.id).toBe("keeps-walking");
    expect(restoreArrivalIndex(chapter, previous)).toBe(77);
    const engine = new StoryEngine(async () => chapter);
    await engine.loadChapter(chapter.id);
    engine.goto("keeps-walking");
    expect(engine.next()?.id).toBe("airport-express-train");
  });
  it("rejects malformed vocabulary and invalid chapter-end destinations", () => {
    expect(() =>
      chapterSchema.parse({ ...chapterContent, events: [{ ...end, nextEventId: "missing" }] }),
    ).toThrow();
    if (end.type !== "chapter_end") throw new Error("Missing chapter end");
    expect(() =>
      chapterSchema.parse({
        ...chapterContent,
        events: [{ ...end, vocabulary: [end.vocabulary[0], end.vocabulary[0]] }],
      }),
    ).toThrow("Duplicate vocabulary IDs");
    expect(() => enterChapterBeat(chapter, initialGameState(), -1)).toThrow(
      "Invalid chapter event index",
    );
  });
});
