// @vitest-environment node
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { validateSpeechRecordingFiles } from "../../scripts/validateMandarinAssets";
import { miniMaxSpeechSettings } from "../../scripts/minimaxRecordingProof";
import type { SpeechRecording } from "./speechRegistry";

const roots: string[] = [];
const hash = (bytes: string) => createHash("sha256").update(bytes).digest("hex");
function write(root: string, path: string, value: unknown) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  const bytes = typeof value === "string" ? value : JSON.stringify(value);
  writeFileSync(join(root, path), bytes);
  return hash(bytes);
}
function fixture(
  kind: "generated" | "trial-reuse" = "generated",
  speakerId = "vocabulary-narrator",
) {
  const settings = miniMaxSpeechSettings(speakerId, "speech-2.8-hd")!;
  const root = mkdtempSync(join(tmpdir(), "minimax-proof-"));
  roots.push(root);
  const id = "future-vocabulary-word";
  const recording: SpeechRecording = {
    id,
    spokenText: "谢谢",
    speakerId,
    voiceId: settings.voice_id,
    path: `/assets/audio/vocabulary/future/${id}.mp3`,
    provenance: { kind: "generated", recordPath: "future/provenance.json" },
    allowedUsages: null,
  };
  // Synthetic bytes are confined to file/proof validation; never playable production replacements.
  const bytes = "unit-only MiniMax file";
  const originalFilePath = "future/original.mp3";
  const returnedFilePath = `/historical/worktree/${originalFilePath}`;
  const request = {
    tool: "text_to_audio",
    arguments: {
      ...settings,
      text: recording.spokenText,
      output_directory: dirname(returnedFilePath),
    },
  };
  const result = {
    is_error: false,
    result_type: "complete",
    content: [
      {
        type: "text",
        text: `Success. File saved as: ${returnedFilePath}. Voice used: ${settings.voice_id}`,
      },
    ],
  };
  const proof = {
    providerId: "minimax",
    id,
    spokenText: recording.spokenText,
    speakerId: recording.speakerId,
    voice_id: recording.voiceId,
    requestedModel: "speech-2.8-hd",
    requestedSettings: request.arguments,
    stagingPath: "future/staged.mp3",
    runtimePath: `public${recording.path}`,
    sha256: hash(bytes),
    bytes: bytes.length,
    source: {
      kind,
      originalFilePath,
      requestPath: "future/request.json",
      requestSha256: write(root, "future/request.json", request),
      resultPath: "future/result.json",
      resultSha256: write(root, "future/result.json", result),
    },
    mcp: {
      tool: "text_to_audio",
      request,
      result,
      returnedVoiceId: recording.voiceId,
      returnedFilePath,
      returnedModel: null,
    },
    technical: {
      decode: "passed",
      probe: { streams: [{ codec_name: "mp3", sample_rate: "32000", channels: 1 }] },
    },
  };
  for (const path of [originalFilePath, proof.stagingPath, proof.runtimePath])
    write(root, path, bytes);
  function save() {
    write(root, "future/provenance.json", {
      providerId: "minimax",
      mcpPackage: "minimax-mcp==0.0.19",
      clips: [proof],
    });
  }
  save();
  return { root, recording, proof, save };
}
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("MiniMax captured recording proof", () => {
  it.each([
    "valid",
    "error",
    "mixed-error",
    "missing-status",
    "failure-body",
    "voice",
    "file",
    "echo",
  ])("validates current native MCP envelope without manufacturing old wrappers: %s", (fault) => {
    const f = fixture("generated", "zhu-ke");
    const result: Record<string, unknown> = {
      isError: false,
      content: structuredClone(f.proof.mcp.result.content),
    };
    if (fault === "error") result.isError = true;
    if (fault === "mixed-error") result.is_error = true;
    if (fault === "missing-status") delete result.isError;
    const content = result.content as { type: string; text: string }[];
    if (fault === "failure-body")
      content[0]!.text = "Failed to generate audio: Directory is not writeable";
    if (fault === "voice")
      content[0]!.text = content[0]!.text.replace(f.recording.voiceId!, "Chinese");
    if (fault === "file") content[0]!.text = content[0]!.text.replace("original.mp3", "other.mp3");
    if (fault === "echo") Reflect.set(f.proof.mcp, "returnedModel", "speech-2.8-turbo");
    Reflect.set(f.proof.mcp, "result", result);
    f.proof.source.resultSha256 = write(f.root, f.proof.source.resultPath, result);
    f.save();
    if (fault === "valid")
      expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).not.toThrow();
    else expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).toThrow();
  });
  it.each([
    "vocabulary-narrator",
    "announcement",
    "emma",
    "sofia",
    "li-wei",
    "zhou-yichen",
    "camera-guy",
    "han-ziqian",
    "zhu-ke",
  ])(
    "accepts exact trusted policy for future %s clips, including complete spaced voice IDs",
    (speakerId) => {
      const f = fixture("generated", speakerId);
      expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).not.toThrow();
    },
  );
  it("accepts exact future Turbo proof without relabeling existing HD proof", () => {
    const f = fixture();
    f.proof.requestedModel = "speech-2.8-turbo";
    f.proof.mcp.request.arguments.model = "speech-2.8-turbo";
    f.proof.source.requestSha256 = write(f.root, f.proof.source.requestPath, f.proof.mcp.request);
    f.save();
    expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).not.toThrow();
    f.proof.requestedModel = "speech-2.8-hd";
    f.save();
    expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).toThrow();
  });
  it("rejects the superseded phrase narrator policy for new proof", () => {
    const f = fixture();
    f.recording.speakerId = "phrase-narrator";
    expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).toThrow();
  });
  it.each(["examiner", "station-worker", "zhu-ke"])(
    "validates current assigned cast for future %s recordings without a clip allowlist",
    (speakerId) => {
      const f = fixture("generated", speakerId);
      expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).not.toThrow();
      f.proof.mcp.request.arguments.language_boost = "English";
      f.proof.source.requestSha256 = write(f.root, f.proof.source.requestPath, f.proof.mcp.request);
      f.save();
      expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).toThrow();
    },
  );
  it.each(["emma", "sofia", "li-wei"])(
    "rejects a wrong language override for %s even when all captures agree",
    (speakerId) => {
      const f = fixture("generated", speakerId);
      Object.assign(f.proof.mcp.request.arguments, {
        language_boost: speakerId === "li-wei" ? "English" : "Chinese",
      });
      f.proof.source.requestSha256 = write(f.root, f.proof.source.requestPath, f.proof.mcp.request);
      f.save();
      expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).toThrow();
    },
  );
  it("rejects a truncated spaced voice ID in both raw and derived response evidence", () => {
    const f = fixture("generated", "li-wei");
    f.proof.mcp.result.content[0]!.text = f.proof.mcp.result.content[0]!.text.replace(
      f.recording.voiceId!,
      "Chinese",
    );
    f.proof.mcp.returnedVoiceId = "Chinese";
    f.proof.source.resultSha256 = write(f.root, f.proof.source.resultPath, f.proof.mcp.result);
    f.save();
    expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).toThrow();
  });

  it.each(["generated", "trial-reuse"] as const)(
    "validates %s for a future ID and historical output path with no returned model",
    (kind) => {
      const { root, recording } = fixture(kind);
      expect(() => validateSpeechRecordingFiles(root, [recording])).not.toThrow();
    },
  );
  it.each([
    ["model", "wrong-model"],
    ["voice_id", "wrong-voice"],
    ["text", "你好"],
    ["language_boost", "English"],
    ["speed", 0.8],
    ["vol", 0.8],
    ["pitch", 1],
    ["emotion", "happy"],
    ["sample_rate", 44100],
    ["bitrate", 64000],
    ["channel", 2],
    ["format", "wav"],
  ])("rejects wrong submitted %s even when derived proof and capture agree", (field, value) => {
    const f = fixture();
    Object.assign(f.proof.mcp.request.arguments, { [field]: value });
    f.proof.source.requestSha256 = write(f.root, f.proof.source.requestPath, f.proof.mcp.request);
    f.save();
    expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).toThrow("mismatched MiniMax");
  });
  it("rejects a mismatch between requested settings and the captured submission", () => {
    const f = fixture();
    f.proof.requestedSettings = { ...f.proof.requestedSettings };
    Object.assign(f.proof.requestedSettings, { speed: 0.5 });
    f.save();
    expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).toThrow("mismatched MiniMax");
  });
  it.each([
    "error",
    "incomplete",
    "voice",
    "file",
    "text",
    "returned-model",
    "capture-hash",
    "embedded-result",
  ])("rejects invalid %s response proof", (fault) => {
    const f = fixture();
    if (fault === "error") f.proof.mcp.result.is_error = true;
    if (fault === "incomplete") f.proof.mcp.result.result_type = "running";
    if (fault === "voice")
      f.proof.mcp.result.content[0]!.text = f.proof.mcp.result.content[0]!.text.replace(
        "Chinese_wenrounvxing",
        "wrong-voice",
      );
    if (fault === "file")
      f.proof.mcp.result.content[0]!.text = f.proof.mcp.result.content[0]!.text.replace(
        "original.mp3",
        "other.mp3",
      );
    if (fault === "text") f.proof.mcp.result.content[0]!.text = "Failed. No file saved.";
    if (fault === "returned-model") Object.assign(f.proof.mcp, { returnedModel: "speech-2.8-hd" });
    if (fault !== "embedded-result")
      f.proof.source.resultSha256 = write(f.root, f.proof.source.resultPath, f.proof.mcp.result);
    if (fault === "embedded-result") f.proof.mcp.result.content[0]!.text = "invented success";
    if (fault === "capture-hash") write(f.root, f.proof.source.resultPath, "changed capture");
    f.save();
    expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).toThrow("mismatched MiniMax");
  });
  it.each([
    "runtime",
    "staging",
    "source",
    "missing",
    "decode",
    "sample-rate",
    "channels",
    "provider",
    "root-provider",
    "character",
  ])("rejects invalid %s binding without provider fallback", (fault) => {
    const f = fixture();
    if (fault === "runtime") write(f.root, f.proof.runtimePath, "changed");
    if (fault === "staging") write(f.root, f.proof.stagingPath, "changed");
    if (fault === "source") write(f.root, f.proof.source.originalFilePath, "changed");
    if (fault === "missing") rmSync(join(f.root, f.proof.runtimePath));
    if (fault === "decode") f.proof.technical.decode = "failed";
    if (fault === "sample-rate") f.proof.technical.probe.streams[0]!.sample_rate = "44100";
    if (fault === "channels") f.proof.technical.probe.streams[0]!.channels = 2;
    if (fault === "provider") f.proof.providerId = "elevenlabs";
    if (fault === "character")
      Object.assign(f.recording, { speakerId: "emma", voiceId: "Z3R5wn05IrDiVCyEkUrK" });
    f.save();
    if (fault === "root-provider") {
      const report = JSON.parse(readFileSync(join(f.root, "future/provenance.json"), "utf8"));
      report.providerId = "elevenlabs";
      write(f.root, "future/provenance.json", report);
    }
    expect(() => validateSpeechRecordingFiles(f.root, [f.recording])).toThrow();
  });
});
