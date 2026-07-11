"use client";

import { useCallback } from "react";

/**
 * Guarded wrapper around the Vibration API. No-op where unsupported
 * (notably iOS Safari) — the buzzer's visual flash covers that case.
 */
export function useVibration(): (pattern: readonly number[]) => void {
  return useCallback((pattern: readonly number[]) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([...pattern]);
    }
  }, []);
}
