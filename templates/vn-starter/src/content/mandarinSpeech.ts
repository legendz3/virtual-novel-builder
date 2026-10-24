import type { MandarinDialogue, MandarinSpeech } from "../game/learning/mandarin.types";
import { containsHan, hasCompleteMandarinCoverage } from "./mandarinSchema";

const lexicalText = (text: string): string => text.replace(/[\p{P}\s]/gu, "");
/** Projection affects the recording identity only; displayed prose and teaching support stay untouched. */
export function mandarinSpokenText(text: string, speech: MandarinSpeech): string {
  return speech.mode === "recorded" ? (speech.spokenText ?? text) : text;
}

/** Every Chinese-bearing dialogue needs speech or an explicit reviewed explanation; Latin/gloss text never implicitly waives audio. */
export function mandarinSpeechIssue(text: string, content: MandarinDialogue): string | undefined {
  if (!containsHan(text)) return undefined;
  if (content.speech.mode === "unvoiced") {
    if (
      content.mode !== "supported" ||
      content.layout !== "segments" ||
      !/\p{Script=Latin}/u.test(text)
    )
      return "Standalone Chinese dialogue requires a recording; only supported mixed explanations may be unvoiced";
    if (
      content.speech.reason !== "mixed-explanation" ||
      typeof content.speech.purpose !== "string" ||
      !content.speech.purpose.trim()
    )
      return "Unvoiced mixed Chinese dialogue requires reason mixed-explanation and a contextual purpose";
    return undefined;
  }
  const projected = content.speech.spokenText;
  if (projected === undefined) {
    if (content.layout === "segments" && /\p{Script=Latin}/u.test(text))
      return "Recorded mixed Chinese dialogue requires an explicit spokenText projection excluding pinyin and English glosses";
    return undefined;
  }
  if (content.layout !== "segments")
    return "spokenText projection is only available for segments-layout dialogue";
  if (!hasCompleteMandarinCoverage(text, content.segments))
    return "Speech projection requires complete source Chinese segment coverage";
  let offset = 0;
  for (const segment of content.segments) {
    const start = text.indexOf(segment.hanzi, offset);
    if (start < 0) return "Speech projection segments must follow every source occurrence in order";
    offset = start + segment.hanzi.length;
  }
  const lexicalProjection = lexicalText(projected);
  if (
    !containsHan(projected) ||
    lexicalProjection !== lexicalText(content.segments.map((segment) => segment.hanzi).join(""))
  )
    return "Speech projection must preserve every authored Chinese segment word in order; only punctuation and whitespace may differ";
  if (/\p{Script=Latin}/u.test(projected))
    return "Speech projection must not record pinyin or English glosses";
  return undefined;
}
