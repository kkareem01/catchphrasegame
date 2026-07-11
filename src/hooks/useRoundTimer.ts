"use client";

import { useEffect } from "react";
import { beepPlayer } from "@/lib/audio/beepPlayer";
import {
  generateBeepSchedule,
  generateRoundDurationMs,
} from "@/lib/game/beepSchedule";
import { useGame } from "./useGame";

/**
 * Drives a round: picks the hidden duration, schedules the accelerating
 * beeps + buzzer on the audio clock, and dispatches BUZZER via a setTimeout
 * fallback so the game ends even when audio is unavailable or muted.
 */
export function useRoundTimer(): void {
  const { state, dispatch } = useGame();
  const isRoundActive = state.phase === "roundActive";

  useEffect(() => {
    if (!isRoundActive) return;

    const durationMs = generateRoundDurationMs(Math.random);
    const beepOffsets = generateBeepSchedule(durationMs);
    beepPlayer.scheduleRound(beepOffsets, durationMs);

    const buzzerTimeout = setTimeout(() => {
      dispatch({ type: "BUZZER" });
    }, durationMs);

    return () => {
      clearTimeout(buzzerTimeout);
      beepPlayer.cancelAll();
    };
  }, [isRoundActive, dispatch]);
}
