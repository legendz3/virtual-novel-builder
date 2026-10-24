import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve, dirname, isAbsolute } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import type { SpeechRecording } from "../src/content/speechRegistry";
import { speechPolicies } from "../src/content/speechPolicies";

export const miniMaxGenerationModel = "speech-2.8-turbo";
const miniMaxModelSchema = z.enum(["speech-2.8-hd", "speech-2.8-turbo"]);
export type MiniMaxSpeechModel = z.infer<typeof miniMaxModelSchema>;
/** Trusted request settings are selected by speaker, never by self-declared proof or a fixed clip list. */
export function miniMaxSpeechSettings(
  speakerId: string | null,
  model: MiniMaxSpeechModel = miniMaxGenerationModel,
) {
  const policy = speakerId ? speechPolicies[speakerId] : undefined;
  if (!policy || policy.providerId !== "minimax") return undefined;
  return {
    voice_id: policy.voiceId,
    model,
    language_boost: policy.languageBoost,
    speed: 1,
    vol: 1,
    pitch: 0,
    emotion: "calm",
    sample_rate: 32000,
    bitrate: 128000,
    channel: 1,
    format: "mp3",
  } as const;
}
/** Historical HD fixture settings; future requests use miniMaxGenerationModel. */
export const miniMaxVocabularySettings = miniMaxSpeechSettings(
  "vocabulary-narrator",
  "speech-2.8-hd",
)!;

const sha = z.string().regex(/^[a-f0-9]{64}$/);
const projectPath = z
  .string()
  .min(1)
  .refine((path) => !isAbsolute(path) && !path.split("/").includes(".."));
const requestSchema = z
  .object({
    tool: z.literal("text_to_audio"),
    arguments: z
      .object({ text: z.string().min(1), output_directory: z.string().min(1) })
      .catchall(z.unknown()),
  })
  .strict();
const historicalResultSchema = z
  .object({
    is_error: z.literal(false),
    result_type: z.literal("complete"),
    content: z
      .array(z.object({ type: z.string(), text: z.string().optional() }).passthrough())
      .min(1),
  })
  .passthrough();
// Current native MCP calls expose camelCase isError without the historical orchestration wrapper.
// Keep the actual capture intact; both envelopes still require the exact success/file/voice body below.
const currentResultSchema = z
  .object({
    isError: z.literal(false),
    content: z
      .array(z.object({ type: z.string(), text: z.string().optional() }).passthrough())
      .min(1),
    is_error: z.never().optional(),
    result_type: z.never().optional(),
  })
  .passthrough();
const resultSchema = z.union([
  historicalResultSchema.extend({ isError: z.never().optional() }),
  currentResultSchema,
]);
const proofSchema = z
  .object({
    providerId: z.literal("minimax"),
    id: z.string(),
    spokenText: z.string(),
    speakerId: z.string().min(1),
    voice_id: z.string(),
    requestedModel: miniMaxModelSchema,
    requestedSettings: requestSchema.shape.arguments,
    runtimePath: projectPath,
    stagingPath: projectPath,
    sha256: sha,
    bytes: z.number().int().positive(),
    source: z
      .object({
        kind: z.enum(["generated", "trial-reuse"]),
        requestPath: projectPath,
        requestSha256: sha,
        resultPath: projectPath,
        resultSha256: sha,
        originalFilePath: projectPath,
      })
      .passthrough(),
    mcp: z
      .object({
        tool: z.literal("text_to_audio"),
        request: requestSchema,
        result: resultSchema,
        returnedVoiceId: z.string(),
        returnedFilePath: z.string(),
        // The official MCP has no model echo. A submitted model must never become invented returned proof.
        returnedModel: z.null(),
      })
      .passthrough(),
    technical: z
      .object({
        decode: z.literal("passed"),
        probe: z
          .object({
            streams: z
              .array(
                z
                  .object({ codec_name: z.string(), sample_rate: z.string(), channels: z.number() })
                  .passthrough(),
              )
              .min(1),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

/** Validate captured MCP arguments/results and all copies, without claiming provider model echo or human hearing. */
export function hasValidMiniMaxRecordingProof(
  root: string,
  recording: SpeechRecording,
  candidate: unknown,
  runtimeSha256: string,
): boolean {
  try {
    const proof = proofSchema.parse(candidate);
    const settings = miniMaxSpeechSettings(recording.speakerId, proof.requestedModel);
    if (
      !settings ||
      proof.speakerId !== recording.speakerId ||
      recording.voiceId !== settings.voice_id ||
      proof.id !== recording.id ||
      proof.spokenText !== recording.spokenText ||
      proof.voice_id !== recording.voiceId ||
      proof.runtimePath !== `public${recording.path}` ||
      proof.sha256 !== runtimeSha256
    )
      return false;
    const requestBytes = readFileSync(resolve(root, proof.source.requestPath));
    const resultBytes = readFileSync(resolve(root, proof.source.resultPath));
    if (
      digest(requestBytes) !== proof.source.requestSha256 ||
      digest(resultBytes) !== proof.source.resultSha256
    )
      return false;
    const request = requestSchema.parse(JSON.parse(requestBytes.toString("utf8")));
    const result = resultSchema.parse(JSON.parse(resultBytes.toString("utf8")));
    if (
      !isDeepStrictEqual(request, proof.mcp.request) ||
      !isDeepStrictEqual(result, proof.mcp.result) ||
      !isDeepStrictEqual(request.arguments, proof.requestedSettings)
    )
      return false;
    const expectedArguments = {
      ...settings,
      text: recording.spokenText,
      output_directory: request.arguments.output_directory,
    };
    if (!isDeepStrictEqual(request.arguments, expectedArguments)) return false;
    const text = result.content
      .filter((item) => item.type === "text")
      .map((item) => item.text ?? "")
      .join("\n");
    const match = /^Success\. File saved as: (.+)\. Voice used: ([^\r\n]+)$/.exec(text);
    if (
      !match ||
      match[2] !== recording.voiceId ||
      proof.mcp.returnedVoiceId !== match[2] ||
      proof.mcp.returnedFilePath !== match[1] ||
      !isAbsolute(match[1]!)
    )
      return false;
    // Absolute MCP paths are historical workstation output; project-relative source remains portable across worktrees.
    const sourceSuffix = `/${proof.source.originalFilePath}`;
    if (
      !match[1]!.endsWith(sourceSuffix) ||
      dirname(match[1]!) !== request.arguments.output_directory
    )
      return false;
    for (const path of [proof.source.originalFilePath, proof.stagingPath, proof.runtimePath]) {
      const bytes = readFileSync(resolve(root, path));
      if (digest(bytes) !== runtimeSha256 || bytes.length !== proof.bytes) return false;
    }
    const audioStreams = proof.technical.probe.streams.filter(
      (stream) => stream.codec_name === "mp3",
    );
    return (
      audioStreams.length === 1 &&
      audioStreams[0]!.sample_rate === "32000" &&
      audioStreams[0]!.channels === 1
    );
  } catch {
    return false;
  }
}
