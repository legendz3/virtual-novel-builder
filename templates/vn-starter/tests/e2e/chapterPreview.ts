import { currentStoryVariables } from "../../src/test/currentStoryVariables";
import { expect, type Page } from "@playwright/test";
import chapterOne from "../../src/content/chapters/chapter-one.json" with { type: "json" };
import chapterTwo from "../../src/content/chapters/chapter-two.json" with { type: "json" };
import chapterThree from "../../src/content/chapters/chapter-three.json" with { type: "json" };
import chapterFour from "../../src/content/chapters/chapter-four.json" with { type: "json" };
import chapterFive from "../../src/content/chapters/chapter-five.json" with { type: "json" };
import chapterSix from "../../src/content/chapters/chapter-six.json" with { type: "json" };
import chapterSeven from "../../src/content/chapters/chapter-seven.json" with { type: "json" };
import chapterEight from "../../src/content/chapters/chapter-eight.json" with { type: "json" };
import chapterNine from "../../src/content/chapters/chapter-nine.json" with { type: "json" };
import chapterThirteen from "../../src/content/chapters/chapter-thirteen.json" with { type: "json" };
import chapterTwelve from "../../src/content/chapters/chapter-twelve.json" with { type: "json" };
import chapterEleven from "../../src/content/chapters/chapter-eleven.json" with { type: "json" };
import chapterTen from "../../src/content/chapters/chapter-ten.json" with { type: "json" };
import type { GameSave } from "../../src/game/save/save.types";

const previewChapters = {
  "chapter-one": chapterOne,
  "chapter-two": chapterTwo,
  "chapter-three": chapterThree,
  "chapter-four": chapterFour,
  "chapter-five": chapterFive,
  "chapter-six": chapterSix,
  "chapter-seven": chapterSeven,
  "chapter-eight": chapterEight,
  "chapter-nine": chapterNine,
  "chapter-ten": chapterTen,
  "chapter-eleven": chapterEleven,
  "chapter-twelve": chapterTwelve,
  "chapter-thirteen": chapterThirteen,
};

// Select by canonical authored answer text so display shuffling cannot change route coverage.
export async function chooseComprehensionAnswer(
  page: Page,
  chapterId: keyof typeof previewChapters,
  authoredIndex: number,
): Promise<void> {
  const id = await page.locator(".game-viewport").getAttribute("data-event");
  const event = previewChapters[chapterId].events.find((event) => event.id === id);
  if (event?.type !== "comprehension") throw new Error(`Expected comprehension at ${id}`);
  await page
    .getByRole("button", { name: event.exercise!.options[authoredIndex]!.text, exact: true })
    .click();
}

export async function seedChapterBeat(
  page: Page,
  eventId: string,
  reducedMotion: "reduce" | "no-preference" = "reduce",
  chapterId:
    | "chapter-one"
    | "chapter-two"
    | "chapter-three"
    | "chapter-four"
    | "chapter-five"
    | "chapter-six"
    | "chapter-seven"
    | "chapter-eight"
    | "chapter-nine"
    | "chapter-ten"
    | "chapter-eleven"
    | "chapter-twelve"
    | "chapter-thirteen" = "chapter-one",
): Promise<void> {
  const chapter = previewChapters[chapterId];
  await page.emulateMedia({ reducedMotion });
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.arrivalTestAudio = [];
    window.Audio = class extends NativeAudio {
      constructor(url?: string) {
        super(url);
        // Repeated seeded scenarios may stack init scripts; record each native element once.
        if (!window.arrivalTestAudio.includes(this)) window.arrivalTestAudio.push(this);
      }
    };
  });
  await page.goto("/");
  const eventIndex = chapter.events.findIndex((event) => event.id === eventId);
  const save: GameSave = {
    version: 1,
    chapterId: chapter.id,
    sceneId: chapter.events[eventIndex]!.sceneId ?? chapter.sceneId,
    eventIndex,
    storyVariables: { ...currentStoryVariables },
    relationships: {},
    vocabularyProgress: {},
    completedExercises: [],
    choicesMade: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await page.evaluate(
    (save) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open("dating-sim", 1);
        request.onupgradeneeded = () => request.result.createObjectStore("saves");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const transaction = db.transaction("saves", "readwrite");
          transaction.objectStore("saves").put(save, "guest:0");
          transaction.oncomplete = () => {
            db.close();
            resolve();
          };
          transaction.onerror = () => {
            db.close();
            reject(transaction.error);
          };
        };
      }),
    save,
  );
  await page.goto("/game");
  await page.getByRole("button", { name: "Resume scene" }).click();
  await expect(page.locator(".game-viewport")).toHaveAttribute("data-event", eventId);
}

export async function continueTo(page: Page, eventId: string): Promise<void> {
  for (
    let step = 0;
    step <
    chapterOne.events.length +
      chapterTwo.events.length +
      chapterThree.events.length +
      chapterFour.events.length +
      chapterFive.events.length +
      chapterSix.events.length +
      chapterSeven.events.length +
      chapterEight.events.length +
      chapterNine.events.length +
      chapterTen.events.length +
      chapterEleven.events.length +
      chapterTwelve.events.length +
      chapterThirteen.events.length;
    step++
  ) {
    if ((await page.locator(".game-viewport").getAttribute("data-event")) === eventId) return;
    await page.getByRole("button", { name: "Continue story" }).click();
  }
  throw new Error(`Did not reach ${eventId}`);
}

export async function expectArtworkFillsHost(page: Page): Promise<void> {
  await expect
    .poll(() =>
      page.locator(".phaser-host").evaluate((host) => {
        const parent = host.getBoundingClientRect();
        const canvas = host.querySelector("canvas")!.getBoundingClientRect();
        return Math.max(
          Math.abs(canvas.width - parent.width),
          Math.abs(canvas.height - parent.height),
        );
      }),
    )
    .toBeLessThan(2);
}

export async function savedChapter(page: Page): Promise<GameSave> {
  await page.getByRole("button", { name: "Save locally" }).click();
  await expect(page.getByText("Saved locally.", { exact: true })).toBeVisible();
  return page.evaluate(
    () =>
      new Promise<GameSave>((resolve, reject) => {
        const request = indexedDB.open("dating-sim", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const read = db.transaction("saves").objectStore("saves").get("guest:0");
          read.onsuccess = () => {
            db.close();
            resolve(read.result as GameSave);
          };
          read.onerror = () => {
            db.close();
            reject(read.error);
          };
        };
      }),
  );
}
