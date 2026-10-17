import { describe, expect, it, vi } from "vitest";
import { createHighScoreStore, HIGH_SCORES_KEY, highScoreKey } from "./highScoreStore";

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
    data,
  };
};

describe("highScoreKey", () => {
  it("separates records by category and number of bombs", () => {
    expect(highScoreKey("sports", 3)).not.toBe(highScoreKey("sports", 5));
    expect(highScoreKey("sports", 3)).not.toBe(highScoreKey("kids", 3));
  });
});

describe("createHighScoreStore", () => {
  it("reports 0 when there is no record", () => {
    const store = createHighScoreStore(() => memoryStorage());
    expect(store.getBest(store.getSnapshot(), "x")).toBe(0);
  });

  it("only ever raises a record, and persists it", () => {
    const storage = memoryStorage();
    const store = createHighScoreStore(() => storage);
    store.saveBest("x", 10);
    store.saveBest("x", 4);
    expect(store.getBest(store.getSnapshot(), "x")).toBe(10);
    expect(JSON.parse(storage.data.get(HIGH_SCORES_KEY) ?? "{}")).toEqual({ x: 10 });
  });

  it("is idempotent, so saving the same score twice is harmless", () => {
    const store = createHighScoreStore(() => memoryStorage());
    const listener = vi.fn();
    store.subscribe(listener);
    store.saveBest("x", 7);
    store.saveBest("x", 7);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("drops corrupt or non-numeric saved values", () => {
    const store = createHighScoreStore(() =>
      memoryStorage({
        [HIGH_SCORES_KEY]: JSON.stringify({ good: 5, bad: "lots", neg: -3, frac: 2.5 }),
      }),
    );
    expect(store.getSnapshot()).toEqual({ good: 5 });
    const corrupt = createHighScoreStore(() => memoryStorage({ [HIGH_SCORES_KEY]: "{oops" }));
    expect(corrupt.getSnapshot()).toEqual({});
  });

  it("keeps working in memory when storage is blocked", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const store = createHighScoreStore(() => {
      throw new Error("SecurityError");
    });
    store.saveBest("x", 3);
    expect(store.getBest(store.getSnapshot(), "x")).toBe(3);
    warn.mockRestore();
  });

  it("serves an empty record set for server rendering", () => {
    const store = createHighScoreStore(() => memoryStorage());
    expect(store.getServerSnapshot()).toEqual({});
  });
});
