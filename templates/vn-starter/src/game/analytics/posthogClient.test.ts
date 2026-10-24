import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { initialGameState } from "@game/state/gameStore";
const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  get_property: vi.fn(),
  get_distinct_id: vi.fn(() => "random-guest-id"),
}));
vi.mock("posthog-js/dist/module.no-external", () => ({ default: mocks }));
const chapter = {
  id: "test-chapter",
  events: [{ id: "start", type: "narration" as const, text: "Hello" }],
};
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  localStorage.clear();
  vi.stubEnv("VITE_POSTHOG_PROJECT_TOKEN", "phc_test");
  vi.stubEnv("VITE_POSTHOG_HOST", "https://us.i.posthog.com");
  vi.stubEnv("VITE_POSTHOG_ENABLED", "true");
  mocks.get_property.mockReturnValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());
it("requires explicit enablement, a public project token and a known ingestion host", async () => {
  const { posthogConfiguration } = await import("./posthogClient");
  const config = {
    VITE_POSTHOG_PROJECT_TOKEN: "phc_test",
    VITE_POSTHOG_HOST: "https://us.i.posthog.com",
    VITE_POSTHOG_ENABLED: "true",
  };
  expect(posthogConfiguration(config)).not.toBeNull();
  expect(posthogConfiguration({ ...config, VITE_POSTHOG_PROJECT_TOKEN: "phx_private" })).toBeNull();
  expect(
    posthogConfiguration({ ...config, VITE_POSTHOG_HOST: "https://untrusted.test" }),
  ).toBeNull();
  expect(posthogConfiguration({ ...config, VITE_POSTHOG_ENABLED: "false" })).toBeNull();
});
it("initializes once with only explicit events, no recordings, and a unique SDK guest identity", async () => {
  const { createChapterAnalytics } = await import("./posthogClient");
  const tracker = createChapterAnalytics();
  expect(mocks.init).not.toHaveBeenCalled();
  tracker.begin(
    chapter,
    initialGameState(),
    { ...initialGameState(), chapterId: chapter.id },
    false,
  );
  await vi.waitFor(() => expect(mocks.capture).toHaveBeenCalledTimes(2));
  expect(mocks.init).toHaveBeenCalledTimes(1);
  expect(mocks.capture.mock.calls.map(([event]) => event)).toEqual([
    "chapter_started",
    "chapter_progress",
  ]);
  expect(mocks.init).toHaveBeenCalledWith(
    "phc_test",
    expect.objectContaining({
      autocapture: false,
      capture_pageview: false,
      disable_session_recording: true,
      advanced_disable_flags: true,
      respect_dnt: true,
    }),
  );
  expect(mocks.identify).not.toHaveBeenCalled();
  expect(mocks.capture).toHaveBeenCalledWith(
    "chapter_started",
    expect.objectContaining({ environment: "test" }),
  );
  const beforeSend = mocks.init.mock.calls[0]![1].before_send;
  const payload = {
    event: "$identify",
    properties: { chapter_id: "one", $current_url: "https://example.test/#access_token=private" },
    $set_once: {
      $initial_current_url: "https://example.test/?code=private",
      $initial_referrer: "https://referrer.test/private",
    },
  };
  expect(beforeSend(payload)).toEqual({
    event: "$identify",
    properties: { chapter_id: "one" },
    $set_once: {},
  });
});
it("resets a previous signed-in identity before another user or guest records events", async () => {
  const { createChapterAnalytics } = await import("./posthogClient");
  mocks.get_property.mockReturnValue("alice");
  createChapterAnalytics().begin(
    chapter,
    initialGameState(),
    { ...initialGameState(), chapterId: chapter.id, playerId: "bob" },
    false,
  );
  await vi.waitFor(() => expect(mocks.capture).toHaveBeenCalledTimes(2));
  expect(mocks.reset).toHaveBeenCalledWith(true);
  expect(mocks.identify).toHaveBeenCalledWith("bob");
  expect(mocks.reset.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.identify.mock.invocationCallOrder[0]!,
  );
  mocks.identify.mockClear();
  createChapterAnalytics().begin(
    chapter,
    initialGameState(),
    { ...initialGameState(), chapterId: chapter.id },
    false,
  );
  await vi.waitFor(() => expect(mocks.capture).toHaveBeenCalledTimes(4));
  expect(mocks.identify).not.toHaveBeenCalled();
});

it("leaves the SDK unused when analytics is disabled", async () => {
  vi.stubEnv("VITE_POSTHOG_ENABLED", "false");
  const { createChapterAnalytics } = await import("./posthogClient");
  createChapterAnalytics().begin(
    chapter,
    initialGameState(),
    { ...initialGameState(), chapterId: chapter.id },
    false,
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(mocks.init).not.toHaveBeenCalled();
  expect(mocks.capture).not.toHaveBeenCalled();
});

it("contains SDK initialization failure and retries on later progression", async () => {
  mocks.init.mockImplementationOnce(() => {
    throw new Error("SDK unavailable");
  });
  const { createChapterAnalytics } = await import("./posthogClient");
  const tracker = createChapterAnalytics();
  const state = { ...initialGameState(), chapterId: chapter.id };
  tracker.begin(chapter, initialGameState(), state, false);
  await vi.waitFor(() => expect(mocks.init).toHaveBeenCalledTimes(1));
  await new Promise((resolve) => setTimeout(resolve, 0));
  expect(mocks.capture).not.toHaveBeenCalled();
  tracker.begin(chapter, state, state, false);
  await vi.waitFor(() => expect(mocks.capture).toHaveBeenCalledTimes(2));
  expect(mocks.init).toHaveBeenCalledTimes(2);
});
