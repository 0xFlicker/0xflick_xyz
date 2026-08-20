import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    environmentOptions: {
      jsdom: { url: "http://localhost:3000" },
    },
    include: ["tests/unit/**/*.test.ts", "tests/component/**/*.test.tsx"],
    passWithNoTests: true,
    restoreMocks: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
