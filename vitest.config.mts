import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = { "@": path.resolve(__dirname, "src"), "server-only": path.resolve(__dirname, "tests/server-only.ts") };

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      { resolve: { alias }, test: { name: "unit", environment: "node", include: ["tests/unit/**/*.test.ts"] } },
      {
        resolve: { alias },
        test: {
          name: "emulator",
          environment: "node",
          include: ["tests/emulator/**/*.test.ts"],
          fileParallelism: false,
          testTimeout: 20000,
          hookTimeout: 20000,
          env: {
            FIREBASE_PROJECT_ID: "demo-ponto",
            PUNCH_MIN_INTERVAL_SECONDS: "0",
          },
        },
      },
    ],
  },
});
