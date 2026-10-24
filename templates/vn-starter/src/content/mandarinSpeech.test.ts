import { describe, expect, it } from "vitest";
import { mandarinSpeechIssue, mandarinSpokenText } from "./mandarinSpeech";
import { mandarinDialogueSchema } from "./mandarinSchema";
import { chapterSchema } from "./chapterSchema";
import { validateChapterMandarin } from "./chapterMandarinValidation";
import { loadChapter } from "./chapterLoader";
import type { MandarinDialogue } from "../game/learning/mandarin.types";
const example = (): Extract<MandarinDialogue, { mode: "supported" }> => ({
  mode: "supported",
  layout: "segments",
  speakerId: "emma",
  segments: [{ hanzi: "谢谢", pinyin: "Xièxie", meaning: "Thanks" }],
  speech: { mode: "recorded", audioId: "emma-thank-you", spokenText: "谢谢。" },
});

describe("Source-derived Mandarin speech contracts", () => {
  it.each(["谢谢", "谢谢。", "  谢谢！ ", "𠀀", "谢谢10次"])(
    "standalone %s cannot claim mixed explanation",
    (text) => {
      const content = example();
      content.speech = {
        mode: "unvoiced",
        reason: "mixed-explanation",
        purpose: "A supposed explanation",
      };
      expect(mandarinSpeechIssue(text, content)).toMatch(/requires a recording/);
    },
  );
  it("support labels and English meanings never waive a standalone recording", () => {
    const content = example();
    content.layout = "block";
    content.meaningLabel = "Emma's intended meaning";
    content.speech = {
      mode: "unvoiced",
      reason: "mixed-explanation",
      purpose: "Supported learner error",
    };
    expect(mandarinSpeechIssue("谢谢", content)).toMatch(/requires a recording/);
  });
  it.each([
    { mode: "unvoiced" },
    { mode: "unvoiced", reason: "mixed-explanation" },
    { mode: "unvoiced", reason: "mixed-explanation", purpose: " " },
    { mode: "unvoiced", reason: "translation-visible", purpose: "English is shown" },
  ])("rejects incomplete or invented unvoiced exception %j", (speech) => {
    expect(mandarinDialogueSchema.safeParse({ ...example(), speech }).success).toBe(false);
  });
  it("requires explicit contextual review even when Latin/pinyin/English is present", () => {
    const content = example();
    Reflect.set(content, "speech", { mode: "unvoiced" });
    expect(mandarinSpeechIssue("谢谢。Xièxie. Thanks.", content)).toMatch(/contextual purpose/);
    content.speech = {
      mode: "unvoiced",
      reason: "mixed-explanation",
      purpose: "English explanation discusses the quoted word after its voiced model.",
    };
    expect(
      mandarinSpeechIssue("The quoted 谢谢 is the object of this explanation.", content),
    ).toBeUndefined();
  });
  it("projects Chinese only and preserves exact punctuation identity for registry matching", () => {
    const content = example();
    expect(mandarinSpeechIssue("谢谢。Xièxie. Thanks.", content)).toBeUndefined();
    expect(mandarinSpokenText("谢谢。Xièxie. Thanks.", content.speech)).toBe("谢谢。");
    content.speech = { mode: "recorded", audioId: "example" };
    expect(mandarinSpokenText("谢谢！", content.speech)).toBe("谢谢！");
    expect(mandarinSpeechIssue("谢谢。Xièxie. Thanks.", content)).toMatch(/explicit spokenText/);
  });
  it.each(["谢", "谢谢谢谢", "不谢谢", "谢谢 Xièxie", "谢谢 Thanks", " ", "谢谢🙂", "谢\u200b谢"])(
    "rejects non-conserving projection %s",
    (spokenText) => {
      const content = example();
      content.speech = { mode: "recorded", audioId: "example", spokenText };
      expect(mandarinSpeechIssue("谢谢。Thanks.", content)).toBeDefined();
    },
  );
  it("compares all segments in source order, including repeated occurrences", () => {
    const content = example();
    content.segments = [
      { hanzi: "明天", pinyin: "Míngtiān", meaning: "Tomorrow" },
      { hanzi: "几点", pinyin: "Jǐ diǎn", meaning: "What time" },
    ];
    content.speech = { mode: "recorded", audioId: "example", spokenText: "明天。几点。" };
    expect(mandarinSpeechIssue("明天. Tomorrow. 几点. What time.", content)).toBeUndefined();
    content.segments.reverse();
    expect(mandarinSpeechIssue("明天. Tomorrow. 几点. What time.", content)).toMatch(
      /source occurrence in order/,
    );
    content.segments = [example().segments[0]!];
    content.speech.spokenText = "谢谢。";
    expect(mandarinSpeechIssue("谢谢. Thanks. 谢谢. Again.", content)).toMatch(/complete source/);
    content.segments.push(example().segments[0]!);
    content.speech.spokenText = "谢谢，谢谢！";
    expect(mandarinSpeechIssue("谢谢. Thanks. 谢谢. Again.", content)).toBeUndefined();
  });
  it("rejects projections on block dialogue and English hidden inside an authored Chinese segment", () => {
    const content = example();
    content.layout = "block";
    expect(mandarinSpeechIssue("谢谢", content)).toMatch(/only available for segments/);
    content.layout = "segments";
    content.segments[0]!.hanzi = "谢谢 Thanks";
    content.speech = { mode: "recorded", audioId: "example", spokenText: "谢谢 Thanks" };
    expect(mandarinSpeechIssue("谢谢 Thanks", content)).toMatch(
      /must not record pinyin or English/,
    );
  });
  it("schema and direct semantic validation reject missing speech independently of support mode", async () => {
    const chapter = await loadChapter("chapter-one");
    const copy = { ...structuredClone(chapter), events: structuredClone([...chapter.events]) };
    const event = copy.events.find((item) => item.id === "refuse-chinese")!;
    if (event.type !== "dialogue" || !event.mandarin) throw Error();
    event.mandarin.speech = {
      mode: "unvoiced",
      reason: "mixed-explanation",
      purpose: "English support exists",
    };
    expect(chapterSchema.safeParse(copy).success).toBe(false);
    expect(() => validateChapterMandarin(copy)).toThrow(/requires a recording/);
    delete event.mandarin;
    expect(chapterSchema.safeParse(copy).success).toBe(false);
    expect(() => validateChapterMandarin(copy)).toThrow(/requires a Mandarin speech contract/);
  });
  it("unknown IDs, wrong speakers and vocabulary substitutes still fail exact recording validation", async () => {
    const chapter = await loadChapter("chapter-one");
    for (const audioId of ["missing-recording", "sofia-eat-first", "vocabulary-xiexie"]) {
      const copy = { ...structuredClone(chapter), events: structuredClone([...chapter.events]) };
      const event = copy.events.find((item) => item.id === "refuse-chinese")!;
      if (event.type !== "dialogue" || !event.mandarin) throw Error();
      event.mandarin.speech = { mode: "recorded", audioId };
      expect(() => validateChapterMandarin(chapterSchema.parse(copy))).toThrow();
    }
  });
});
