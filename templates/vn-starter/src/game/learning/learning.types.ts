export type ExerciseType =
  | "listening_choice"
  | "meaning_choice"
  | "word_order"
  | "fill_blank"
  | "response_choice"
  | "direction";
export interface ExerciseDefinition {
  id: string;
  type: ExerciseType;
}
export interface MeaningChoiceExercise extends ExerciseDefinition {
  type: "meaning_choice";
  question: string;
  translation?: string;
  presentationLabel?: string;
  pinyin: string;
  prompt: string;
  /** Explicit neutral word support; authored aids must not reveal the assessed answer. */
  readingAids?: { hanzi: string; pinyin: string; meaning: string }[];
  options: { id: string; text: string }[];
  correctOptionId: string;
  audioId?: string;
  textDisplay?: "text" | "audio-only";
  // When present, a missed answer stays in the interaction until the player understands.
  retryHint?: string;
}
export interface ExerciseResult {
  exerciseId: string;
  correct: boolean;
  attempts: number;
  hintsUsed: number;
}
export interface VocabularyProgress {
  vocabularyId: string;
  exposures: number;
  correct: number;
  incorrect: number;
  mastery: number;
  lastSeenAt?: string;
}
export interface VocabularyDefinition {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  audioId: string;
  speakerId: string;
}
