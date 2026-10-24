import js from "@eslint/js";
import tseslint from "typescript-eslint";
import hooks from "eslint-plugin-react-hooks";
import refresh from "eslint-plugin-react-refresh";
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      // Frozen preintegration Director harness and raw browser captures preserve reviewed bytes.
      "production/chapter-13/director-evidence/asset-review-04/**",
      "production/chapter-13/director-evidence/packed-table-review-01/**",
      "production/chapter-13/implementation-evidence/node-runtime.cjs",
      "production/chapter-13/implementation-evidence/browser-*/**",
      "dist-chapter10/**",
      "dist-vocabulary-shan-shan-v3/**",
      "dist-minimax/**",
      "dist-character-minimax/**",
      "dist-review-placement/**",
      "dist-review-placement-merge/**",
      "dist-spoken-audio-one-seven/**",
      ".vercel/**",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**",
      "coverage/**",
      // Immutable merge-conflict snapshots are evidence, not executable source.
      "production/chapter-07/revisions/main-integration-01/implementation/before/**",
      // Frozen Director evidence includes Node audit scripts; preserve their approved bytes.
      "production/chapter-12/revisions/playtest-03/art/review-captures.cjs",
      "production/chapter-12/revisions/playtest-03/qa-evidence/runtime-node24-playtest03-integrated*/node-process-proof.cjs",
      "production/chapter-06/art/evidence/*.cjs",
      "production/chapter-06/revisions/asset-review-01/visual-evidence/*.cjs",
      "production/chapter-12/revisions/playtest-01/art/director-review-evidence/render-static-review.cjs",
      "production/chapter-12/revisions/playtest-01/art/director-review-evidence/render-mandarin-focal-review.cjs",
      // Native test traces retain bundled source snapshots, not new application modules.
      "production/chapter-12/revisions/playtest-01/implementation-evidence/browser-*/**",
      "production/chapter-12/revisions/playtest-01/qa-evidence/runtime-node24-playtest01/**",
    ],
  },
  js.configs.recommended,
  {
    files: [
      "production/chapter-07/audio-review/*.mjs",
      "production/chapter-07/revisions/professor-zhu-voice-01/audio-review/*.mjs",
    ],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        URL: "readonly",
        fetch: "readonly",
      },
    },
  },
  {
    files: [
      "production/chapter-07/audio-review/review.js",
      "production/chapter-07/revisions/professor-zhu-voice-01/audio-review/review.js",
    ],
    languageOptions: { globals: { document: "readonly", fetch: "readonly" } },
  },
  ...tseslint.configs.recommended,
  {
    files: [
      "production/chapter-08/art-evidence/**/*.cjs",
      "production/chapter-08/art-review/*.cjs",
      "production/chapter-07/art/evidence/*.cjs",
      "production/chapter-07/art/ford-evidence/**/*.cjs",
      "production/chapter-07/art/revisions/playtest-01/miss-ford/evidence/*.cjs",
    ],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
        module: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
      },
    },
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    files: ["production/chapter-08/art-review/render-gallery.cjs"],
    // This Node module intentionally defines its own HTML escape helper.
    languageOptions: { globals: { escape: "off" } },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks, "react-refresh": refresh },
    rules: {
      ...hooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);
