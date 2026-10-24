import { describe, expect, it } from "vitest";
import { loadChapter } from "@content/chapterLoader";
import { initialGameState } from "@game/state/gameStore";
import { arrivalPhoneMessages, restoreArrivalIndex } from "./arrivalProgress";
import { chapterSchema } from "@content/chapterSchema";

describe("arrivalProgress", () => {
  it("restores a saved beat and rebuilds only messages already received", async () => {
    const chapter = await loadChapter("chapter-one");
    const index = restoreArrivalIndex(chapter, {
      ...initialGameState(),
      chapterId: chapter.id,
      sceneId: chapter.sceneId,
      eventIndex: 6,
    });
    expect(chapter.events[index]?.id).toBe("mom-wechat");
    expect(arrivalPhoneMessages(chapter, index).map((message) => message.id)).toEqual([
      "mom-landed",
      "mom-wechat",
    ]);
  });
  it("starts foundation saves and obsolete scene cursors at touchdown", async () => {
    const chapter = await loadChapter("chapter-one");
    for (const state of [
      initialGameState(),
      { ...initialGameState(), chapterId: chapter.id, sceneId: chapter.sceneId, eventIndex: 99 },
      { ...initialGameState(), chapterId: chapter.id, sceneId: "other", eventIndex: 6 },
    ]) {
      expect(restoreArrivalIndex(chapter, state)).toBe(0);
    }
  });
  it("rejects malformed chapter events and duplicate identities before playback", () => {
    expect(() =>
      chapterSchema.parse({
        id: "chapter-one",
        events: [{ id: "pause", type: "pause", durationMs: -1 }],
      }),
    ).toThrow();
    const event = { id: "same", type: "narration", text: "fixture" };
    expect(() => chapterSchema.parse({ id: "chapter-one", events: [event, event] })).toThrow(
      "Duplicate",
    );
  });
});
