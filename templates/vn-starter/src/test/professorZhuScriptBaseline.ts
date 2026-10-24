import { createHash } from "node:crypto";
import { expect } from "vitest";

const currentVoice = "moss_audio_9ffde29a-aff1-11f1-b643-520b5c496b99";
const historicalVoice = "Chinese (Mandarin)_Reliable_Executive";
const digest = (text: string) => createHash("sha256").update(text).digest("hex");

/** Reverse only the accepted current-voice metadata fragment, retaining the full original narrative hash. */
export function beforeProfessorZhuScriptVoice(script: string): string {
  expect(digest(script)).toBe("f45d3156bf8107fd87dbdcd0c63b4638b0f91819cad9dce7987c20b0a1861c95");
  expect(script.split(currentVoice)).toHaveLength(2);
  expect(script).not.toContain(historicalVoice);
  const fragment = `Professor Zhu retains canonical speaker \`zhu-ke\` and exact voice \`${currentVoice}\` with Chinese boost.`;
  expect(script.split("\n")[762]).toContain(fragment);
  const restored = script.replace(fragment, fragment.replace(currentVoice, historicalVoice));
  expect(digest(restored)).toBe("fe2423659b0255a4a9238bf50d03cd9257d35cc730595dc0fb329129673e3512");
  return restored;
}
