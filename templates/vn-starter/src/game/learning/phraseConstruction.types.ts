import type { StoryEffect } from "@game/story/story.types";

export type PhraseRole = string;
export interface PhraseTile {
  id: string;
  text: string;
  // Required nonblank translation, revealed only by the shared lookup control.
  meaning: string;
  pinyin: string;
  role: PhraseRole;
  audioId: string;
  // Null is accepted only for the exact approved legacy pronunciation usages.
  speakerId: string | null;
}
export interface PhraseOutcome {
  id: string;
  tileIds: string[];
  targetEventId: string;
  assistedTargetEventId?: string;
  effects: StoryEffect[];
}
export interface PhraseConstructionExercise {
  id: string;
  title: string;
  characterId: string;
  // Omission retains the authored question header in earlier exercises.
  showQuestion?: boolean;
  question: string;
  pinyin: string;
  translation: string;
  goal: string;
  slots: { role: PhraseRole; label: string }[];
  tiles: PhraseTile[];
  // Optional speech-act constraint, such as requesting instead of stating a preference.
  requestTileId?: string;
  /** @deprecated Compatibility-only false. Omit in new content; translations always start hidden. */
  showMeanings?: false;
  showSlotLabels?: boolean;
  // Omission preserves the shipped coffee labels without rewriting saved chapter content.
  actionLabels?: { submit: string; help: string };
  /** Optional authored guidance shown only with ordering coaching/Help. */
  helpWording?: string;
  modelTileIds: string[];
  outcomes: PhraseOutcome[];
  coaching: Record<
    "structure" | "request",
    {
      // An authored question stays before its coach reply without adding a story turn.
      preface?: { characterId: string; text: string };
      line: string;
      explanation: string;
    }
  >;
}
export interface PhraseDraft {
  tiles: (string | null)[];
  coaching: "structure" | "request" | null;
  usedHelp: boolean;
}
export type PhraseEvaluation =
  | { kind: "incomplete" }
  | { kind: "structure" | "request" }
  | { kind: "accepted"; outcome: PhraseOutcome };
export type PhraseEdit =
  | { type: "place"; tileId: string; slotIndex?: number }
  | { type: "remove"; slotIndex: number }
  | { type: "clear" }
  | { type: "help" };
