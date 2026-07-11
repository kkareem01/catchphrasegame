"use client";

import { useEffect } from "react";

const LEAVE_GAME_MESSAGE = "Leave the game? Scores will be lost.";

/**
 * While a game is in progress, pushes a dummy history entry so the back
 * button/swipe asks for confirmation instead of instantly leaving mid-round.
 */
export function useBackGuard(active: boolean, onLeave: () => void): void {
  useEffect(() => {
    if (!active) return;

    window.history.pushState({ catchPhraseGuard: true }, "");

    const onPopState = () => {
      if (window.confirm(LEAVE_GAME_MESSAGE)) {
        onLeave();
      } else {
        window.history.pushState({ catchPhraseGuard: true }, "");
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("popstate", onPopState);
      if (window.history.state?.catchPhraseGuard) {
        window.history.back();
      }
    };
  }, [active, onLeave]);
}
