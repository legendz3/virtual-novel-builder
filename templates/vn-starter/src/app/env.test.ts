import { expect, it } from "vitest";
import { parseEnvironment } from "./env";
it("environment permits guest-only production and always hides production diagnostics", () => {
  expect(parseEnvironment({ VITE_APP_ENV: "development" }, true).debug).toBe(false);
});
it("environment rejects partial or insecure production cloud configuration", () => {
  expect(() => parseEnvironment({ VITE_SUPABASE_URL: "https://example.com" }, true)).toThrow();
  expect(() =>
    parseEnvironment(
      { VITE_SUPABASE_URL: "http://example.com", VITE_SUPABASE_ANON_KEY: "public" },
      true,
    ),
  ).toThrow();
});
