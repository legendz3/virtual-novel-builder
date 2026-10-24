import type {
  MandarinDialogue,
  MandarinSupport,
  LanguageNote,
} from "@game/learning/mandarin.types";
import type { MeaningChoiceExercise, VocabularyDefinition } from "@game/learning/learning.types";
import type { PhraseConstructionExercise } from "@game/learning/phraseConstruction.types";
import type { PhonePresentation } from "./phone.types";
export type StoryValue = string | number | boolean | null;
interface EventIdentity {
  mandarinSupport?: never;
  languageNotes?: never;
  id: string;
  presentation?: StoryPresentation;
  sceneId?: string;
  // Explicit targets merge branches; null ends the currently authored content.
  nextEventId?: string | null;
  // Applied once on beat entry; replay removes this chapter's recorded awards.
  effects?: StoryEffect[];
}
export interface CrossingMotion {
  shot: "catch" | "close" | "release";
  durationMs: number;
}
export type CharacterFraming =
  | "cafe-night-dining"
  | "cafe-night-table-standing"
  | "cafe-night-counter-standing"
  | "cafe-night-counter-working"
  | "cafe-night-door-standing"
  | "campus-night-path-standing"
  | "workroom-rain-standing"
  | "workroom-rain-floor-standing"
  | "print-shop-counter-standing"
  | "advising-office-standing"
  | "advising-office-departing"
  | "sound-room-leaning"
  | "sound-room-standing"
  | "library-path-waiting"
  | "waist-up"
  | "portrait"
  | "left-edge"
  | "close-up"
  | "behind-counter"
  | "counter-right"
  | "counter-side"
  | "dinner-across"
  | "dinner-adjacent"
  | "dinner-standing"
  | "dinner-seated-full"
  | "restaurant-counter"
  | "cafe-table-across"
  | "cafe-table-adjacent"
  | "cafe-table-room"
  | "hutong-table-across"
  | "courtyard-bench-seated"
  | "great-wall-bench-seated"
  | "library-table-seated"
  | "advising-desk-seated"
  | "dining-table-seated"
  | "dorm-bed-seated"
  | "volunteer-meeting-seated"
  | "volunteer-meeting-standing"
  | "small-table-seated";
export interface DocumentRow {
  hanzi: string;
  pinyin: string;
  meaning: string;
}
export type StoryForegroundDefinition =
  | { kind?: "image"; assetId: string; alt: string }
  | { kind: "document"; id: string; rows: DocumentRow[]; showMeanings?: boolean }
  | {
      kind: "collection";
      accessibleLabel?: string;
      items: { id: string; assetId?: string; alt?: string; physicalScale?: number }[];
      activeId?: string;
    };
// Every authored beat describes its complete visual state so restoring never replays past effects.
export interface StoryPresentation {
  // Optional panel positions preserve the action in a composed shot; omission uses defaults.
  dialoguePlacement?: "upper-right";
  decisionPlacement?: "right";
  view:
    | "dark"
    | "window"
    | "phone"
    | "title"
    | "hall"
    | "street"
    | "train"
    | "chapter-end"
    | "chapter-title"
    | "dorm"
    | "elevator"
    | "cafe"
    | "campus"
    | "exam"
    | "schedule"
    | "fade-out"
    | "phrase-builder";
  backgroundId?: string;
  foreground?: StoryForegroundDefinition;
  phone?: PhonePresentation;
  character?: { id: string; assetId: string; framing?: CharacterFraming };
  // Live-entry one-shot; restoring this presentation never replays the cue.
  sfx?: { id: string; volume: number };
  ambienceId?: string;
  // Unvoiced base gain; omission preserves 0.32 and voices retain proportional ducking.
  ambienceVolume?: number;
  musicId?: string;
  musicVolume?: number;
  crossingMotion?: CrossingMotion;
}
export interface PauseEvent extends EventIdentity {
  type: "pause";
  durationMs: number;
  text?: string;
  sfxId?: string;
}
export interface TitleEvent extends EventIdentity {
  type: "title";
  title: string;
  subtitle: string;
  assetId?: string;
  eyebrow?: string;
  pinyin?: string;
}
export interface NarrationEvent extends Omit<EventIdentity, "mandarinSupport" | "languageNotes"> {
  mandarinSupport?: MandarinSupport;
  languageNotes?: LanguageNote[];
  type: "narration";
  text: string;
  pinyin?: string;
  translation?: string;
}
export interface DialogueEvent extends Omit<EventIdentity, "mandarinSupport" | "languageNotes"> {
  mandarinSupport?: MandarinSupport;
  languageNotes?: LanguageNote[];
  type: "dialogue";
  characterId: string;
  text: string;
  mandarin?: MandarinDialogue;
  /** @deprecated For Chinese dialogue use mandarin.speech; retained fields must agree. */
  audioId?: string;
  // Audio-only questions retain their transcript in content, never in player-facing DOM.
  textDisplay?: "text" | "audio-only";
  pinyin?: string;
  translation?: string;
}
export type StoryEffect =
  | {
      type: "relationship";
      key:
        | "LiWei_Affection"
        | "LiWei_Trust"
        | "LiWei_Rivalry"
        | "Kai_Affection"
        | "Kai_Trust"
        | "Yichen_Affection"
        | "Han_Affection"
        | "Han_Trust"
        | "Yichen_Trust";
      delta: number;
    }
  | { type: "stat"; key: "Mandarin" | "MandarinXP" | "Independence" | "Confidence"; delta: number };
export interface StoryChoiceOption {
  id: string;
  text: string;
  quote?: string;
  pinyin?: string;
  translation?: string;
  targetEventId: string;
  effects?: StoryEffect[];
}
export interface ChoiceEvent extends Omit<EventIdentity, "mandarinSupport" | "languageNotes"> {
  mandarinSupport?: MandarinSupport;
  languageNotes?: LanguageNote[];
  type: "choice";
  prompt?: string;
  options: StoryChoiceOption[];
}
// Reads a prior choice without adding another choice or a duplicate story flag.
export interface ChoiceRouteEvent extends EventIdentity {
  type: "choice_route";
  choiceEventId: string;
  sourceChapterId?: string;
  cases: Record<string, string>;
  defaultEventId: string;
}
export interface ComprehensionEvent extends EventIdentity {
  type: "comprehension";
  exercise: MeaningChoiceExercise;
  correctEventId: string;
  incorrectEventId: string;
}
export interface ChapterEndEvent extends EventIdentity {
  type: "chapter_end";
  title: string;
  vocabularyTitle: string;
  vocabulary: VocabularyDefinition[];
  nextEventId: null;
}
export interface LearningEvent extends EventIdentity {
  type: "learning";
  exerciseId: string;
}
export interface SetVariableEvent extends EventIdentity {
  type: "set_variable";
  key: string;
  value: StoryValue;
}
export interface RelationshipEvent extends EventIdentity {
  type: "relationship";
  characterId: string;
  delta: number;
}
export interface ConditionalEvent extends EventIdentity {
  type: "conditional";
  variable: string;
  equals: StoryValue;
  targetEventId: string;
}
export interface SceneChangeEvent extends EventIdentity {
  type: "scene_change";
  sceneId: string;
  backgroundId?: string;
}
export interface AudioEvent extends EventIdentity {
  type: "audio";
  action: "play" | "stop";
  audioId?: string;
}
export interface PhoneMessageEvent extends EventIdentity {
  type: "phone_message";
  senderId: string;
  text: string;
}
export interface PhraseConstructionEvent extends EventIdentity {
  type: "phrase_construction";
  exercise: PhraseConstructionExercise;
}
export type StoryEvent =
  | PhraseConstructionEvent
  | PauseEvent
  | TitleEvent
  | NarrationEvent
  | DialogueEvent
  | ChoiceEvent
  | ChoiceRouteEvent
  | ComprehensionEvent
  | ChapterEndEvent
  | LearningEvent
  | SetVariableEvent
  | RelationshipEvent
  | ConditionalEvent
  | SceneChangeEvent
  | AudioEvent
  | PhoneMessageEvent;
