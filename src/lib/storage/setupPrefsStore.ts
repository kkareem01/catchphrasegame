import {
  DEFAULT_SETUP_PREFS,
  parseSetupPrefs,
  type SetupPrefs,
} from "../game/setup";

export const SETUP_PREFS_KEY = "catch-phrase:setup:v1";

type PrefsStorage = Pick<Storage, "getItem" | "setItem">;

export type SetupPrefsStore = Readonly<{
  getSnapshot: () => SetupPrefs;
  getServerSnapshot: () => SetupPrefs;
  subscribe: (listener: () => void) => () => void;
  update: (change: (prefs: SetupPrefs) => SetupPrefs) => void;
}>;

/**
 * Remembers the home-screen choices between visits, shaped for
 * useSyncExternalStore. Storage may be missing or throw (private mode,
 * blocked site data); the game then simply forgets on reload.
 */
export const createSetupPrefsStore = (
  getStorage: () => PrefsStorage,
  categoryIds: readonly string[],
): SetupPrefsStore => {
  let snapshot: SetupPrefs | null = null;
  const listeners = new Set<() => void>();

  const load = (): SetupPrefs => {
    try {
      const raw = getStorage().getItem(SETUP_PREFS_KEY);
      return raw ? parseSetupPrefs(JSON.parse(raw), categoryIds) : DEFAULT_SETUP_PREFS;
    } catch (error) {
      console.warn("[prefs] could not read saved setup; using defaults", error);
      return DEFAULT_SETUP_PREFS;
    }
  };

  const save = (prefs: SetupPrefs): void => {
    try {
      getStorage().setItem(SETUP_PREFS_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.warn("[prefs] could not save setup", error);
    }
  };

  const getSnapshot = (): SetupPrefs => {
    snapshot ??= load();
    return snapshot;
  };

  return {
    getSnapshot,
    getServerSnapshot: () => DEFAULT_SETUP_PREFS,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update: (change) => {
      snapshot = change(getSnapshot());
      save(snapshot);
      for (const listener of listeners) listener();
    },
  };
};
