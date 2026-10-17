import { describe, expect, it, vi } from "vitest";
import { DEFAULT_SETUP_PREFS } from "../game/setup";
import { createSetupPrefsStore, SETUP_PREFS_KEY } from "./setupPrefsStore";

const CATEGORY_IDS = ["everything", "sports"];

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    data,
  };
};

describe("createSetupPrefsStore", () => {
  it("returns defaults when nothing is saved", () => {
    const store = createSetupPrefsStore(() => memoryStorage(), CATEGORY_IDS);
    expect(store.getSnapshot()).toEqual(DEFAULT_SETUP_PREFS);
  });

  it("loads and validates saved prefs", () => {
    const storage = memoryStorage({
      [SETUP_PREFS_KEY]: JSON.stringify({ categoryId: "sports", targetScore: 999 }),
    });
    const store = createSetupPrefsStore(() => storage, CATEGORY_IDS);
    expect(store.getSnapshot().categoryId).toBe("sports");
    expect(store.getSnapshot().targetScore).toBe(DEFAULT_SETUP_PREFS.targetScore);
  });

  it("returns a stable snapshot reference between changes", () => {
    const store = createSetupPrefsStore(() => memoryStorage(), CATEGORY_IDS);
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("saves updates, notifies subscribers, and stops after unsubscribe", () => {
    const storage = memoryStorage();
    const store = createSetupPrefsStore(() => storage, CATEGORY_IDS);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.update((prefs) => ({ ...prefs, categoryId: "sports" }));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot().categoryId).toBe("sports");
    expect(JSON.parse(storage.data.get(SETUP_PREFS_KEY) ?? "{}").categoryId).toBe(
      "sports",
    );

    unsubscribe();
    store.update((prefs) => ({ ...prefs, stealRuleEnabled: true }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("survives corrupt JSON and storage that throws (private mode)", () => {
    const corrupt = createSetupPrefsStore(
      () => memoryStorage({ [SETUP_PREFS_KEY]: "{not json" }),
      CATEGORY_IDS,
    );
    expect(corrupt.getSnapshot()).toEqual(DEFAULT_SETUP_PREFS);

    const blocked = createSetupPrefsStore(() => {
      throw new Error("SecurityError");
    }, CATEGORY_IDS);
    expect(blocked.getSnapshot()).toEqual(DEFAULT_SETUP_PREFS);
    expect(() =>
      blocked.update((prefs) => ({ ...prefs, stealRuleEnabled: true })),
    ).not.toThrow();
    expect(blocked.getSnapshot().stealRuleEnabled).toBe(true);
  });

  it("serves defaults for server rendering", () => {
    const store = createSetupPrefsStore(() => memoryStorage(), CATEGORY_IDS);
    expect(store.getServerSnapshot()).toBe(DEFAULT_SETUP_PREFS);
  });
});
