import { z } from "zod";

export const nonblank = z.string().refine((value) => value.trim().length > 0, "Must not be blank");
export const containsHan = (value: string): boolean => /\p{Script=Han}/u.test(value);
export const mandarinSegmentSchema = z
  .object({
    hanzi: nonblank.refine(containsHan, "Mandarin segment requires Chinese characters"),
    // Neutral syllables are legitimate; requiring a tone mark on every syllable is incorrect.
    pinyin: nonblank.refine(
      (value) => !containsHan(value) && /[a-züāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/iu.test(value),
      "Expected pinyin",
    ),
    meaning: nonblank,
  })
  .strict();
const segmentList = z.array(mandarinSegmentSchema).min(1);
const recorded = z
  .object({ mode: z.literal("recorded"), audioId: nonblank, spokenText: nonblank.optional() })
  .strict();
const identity = {
  speakerId: nonblank,
  layout: z.enum(["block", "segments"]),
  segments: segmentList,
};
const reveal = z.object({ eventIds: z.array(nonblank).min(1), purpose: nonblank }).strict();
export const mandarinDialogueSchema = z.discriminatedUnion("mode", [
  z
    .object({
      ...identity,
      mode: z.literal("supported"),
      // Authored learner errors label intention without presenting the sentence as a model.
      meaningLabel: nonblank.optional(),
      speech: z.discriminatedUnion("mode", [
        z
          .object({
            mode: z.literal("unvoiced"),
            reason: z.literal("mixed-explanation"),
            purpose: nonblank,
          })
          .strict(),
        recorded,
      ]),
    })
    .strict(),
  z.object({ ...identity, mode: z.literal("meaning-hidden"), speech: recorded, reveal }).strict(),
  z.object({ ...identity, mode: z.literal("audio-only"), speech: recorded, reveal }).strict(),
]);
const supportPlacement = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("resolved-answer"),
      assessmentEventId: nonblank,
      outcome: z.enum(["correct", "incorrect"]),
      viaChoiceRoute: z
        .object({ eventId: nonblank, optionId: nonblank, defaultEventId: nonblank })
        .strict()
        .optional(),
    })
    .strict(),
  z.object({ kind: z.literal("recognition"), interveningEventIds: z.array(nonblank) }).strict(),
  z.object({ kind: z.literal("clarification"), interveningEventIds: z.array(nonblank) }).strict(),
]);
const supportIdentity = { sourceEventId: nonblank, placement: supportPlacement, purpose: nonblank };
export const mandarinSupportSchema = z.discriminatedUnion("kind", [
  z
    .object({
      ...supportIdentity,
      kind: z.literal("natural-meaning"),
      english: z.object({ field: z.enum(["text", "prompt"]), exactSpan: nonblank }).strict(),
    })
    .strict(),
  z
    .object({
      ...supportIdentity,
      kind: z.literal("question-context"),
      alreadySupportedOutcome: z
        .object({ assessmentEventId: nonblank, optionId: nonblank, supportEventId: nonblank })
        .strict()
        .optional(),
    })
    .strict(),
]);

/** Map each segment to a separate exact source occurrence; every Han character must be covered. */
export function hasCompleteMandarinCoverage(
  text: string,
  segments: readonly { hanzi: string }[],
): boolean {
  const used = new Set<number>();
  for (const segment of segments) {
    let start = text.indexOf(segment.hanzi);
    while (
      start >= 0 &&
      Array.from({ length: segment.hanzi.length }, (_, offset) => offset).some((offset) =>
        used.has(start + offset),
      )
    )
      start = text.indexOf(segment.hanzi, start + 1);
    if (start < 0) return false;
    for (let offset = 0; offset < segment.hanzi.length; offset++) used.add(start + offset);
  }
  let offset = 0;
  for (const character of text) {
    if (containsHan(character) && !used.has(offset)) return false;
    offset += character.length;
  }
  return true;
}
