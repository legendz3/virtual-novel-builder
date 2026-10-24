import { readdirSync, readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { speechRecordings, type SpeechRecording } from "../src/content/speechRegistry";
import { speechPolicies } from "../src/content/speechPolicies";
import { hasValidMiniMaxRecordingProof } from "./minimaxRecordingProof";
import { chapterSchema } from "../src/content/chapterSchema";
import { validateChapterMandarin } from "../src/content/chapterMandarinValidation";

interface GeneratedRecording {
  id: string;
}
export function validateSpeechRecordingFiles(
  root: string,
  recordings: readonly SpeechRecording[],
): void {
  const errors: string[] = [];
  const provenance = new Map<
    string,
    { clips: Map<string, GeneratedRecording>; providerId?: string; mcpPackage?: string }
  >();
  for (const recording of recordings) {
    if (
      recording.provenance.kind !== "generated" ||
      provenance.has(recording.provenance.recordPath)
    )
      continue;
    const file = resolve(root, recording.provenance.recordPath);
    const records = new Map<string, GeneratedRecording>();
    let providerId: string | undefined;
    let mcpPackage: string | undefined;
    if (existsSync(file)) {
      const data = JSON.parse(readFileSync(file, "utf8")) as {
        clips: GeneratedRecording[];
        providerId?: string;
        mcpPackage?: string;
      };
      providerId = data.providerId;
      mcpPackage = data.mcpPackage;
      for (const item of data.clips) {
        if (records.has(item.id))
          throw new Error(`Duplicate generated recording proof: ${item.id}`);
        records.set(item.id, item);
      }
    }
    provenance.set(recording.provenance.recordPath, { clips: records, providerId, mcpPackage });
  }
  for (const recording of recordings) {
    const path = resolve(root, `public${recording.path}`);
    if (!existsSync(path)) {
      errors.push(`Missing required recording: ${recording.id} (${recording.path})`);
      continue;
    }
    const sha256 = createHash("sha256").update(readFileSync(path)).digest("hex");
    if (recording.provenance.kind === "retained") {
      if (sha256 !== recording.provenance.sha256)
        errors.push(`Retained recording bytes changed: ${recording.id}`);
    } else {
      const report = provenance.get(recording.provenance.recordPath);
      const proof = report?.clips.get(recording.id);
      // Every active assigned speaker uses its trusted provider policy; historical files stay separately hash-bound.
      const policy = recording.speakerId ? speechPolicies[recording.speakerId] : undefined;
      if (
        policy?.providerId !== "minimax" ||
        report?.providerId !== "minimax" ||
        report.mcpPackage !== "minimax-mcp==0.0.19" ||
        !hasValidMiniMaxRecordingProof(root, recording, proof, sha256)
      )
        errors.push(`Missing or mismatched MiniMax recording provenance: ${recording.id}`);
    }
  }
  if (errors.length) throw new Error(`Mandarin recording validation failed:\n${errors.join("\n")}`);
}

export function validateMandarinAssets(root: string): void {
  validateSpeechRecordingFiles(root, speechRecordings);
}

/** Production builds validate source contracts and actual audio bytes before bundling. */
export function validateMandarinBuild(root: string): void {
  const dir = resolve(root, "src/content/chapters");
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".json"))) {
    const source = JSON.parse(readFileSync(resolve(dir, file), "utf8"));
    validateChapterMandarin(chapterSchema.parse(source));
  }
  validateMandarinAssets(root);
}
