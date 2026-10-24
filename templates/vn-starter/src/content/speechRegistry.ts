import { z } from "zod";
import source from "./speechRecordings.json";
import legacyAllowances from "./legacySpeechAllowances.json";
import { speechPolicies } from "./speechPolicies";
import { nonblank } from "./mandarinSchema";

export interface SpeechUsage {
  kind: "dialogue" | "assessment" | "vocabulary" | "phrase-tile";
  chapterId: string;
  eventId: string;
  tileId?: string;
  vocabularyId?: string;
}
export interface SpeechRecording {
  id: string;
  path: string;
  spokenText: string;
  speakerId: string | null;
  voiceId: string | null;
  provenance:
    | { kind: "generated"; recordPath: string }
    | { kind: "retained"; sha256: string; sources: string[] };
  allowedUsages: SpeechUsage[] | null;
}
/** Character casting stays separate from non-character pronunciation/announcement roles. */
export const speechVoiceCast: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(speechPolicies)
    .filter(([, policy]) => policy.role === "character")
    .map(([id, policy]) => [id, policy.voiceId]),
);
export const learningVoiceCast: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(speechPolicies)
    .filter(([, policy]) => policy.role === "vocabulary" || policy.role === "phrase")
    .map(([id, policy]) => [id, policy.voiceId]),
);
const usageSchema = z
  .object({
    kind: z.enum(["dialogue", "assessment", "vocabulary", "phrase-tile"]),
    chapterId: nonblank,
    eventId: nonblank,
    tileId: nonblank.optional(),
    vocabularyId: nonblank.optional(),
  })
  .strict();
const relativePath = nonblank.refine(
  (path) => !path.startsWith("/") && !path.split("/").includes(".."),
  "Expected a project-relative path",
);
export const speechRecordingSchema = z
  .object({
    id: nonblank,
    path: nonblank.refine(
      (path) =>
        path.startsWith("/assets/audio/") &&
        path.endsWith(".mp3") &&
        !path.split("/").includes(".."),
      "Expected a bundled recording path",
    ),
    spokenText: nonblank,
    speakerId: nonblank.nullable(),
    voiceId: nonblank.nullable(),
    provenance: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("generated"), recordPath: relativePath }).strict(),
      z
        .object({
          kind: z.literal("retained"),
          sha256: z.string().regex(/^[a-f0-9]{64}$/),
          sources: z.array(nonblank).min(1),
        })
        .strict(),
    ]),
    allowedUsages: z.array(usageSchema).min(1).nullable(),
  })
  .strict()
  .superRefine((recording, context) => {
    if (
      recording.voiceId &&
      (!recording.speakerId || speechPolicies[recording.speakerId]?.voiceId !== recording.voiceId)
    )
      context.addIssue({
        code: "custom",
        message: "Recording voice does not match assigned speaker",
      });
    if (!recording.voiceId || recording.allowedUsages) {
      // Frozen eight-row grandfathering: exact content, bytes and original usages only; never a generic uncast escape hatch.
      const approved = legacyAllowances.find((item) => item.id === recording.id);
      if (!approved || JSON.stringify(recording) !== JSON.stringify(approved))
        context.addIssue({
          code: "custom",
          message: "Recording has no exact approved legacy allowance",
        });
    }
  });
export const speechRecordings: SpeechRecording[] = z.array(speechRecordingSchema).parse(source);
const recordings = new Map(speechRecordings.map((recording) => [recording.id, recording]));
if (recordings.size !== speechRecordings.length) throw new Error("Duplicate speech recording ID");
export function getSpeechRecording(audioId: string): SpeechRecording {
  const recording = recordings.get(audioId);
  if (!recording) throw new Error(`Unknown speech recording: ${audioId}`);
  return recording;
}
export function validateSpeechBinding(
  audioId: string,
  spokenText: string,
  speakerId: string | null,
  usage: SpeechUsage,
): void {
  const recording = getSpeechRecording(audioId);
  const role = recording.speakerId ? speechPolicies[recording.speakerId]?.role : undefined;
  if (
    (role === "phrase" && usage.kind !== "phrase-tile") ||
    (role === "vocabulary" && usage.kind !== "vocabulary")
  )
    throw new Error(`Speech role is not valid for this surface: ${audioId}`);
  if (recording.spokenText !== spokenText || recording.speakerId !== speakerId)
    throw new Error(`Speech text/speaker mismatch: ${audioId}`);
  if (!recording.voiceId && !recording.allowedUsages)
    throw new Error(`Uncast speech requires a finite legacy allowance: ${audioId}`);
  if (
    recording.allowedUsages &&
    !recording.allowedUsages.some(
      (allowed) =>
        allowed.kind === usage.kind &&
        allowed.chapterId === usage.chapterId &&
        allowed.eventId === usage.eventId &&
        allowed.tileId === usage.tileId &&
        allowed.vocabularyId === usage.vocabularyId,
    )
  )
    throw new Error(`Speech legacy usage is not approved: ${audioId}`);
}
/** Dialogue labels are narrative; anonymous GUY must resolve independently of the visible sprite. */
export function dialogueSpeakerId(chapterId: string, label: string): string | undefined {
  if (label === "GUY")
    return chapterId === "chapter-one"
      ? "li-wei"
      : chapterId === "chapter-two"
        ? "camera-guy"
        : chapterId === "chapter-seven"
          ? "han-ziqian"
          : undefined;
  return (
    {
      EMMA: "emma",
      "LI WEI": "li-wei",
      KAI: "camera-guy",
      YICHEN: "zhou-yichen",
      SOFIA: "sofia",
      YUNING: "tang-yuning",
      "XU CHENG": "xu-cheng",
      "PROFESSOR ZHU": "zhu-ke",
      HAN: "han-ziqian",
      ANNOUNCEMENT: "announcement",
      EXAMINER: "examiner",
      "STATION WORKER": "station-worker",
    } as Record<string, string>
  )[label];
}
