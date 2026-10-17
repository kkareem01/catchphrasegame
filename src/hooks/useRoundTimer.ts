"use client";

import { useEffect } from "react";
import { gameAudio } from "@/lib/audio/gameAudio";
import {
  generateBeepSchedule,
  generateRoundDurationMs,
} from "@/lib/game/beepSchedule";
import { getRoundDurationScale } from "@/lib/game/selectors";
import { useGame } from "./useGame";

/**
 * Drives a round: picks the hidden duration, starts the accelerating beeps,
 * and at time-up plays the buzzer and dispatches BUZZER. The timeout is the
 * source of truth, so the round ends even when audio is unavailable.
 */
export function useRoundTimer(): void {
  const { state, dispatch } = useGame();
  const isRoundActive = state.phase === "roundActive";
  // Only changes between rounds, so it never restarts a round in progress.
  const durationScale = getRoundDurationScale(state);

  useEffect(() => {
    if (!isRoundActive) return;

    const durationMs = generateRoundDurationMs(Math.random, durationScale);
    gameAudio.startRound(generateBeepSchedule(durationMs), durationMs);

    const buzzerTimeout = setTimeout(() => {
      gameAudio.playBuzzer();
      dispatch({ type: "BUZZER" });
    }, durationMs);

    return () => {
      clearTimeout(buzzerTimeout);
      gameAudio.stopRound();
    };
  }, [isRoundActive, durationScale, dispatch]);
}
