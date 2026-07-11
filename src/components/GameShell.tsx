"use client";

import { useCallback } from "react";
import { GameOverScreen } from "@/components/screens/GameOverScreen";
import { HomeScreen } from "@/components/screens/HomeScreen";
import { RoundActiveScreen } from "@/components/screens/RoundActiveScreen";
import { RoundEndScreen } from "@/components/screens/RoundEndScreen";
import { useBackGuard } from "@/hooks/useBackGuard";
import { useGame } from "@/hooks/useGame";
import { useRoundTimer } from "@/hooks/useRoundTimer";
import { useWakeLock } from "@/hooks/useWakeLock";

export function GameShell() {
  const { state, dispatch } = useGame();

  useRoundTimer();
  useWakeLock(state.phase === "roundActive");

  const leaveGame = useCallback(
    () => dispatch({ type: "NEW_GAME" }),
    [dispatch],
  );
  useBackGuard(state.phase !== "setup", leaveGame);

  switch (state.phase) {
    case "setup":
      return <HomeScreen />;
    case "roundActive":
      return <RoundActiveScreen />;
    case "roundEnd":
      return <RoundEndScreen />;
    case "gameOver":
      return <GameOverScreen />;
  }
}
