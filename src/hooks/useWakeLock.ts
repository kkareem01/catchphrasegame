"use client";

import { useEffect } from "react";

/**
 * Keeps the screen awake while `active` (during gameplay). Re-acquires the
 * lock when the tab becomes visible again (the browser silently releases it
 * on hide). Degrades to a no-op where the API is unsupported.
 */
export function useWakeLock(active: boolean): void {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;

    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
        if (cancelled) await lock.release();
      } catch {
        // Denied (low battery, unsupported) — screen may sleep; not fatal.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void acquire();
    };

    void acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void lock?.release().catch(() => {});
    };
  }, [active]);
}
