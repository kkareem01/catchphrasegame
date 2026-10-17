"use client";

import { useCallback, useSyncExternalStore } from "react";
import { getCategoryChoices } from "@/lib/data";
import type { SetupPrefs } from "@/lib/game/setup";
import { createSetupPrefsStore } from "@/lib/storage/setupPrefsStore";

const store = createSetupPrefsStore(
  () => window.localStorage,
  getCategoryChoices().map((choice) => choice.id),
);

/** Home-screen choices, remembered between visits (falls back to defaults). */
export function useSetupPrefs(): readonly [
  SetupPrefs,
  (patch: Partial<SetupPrefs>) => void,
] {
  const prefs = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  const update = useCallback(
    (patch: Partial<SetupPrefs>) => store.update((p) => ({ ...p, ...patch })),
    [],
  );
  return [prefs, update] as const;
}
