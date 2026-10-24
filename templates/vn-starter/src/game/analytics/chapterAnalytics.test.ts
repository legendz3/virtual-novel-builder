import { describe, expect, it, vi } from "vitest";
import type { ChapterDefinition } from "@content/content.types";
import { initialGameState } from "@game/state/gameStore";
import { ChapterAnalytics } from "./chapterAnalytics";

const chapter: ChapterDefinition = {
  id: "chapter-future",
  label: "Future chapter",
  sceneId: "arrival",
  events: [
    { id: "start", type: "narration", text: "Start" },
    {
      id: "choice",
      type: "choice",
      options: [{ id: "skip", text: "Skip", targetEventId: "cafe" }],
    },
    { id: "optional", type: "narration", text: "Optional", sceneId: "optional-scene" },
    { id: "cafe", type: "narration", text: "Cafe", sceneId: "cafe" },
    { id: "last-line", type: "narration", text: "Last line", sceneId: "cafe" },
    {
      id: "end",
      type: "chapter_end",
      title: "End",
      vocabularyTitle: "Words",
      vocabulary: [],
      nextEventId: null,
    },
  ],
};
const stateAt = (eventIndex: number, playerId?: string) => ({
  ...initialGameState(),
  chapterId: chapter.id,
  eventIndex,
  playerId,
});
function setup() {
  const storage = new Map<string, string>();
  let time = 1_000;
  let sequence = 0;
  const dependencies = {
    capture: vi.fn(),
    read: (key: string) => storage.get(key) ?? null,
    write: (key: string, value: string) => {
      storage.set(key, value);
    },
    uuid: () => `run-${++sequence}`,
    now: () => time,
  };
  return {
    dependencies,
    tracker: new ChapterAnalytics(dependencies),
    tick: (ms: number) => {
      time += ms;
    },
    storage,
  };
}
describe("ChapterAnalytics", () => {
  it("tracks any chapter without content changes, handles branch jumps, and coalesces progress", () => {
    const { tracker, dependencies, tick } = setup();
    const original = stateAt(0);
    tracker.begin(chapter, initialGameState(), original, true);
    expect(dependencies.capture.mock.calls.map(([name]) => name)).toEqual([
      "chapter_started",
      "chapter_progress",
    ]);
    tracker.progress(stateAt(1));
    expect(dependencies.capture).toHaveBeenCalledTimes(2);
    tracker.progress(stateAt(3));
    expect(dependencies.capture).toHaveBeenLastCalledWith(
      "chapter_progress",
      expect.objectContaining({ scene_id: "cafe", event_id: "cafe", scenes_reached: 2 }),
      undefined,
    );
    tracker.progress(stateAt(4));
    tick(30_000);
    tracker.progress(stateAt(4));
    tracker.progress(stateAt(4));
    expect(dependencies.capture).toHaveBeenCalledTimes(4);
    expect(original).toEqual(stateAt(0));
    expect(dependencies.capture.mock.calls.some(([, props]) => "progress_percent" in props)).toBe(
      false,
    );
  });
  it("reports completion once, retains its run across reload, and does not count terminal resumes", () => {
    const { tracker, dependencies } = setup();
    tracker.begin(chapter, initialGameState(), stateAt(0), false);
    tracker.progress(stateAt(5));
    tracker.progress(stateAt(5));
    tracker.finish();
    const reloaded = new ChapterAnalytics(dependencies);
    reloaded.begin(chapter, stateAt(5), stateAt(5), false);
    reloaded.progress(stateAt(5));
    expect(
      dependencies.capture.mock.calls.filter(([name]) => name === "chapter_completed"),
    ).toHaveLength(1);
    expect(dependencies.capture).toHaveBeenLastCalledWith(
      "chapter_resumed",
      expect.objectContaining({ run_id: "run-1", completed: true, start_observed: true }),
      undefined,
    );
  });
  it("keeps historical resumed runs out of starter cohort completion rates", () => {
    const { tracker, dependencies } = setup();
    tracker.begin(chapter, stateAt(3), stateAt(3), false);
    tracker.progress(stateAt(5));
    expect(
      dependencies.capture.mock.calls.filter(([name]) => name === "chapter_started"),
    ).toHaveLength(0);
    expect(dependencies.capture).toHaveBeenLastCalledWith(
      "chapter_completed",
      expect.objectContaining({ start_observed: false }),
      undefined,
    );
  });
  it("replays get a new attempt while chapter resumes keep the previous one", () => {
    const { tracker, dependencies } = setup();
    tracker.begin(chapter, initialGameState(), stateAt(0), true);
    tracker.progress(stateAt(3));
    tracker.finish();
    tracker.begin(chapter, stateAt(3), stateAt(3), false);
    expect(
      dependencies.capture.mock.calls.find(([name]) => name === "chapter_resumed")?.[1],
    ).toMatchObject({ run_id: "run-1" });
    tracker.begin(chapter, stateAt(3), stateAt(0), true);
    expect(
      dependencies.capture.mock.calls.filter(([name]) => name === "chapter_started")[1]?.[1],
    ).toMatchObject({ run_id: "run-2", entry_mode: "replay" });
  });
  it("flushes the last committed beat once on pause/navigation and ignores another account's state", () => {
    const { tracker, dependencies } = setup();
    tracker.begin(chapter, initialGameState(), stateAt(0, "alice"), false);
    tracker.progress(stateAt(1, "alice"));
    tracker.progress(stateAt(5, "bob"));
    tracker.flush();
    tracker.flush();
    tracker.finish();
    expect(dependencies.capture).toHaveBeenCalledTimes(3);
    expect(dependencies.capture).toHaveBeenLastCalledWith(
      "chapter_progress",
      expect.objectContaining({ event_id: "choice" }),
      "alice",
    );
    tracker.begin(chapter, stateAt(3, "bob"), stateAt(3, "bob"), false);
    expect(
      dependencies.capture.mock.calls.find(([, props]) => props.run_id === "run-2")?.[1],
    ).toMatchObject({ start_observed: false });
  });
  it("survives corrupt/unavailable storage and SDK failures", () => {
    const { dependencies } = setup();
    dependencies.read = () => "invalid JSON";
    dependencies.write = () => {
      throw new Error("storage denied");
    };
    dependencies.capture.mockImplementation(() => {
      throw new Error("offline");
    });
    const tracker = new ChapterAnalytics(dependencies);
    expect(() => {
      tracker.begin(chapter, stateAt(3), stateAt(3), false);
      tracker.progress(stateAt(5));
      tracker.finish();
    }).not.toThrow();
  });
  it("disabled telemetry creates no events or tracking storage", () => {
    const { dependencies, storage } = setup();
    const tracker = new ChapterAnalytics({ ...dependencies, enabled: () => false });
    tracker.begin(chapter, initialGameState(), stateAt(0), true);
    tracker.progress(stateAt(5));
    tracker.finish();
    expect(dependencies.capture).not.toHaveBeenCalled();
    expect(storage.size).toBe(0);
  });
});
