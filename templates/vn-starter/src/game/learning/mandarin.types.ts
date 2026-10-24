export interface MandarinSegment {
  hanzi: string;
  pinyin: string;
  meaning: string;
}
/** Silent, fully supported written gloss; never part of a character recording. */
export interface LanguageNote extends MandarinSegment {
  explanation?: string;
}
export type MandarinSpeech =
  | { mode: "unvoiced"; reason: "mixed-explanation"; purpose: string }
  | { mode: "recorded"; audioId: string; spokenText?: string };
interface MandarinIdentity {
  speakerId: string;
  layout: "block" | "segments";
  segments: MandarinSegment[];
}
export type MandarinDialogue = MandarinIdentity &
  (
    | { mode: "supported"; speech: MandarinSpeech; reveal?: never; meaningLabel?: string }
    | {
        mode: "meaning-hidden" | "audio-only";
        speech: Extract<MandarinSpeech, { mode: "recorded" }>;
        reveal: { eventIds: string[]; purpose: string };
      }
  );
export type MandarinSupportPlacement =
  | {
      kind: "resolved-answer";
      assessmentEventId: string;
      outcome: "correct" | "incorrect";
      // Authoring proof for one hidden wrong-answer dispatch; never gates runtime support.
      viaChoiceRoute?: { eventId: string; optionId: string; defaultEventId: string };
    }
  | { kind: "recognition" | "clarification"; interveningEventIds: string[] };
interface MandarinSupportIdentity {
  sourceEventId: string;
  placement: MandarinSupportPlacement;
  purpose: string;
}
export type MandarinSupport = MandarinSupportIdentity &
  (
    | { kind: "natural-meaning"; english: { field: "text" | "prompt"; exactSpan: string } }
    | {
        kind: "question-context";
        alreadySupportedOutcome?: {
          assessmentEventId: string;
          optionId: string;
          supportEventId: string;
        };
      }
  );
