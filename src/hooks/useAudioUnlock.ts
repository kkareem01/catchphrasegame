"use client";

import { useEffect } from "react";
import { gameAudio } from "@/lib/audio/gameAudio";

/** Events that count as a user gesture for audio on iOS and Android. */
const GESTURE_EVENTS = ["touchend", "click", "keydown"] as const;

/**
 * Every tap anywhere (re)unlocks audio. Captured on the document so it runs
 * before any button handler — and so a context broken by a phone call or a
 * trip to the background heals on the very next tap.
 */
export function useAudioUnlock(): void {
  useEffect(() => {
    const unlock = () => gameAudio.unlock();
    for (const type of GESTURE_EVENTS) {
      document.addEventListener(type, unlock, { capture: true, passive: true });
    }
    return () => {
      for (const type of GESTURE_EVENTS) {
        document.removeEventListener(type, unlock, { capture: true });
      }
    };
  }, []);
}
