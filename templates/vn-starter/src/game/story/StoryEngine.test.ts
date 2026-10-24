import { describe, expect, it } from "vitest";
import { StoryEngine } from "./StoryEngine";
describe("StoryEngine", () => {
  it("initializes without chapter content", () => {
    const engine = new StoryEngine();
    expect(engine.current()).toBeNull();
    expect(() => engine.start()).toThrow("Load a chapter");
  });
  it("loads external events, moves its cursor, and resets", async () => {
    const event = { id: "test-event", type: "set_variable" as const, key: "test", value: true };
    const engine = new StoryEngine(async (id) => ({ id, events: [event] }));
    await engine.loadChapter("test-only");
    expect(engine.start()).toEqual(event);
    expect(engine.next()).toBeNull();
    expect(engine.goto(event.id)).toEqual(event);
    expect(() => engine.goto("missing")).toThrow();
    engine.reset();
    expect(engine.current()).toBeNull();
  });
  it("reports missing chapter content explicitly", async () => {
    await expect(new StoryEngine().loadChapter("missing")).rejects.toThrow("not installed");
  });
});
