import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

function readEnvLocal(): Record<string, string> {
  if (!existsSync(".env.local")) return {};
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split("\n")
      .map((line) => line.match(/^([A-Z0-9_]+)=(.*)$/))
      .filter((m): m is RegExpMatchArray => m !== null)
      .map((m) => [m[1], m[2]]),
  );
}

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "jsdom",
          include: ["src/**/*.test.{ts,tsx}"],
          setupFiles: ["./tests/setup-unit.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          alias: {
            "server-only": new URL("./tests/server-only-stub.ts", import.meta.url).pathname,
          },
          environment: "node",
          include: ["tests/integration/**/*.test.ts"],
          // Local Supabase URL + keys.
          env: readEnvLocal(),
          fileParallelism: false,
          testTimeout: 30_000,
        },
      },
    ],
  },
});
