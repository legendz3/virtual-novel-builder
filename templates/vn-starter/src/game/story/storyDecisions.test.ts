import { describe, expect, it } from "vitest";
import { loadChapter } from "@content/chapterLoader";
import { chapterSchema } from "@content/chapterSchema";
import { initialGameState } from "@game/state/gameStore";
import type { GameState } from "@game/state/gameState.types";
import { choiceStatChanges, chooseStoryOption, replayChapterState } from "./storyDecisions";
import { restoreArrivalIndex } from "./arrivalProgress";
import { StoryEngine } from "./StoryEngine";

const chapter = await loadChapter("chapter-one");
function at(eventId: string, state = initialGameState()): GameState {
  const eventIndex = chapter.events.findIndex((event) => event.id === eventId);
  return {
    ...state,
    chapterId: chapter.id,
    sceneId: chapter.events[eventIndex]!.sceneId,
    eventIndex,
  };
}

describe("storyDecisions arrival-hall branches", () => {
  for (const answer of ["A", "B", "C"]) {
    for (const suitcase of ["accept", "refuse", "tease"]) {
      it(`routes answer ${answer} and ${suitcase} to the authored crossing, with exact rewards`, async () => {
        const engine = new StoryEngine(async () => chapter);
        await engine.loadChapter(chapter.id);
        engine.goto("exchange-student-check");
        expect(engine.next()?.id).toBe("exchange-student-check");
        let state = chooseStoryOption(
          chapter,
          at("exchange-student-check"),
          "exchange-student-check",
          answer,
        );
        expect(chapter.events[state.eventIndex]?.id).toBe(
          answer === "A" ? "exchange-student-answer" : "amused-look",
        );
        expect(state.completedExercises).toEqual(["exchange-student-meaning"]);
        const visited: string[] = [];
        let beat = engine.goto(chapter.events[state.eventIndex]!.id);
        for (let steps = 0; steps < chapter.events.length; steps++) {
          visited.push(beat.id);
          if (beat.id === "keeps-walking") break;
          if (beat.type === "choice") {
            state = chooseStoryOption(chapter, at(beat.id, state), beat.id, suitcase);
            beat = engine.goto(chapter.events[state.eventIndex]!.id);
          } else {
            const next = engine.next();
            if (!next) break;
            beat = next;
          }
        }
        expect(visited.at(-1)).toBe("keeps-walking");
        expect(visited.includes("interesting")).toBe(answer !== "A");
        if (answer !== "A") {
          expect(visited.indexOf("interesting")).toBeLessThan(visited.indexOf("reaches-suitcase"));
          expect(chapter.events.find((event) => event.id === "interesting")).toMatchObject({
            text: "Interesting.\n\n你是美国来的交换生吗？",
            pinyin: "Nǐ shì Měiguó lái de jiāohuànshēng ma?",
            translation: "Are you the exchange student from America?",
          });
        }
        expect(visited.filter((id) => id === "outside-beijing")).toHaveLength(1);
        expect(visited).not.toContain(answer === "A" ? "amused-look" : "exchange-student-answer");
        expect(visited.includes("accept-thanks")).toBe(suitcase === "accept");
        expect(visited.includes("do-it-yourself")).toBe(suitcase === "refuse");
        expect(visited.includes("likes-emily")).toBe(suitcase === "tease");
        expect(state.relationships).toEqual(
          suitcase === "accept"
            ? { LiWei_Affection: 1 }
            : suitcase === "refuse"
              ? { LiWei_Rivalry: 1, LiWei_Trust: 1 }
              : { LiWei_Affection: 1, LiWei_Rivalry: 1 },
        );
        expect(state.storyVariables).toEqual(
          suitcase === "refuse"
            ? { ...initialGameState().storyVariables, Mandarin: 1, Independence: 1 }
            : initialGameState().storyVariables,
        );
      });
    }
  }
  it("ignores stale clicks and restores a decision destination without re-awarding", () => {
    const event = chapter.events.find((item) => item.id === "suitcase-choice")!;
    const state = chooseStoryOption(chapter, at("suitcase-choice"), "suitcase-choice", "tease");
    expect(chooseStoryOption(chapter, state, "suitcase-choice", "tease")).toBe(state);
    expect(choiceStatChanges(event, state, state)).toEqual([]);
    expect(restoreArrivalIndex(chapter, state)).toBe(state.eventIndex);
    const revisited = chooseStoryOption(
      chapter,
      at("suitcase-choice", state),
      "suitcase-choice",
      "refuse",
    );
    expect(revisited.relationships).toEqual(state.relationships);
    expect(revisited.storyVariables).toEqual({ ...initialGameState().storyVariables });
    expect(revisited.eventIndex).toBe(state.eventIndex);
    expect(choiceStatChanges(event, at("suitcase-choice", state), revisited)).toEqual([]);
  });
  it("reports newly applied choice deltas instead of accumulated stat totals", () => {
    const previous = at("train-challenge-choice", {
      ...initialGameState(),
      relationships: { LiWei_Rivalry: 4, LiWei_Affection: 3 },
      storyVariables: { ...initialGameState().storyVariables, Confidence: 2 },
    });
    const next = chooseStoryOption(chapter, previous, "train-challenge-choice", "fluent");
    expect(choiceStatChanges(chapter.events[previous.eventIndex]!, previous, next)).toEqual([
      { type: "stat", key: "Confidence", delta: 1 },
      { type: "relationship", key: "LiWei_Rivalry", delta: 2 },
    ]);
  });
  it("replay replaces chapter decisions and rewards while retaining unrelated progress", () => {
    let state = at("exchange-student-check", {
      ...initialGameState(),
      relationships: { LiWei_Affection: 4 },
      storyVariables: { ...initialGameState().storyVariables, Mandarin: 2, other: true },
      completedExercises: ["earlier"],
      choicesMade: { earlier: "yes" },
    });
    state = chooseStoryOption(chapter, state, "exchange-student-check", "B");
    state = chooseStoryOption(chapter, at("suitcase-choice", state), "suitcase-choice", "refuse");
    const replay = replayChapterState(chapter, state);
    expect(replay.eventIndex).toBe(0);
    expect(replay.sceneId).toBe("arrival");
    expect(replay.choicesMade).toEqual({ earlier: "yes" });
    expect(replay.completedExercises).toEqual(["earlier"]);
    expect(replay.storyVariables).toEqual({
      ...initialGameState().storyVariables,
      Mandarin: 2,
      Independence: 0,
      other: true,
    });
    const changed = chooseStoryOption(
      chapter,
      at("suitcase-choice", replay),
      "suitcase-choice",
      "tease",
    );
    expect(changed.relationships).toEqual({ LiWei_Affection: 5, LiWei_Rivalry: 1, LiWei_Trust: 0 });
  });
  it("rejects invalid options and malformed branch references before applying state", () => {
    expect(() =>
      chooseStoryOption(chapter, at("exchange-student-check"), "exchange-student-check", "D"),
    ).toThrow("Unknown comprehension option");
    expect(() =>
      chooseStoryOption(chapter, at("suitcase-choice"), "suitcase-choice", "missing"),
    ).toThrow("Unknown story option");
    expect(() =>
      chapterSchema.parse({
        ...chapter,
        events: [
          ...chapter.events,
          { id: "bad", type: "narration", text: "bad", nextEventId: "missing" },
        ],
      }),
    ).toThrow("Unknown event target");
    const check = chapter.events.find((event) => event.type === "comprehension")!;
    if (check.type !== "comprehension") throw new Error("Missing exercise");
    expect(() =>
      chapterSchema.parse({
        ...chapter,
        events: [{ ...check, exercise: { ...check.exercise, correctOptionId: "D" } }],
      }),
    ).toThrow("Unknown correct option");
  });
  it("keeps all shipped opening indices stable", () => {
    expect(chapter.events.slice(0, 14).map((event) => event.id)).toEqual([
      "touchdown",
      "captain-welcome",
      "eyes-open",
      "airport-window",
      "low-battery",
      "mom-landed",
      "mom-wechat",
      "mom-vpn",
      "mom-emma",
      "phone-locked",
      "one-year",
      "hesitation",
      "why-beijing",
      "title-reveal",
    ]);
  });
});
