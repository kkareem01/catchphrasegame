import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/**/*.test.ts",
        "src/lib/**/__fakes__/**",
        "src/lib/data/categories/**",
        // Thin browser glue (navigator/document/HTMLAudioElement); the
        // logic it feeds is covered via the injectable AudioEnvironment.
        "src/lib/audio/browserEnvironment.ts",
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
