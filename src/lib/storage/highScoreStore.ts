export const HIGH_SCORES_KEY = "catch-phrase:coop-best:v1";

type ScoresStorage = Pick<Storage, "getItem" | "setItem">;
type Records = Readonly<Record<string, number>>;

const EMPTY: Records = {};

/** Records are per category and bomb count, so comparisons stay fair. */
export const highScoreKey = (categoryId: string, rounds: number): string =>
  `${categoryId}:${rounds}`;

const isValidScore = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

/** Keeps only well-formed entries from untrusted saved data. */
const parseRecords = (raw: unknown): Records => {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return EMPTY;
  return Object.fromEntries(
    Object.entries(raw).filter((entry): entry is [string, number] =>
      isValidScore(entry[1]),
    ),
  );
};

export type HighScoreStore = Readonly<{
  getSnapshot: () => Records;
  getServerSnapshot: () => Records;
  subscribe: (listener: () => void) => () => void;
  getBest: (records: Records, key: string) => number;
  /** Raises the record if `score` beats it. Idempotent. */
  saveBest: (key: string, score: number) => void;
}>;

/**
 * Co-op high scores in localStorage, shaped for useSyncExternalStore.
 * Blocked storage just means records last until the page reloads.
 */
export const createHighScoreStore = (
  getStorage: () => ScoresStorage,
): HighScoreStore => {
  let snapshot: Records | null = null;
  const listeners = new Set<() => void>();

  const load = (): Records => {
    try {
      const raw = getStorage().getItem(HIGH_SCORES_KEY);
      return raw ? parseRecords(JSON.parse(raw)) : EMPTY;
    } catch (error) {
      console.warn("[high scores] could not read saved records", error);
      return EMPTY;
    }
  };

  const getSnapshot = (): Records => {
    snapshot ??= load();
    return snapshot;
  };

  const getBest = (records: Records, key: string): number => records[key] ?? 0;

  return {
    getSnapshot,
    getServerSnapshot: () => EMPTY,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getBest,
    saveBest: (key, score) => {
      const current = getSnapshot();
      if (score <= getBest(current, key)) return;
      snapshot = { ...current, [key]: score };
      try {
        getStorage().setItem(HIGH_SCORES_KEY, JSON.stringify(snapshot));
      } catch (error) {
        console.warn("[high scores] could not save record", error);
      }
      for (const listener of listeners) listener();
    },
  };
};
