import { expect, type Page } from "@playwright/test";
import chapter from "../../src/content/chapters/chapter-thirteen.json" with { type: "json" };

// Observe the native channel, not just the content field: unchanged track must not restart each turn.
export async function expectChapterThirteenMusic(page: Page): Promise<void> {
  const id = await page.locator(".game-viewport").getAttribute("data-event");
  const event = chapter.events.find((e) => e.id === id)!;
  await expect
    .poll(() =>
      page.evaluate(() => {
        const active = window.arrivalTestAudio.filter((a) => a.src.includes("/music/hope.mp3"));
        const first = window.arrivalTestAudio.find(
          (a) => a.dataset.chapterThirteenMusic === "first",
        );
        if (!first && active[0]) active[0].dataset.chapterThirteenMusic = "first";
        return active.map((a) => ({
          loop: a.loop,
          volume: a.volume,
          playing: !a.paused && a.currentTime > 0,
          muted: a.muted,
          sameLoop: a.dataset.chapterThirteenMusic === "first",
        }));
      }),
    )
    .toEqual([
      {
        loop: true,
        volume: event.presentation.musicVolume,
        playing: true,
        muted: false,
        sameLoop: true,
      },
    ]);
}
