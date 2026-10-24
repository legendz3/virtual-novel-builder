import { validateMandarinBuild } from "./scripts/validateMandarinAssets";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [
    react(),
    {
      name: "validate-mandarin-content",
      apply: "build",
      buildStart() {
        validateMandarinBuild(fileURLToPath(new URL("./", import.meta.url)));
      },
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "@app": fileURLToPath(new URL("./src/app", import.meta.url)),
      "@game": fileURLToPath(new URL("./src/game", import.meta.url)),
      "@components": fileURLToPath(new URL("./src/components", import.meta.url)),
      "@phaser": fileURLToPath(new URL("./src/phaser", import.meta.url)),
      "@services": fileURLToPath(new URL("./src/services", import.meta.url)),
      "@content": fileURLToPath(new URL("./src/content", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    restoreMocks: true,
  },
});
