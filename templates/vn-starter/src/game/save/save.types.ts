import { reconcileRelationshipRewards } from "@game/relationship/relationshipRevisions";
import { z } from "zod";
export const SAVE_VERSION = 1;
const count = z.number().int().nonnegative();
const vocabularySchema = z.object({
  vocabularyId: z.string(),
  exposures: count,
  correct: count,
  incorrect: count,
  mastery: z.number().min(0).max(100),
  lastSeenAt: z.iso.datetime().optional(),
});
export const gameSaveSchema = z
  .object({
    version: z.literal(SAVE_VERSION),
    chapterId: z.string().optional(),
    sceneId: z.string().optional(),
    eventIndex: count,
    storyVariables: z.record(z.string(), z.json()),
    relationships: z.record(z.string(), z.number()),
    vocabularyProgress: z.record(z.string(), vocabularySchema),
    completedExercises: z.array(z.string()),
    choicesMade: z.record(z.string(), z.string()),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .refine(
    (save) => Date.parse(save.updatedAt) >= Date.parse(save.createdAt),
    "updatedAt must follow createdAt",
  );
export type GameSave = z.infer<typeof gameSaveSchema>;
export interface SaveProvider {
  load(): Promise<GameSave | null>;
  save(state: GameSave): Promise<void>;
  delete(): Promise<void>;
}
// Add explicit sequential version migrations here before validating the current schema.
// Unknown/future versions and corrupt payloads must never be silently replaced with empty saves.
export function migrateSave(save: unknown): GameSave {
  return reconcileRelationshipRewards(gameSaveSchema.parse(save));
}
export type SaveStatus = "idle" | "loading" | "saving" | "saved" | "error" | "disabled";
export interface SaveDiagnostics {
  local: SaveStatus;
  cloud: SaveStatus;
}
