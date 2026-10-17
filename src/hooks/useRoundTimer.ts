"use client";

import { useEffect } from "react";
import { gameAudio } from "@/lib/audio/gameAudio";
import {
  generateBeepSchedule,
  generateRoundDurationMs,
} from "@/lib/game/beepSchedule";
import { useGame } from "./useGame";

/**
 * Drives a round: picks the hidden duration, starts the accelerating beeps,
 * and at time-up plays the buzzer and dispatches BUZZER. The timeout is the
 * source of truth, so the round ends even when audio is unavailable.
 */
export function useRoundTimer(): void {
  const { state, dispatch } = useGame();
  const isRoundActive = state.phase === "roundActive";

  useEffect(() => {
    if (!isRoundActive) return;

    const durationMs = generateRoundDurationMs(Math.random);
    gameAudio.startRound(generateBeepSchedule(durationMs), durationMs);

    const buzzerTimeout = setTimeout(() => {
      gameAudio.playBuzzer();
      dispatch({ type: "BUZZER" });
    }, durationMs);

    return () => {
      clearTimeout(buzzerTimeout);
      gameAudio.stopRound();
    };
  }, [isRoundActive, dispatch]);
}
