"use client";

import { useEffect, useState } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { competitorColor } from "@/components/ui/colors";
import { ScoreBoard } from "@/components/ui/ScoreBoard";
import { useGame } from "@/hooks/useGame";
import { useVibration } from "@/hooks/useVibration";
import { BUZZER_VIBRATION_PATTERN } from "@/lib/game/constants";
import { coopTotal, isStealPending, otherTeamIndex } from "@/lib/game/selectors";
import type { GameState } from "@/lib/game/types";

/**
 * Buttons stay locked briefly: players are usually mashing "Got it!" when the
 * buzzer fires, and those taps land right where these buttons appear.
 */
const BUTTON_ARM_DELAY_MS = 1_100;

export function RoundEndScreen() {
  const { state, dispatch } = useGame();
  const vibrate = useVibration();
  const [armed, setArmed] = useState(false);
  const { mode } = state.settings;
  const caught = state.competitors[state.holder];
  const stealPending = isStealPending(state);
  const isCoop = mode === "coop";

  useEffect(() => {
    vibrate(BUZZER_VIBRATION_PATTERN);
    const timer = setTimeout(() => setArmed(true), BUTTON_ARM_DELAY_MS);
    return () => clearTimeout(timer);
  }, [vibrate]);

  return (
    <main className="relative flex flex-1 flex-col">
      <div aria-hidden className="animate-buzzer-flash pointer-events-none fixed inset-0 z-10" />

      <div className="animate-shake flex flex-1 flex-col">
        <ScoreBoard />

        <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5 text-center">
          <div className="animate-slam">
            <p aria-hidden className="text-7xl leading-none">💥</p>
            <h2 className="mt-2 font-display text-5xl text-danger [text-shadow:0_4px_0_#5c0614,0_0_40px_rgb(255_77_94/0.5)]">
              {isCoop ? "Boom!" : "Time's up!"}
            </h2>
          </div>

          {isCoop ? null : (
            <p className="text-lg">
              Caught holding it:{" "}
              <span className="font-extrabold" style={{ color: competitorColor(mode, state.holder) }}>
                {caught.name}
              </span>
            </p>
          )}

          <div className="w-full rounded-2xl border border-line bg-surface/80 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">The phrase was</p>
            <p className="text-2xl font-extrabold text-accent text-balance">
              “{state.currentPhrase}”
            </p>
          </div>

          <Outcome state={state} />
        </div>

        <div className="flex flex-col gap-4 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          {stealPending ? (
            <>
              <BigButton
                onClick={() => dispatch({ type: "RESOLVE_STEAL", stolen: true })}
                variant="go"
                disabled={!armed}
                className="py-5 text-xl"
              >
                They got it! (+2)
              </BigButton>
              <BigButton
                onClick={() => dispatch({ type: "RESOLVE_STEAL", stolen: false })}
                variant="secondary"
                disabled={!armed}
                className="py-5 text-xl"
              >
                Nope (+1)
              </BigButton>
            </>
          ) : (
            <BigButton
              onClick={() => dispatch({ type: "START_NEXT_ROUND" })}
              disabled={!armed}
              className="flex flex-col items-center py-5"
            >
              <span className="font-display text-2xl">{isCoop ? "Next bomb" : "Next round"}</span>
              <span className="text-sm font-bold opacity-75">
                {isCoop ? "Shorter fuse — " : ""}
                {caught.name} starts
              </span>
            </BigButton>
          )}
        </div>
      </div>
    </main>
  );
}

function Outcome({ state }: Readonly<{ state: GameState }>) {
  const { mode, targetScore } = state.settings;

  if (isStealPending(state)) {
    const stealer = otherTeamIndex(state.holder);
    return (
      <p className="text-xl font-bold">
        Can{" "}
        <span style={{ color: competitorColor(mode, stealer) }}>
          {state.competitors[stealer].name}
        </span>{" "}
        guess it for a bonus point?
      </p>
    );
  }
  if (state.coop) {
    const cleared = state.coop.roundScores[state.coop.roundScores.length - 1] ?? 0;
    const bombsLeft = targetScore - state.coop.roundScores.length;
    return (
      <div>
        <p className="font-display text-2xl">
          {cleared} {cleared === 1 ? "phrase" : "phrases"} cleared
        </p>
        <p className="mt-1 text-muted">
          Team score <span className="font-bold text-accent">{coopTotal(state)}</span> ·{" "}
          {bombsLeft} {bombsLeft === 1 ? "bomb" : "bombs"} left
        </p>
      </div>
    );
  }
  if (state.lastScorer === null) return null;

  const scorer = state.competitors[state.lastScorer];
  const color = competitorColor(mode, state.lastScorer);
  return mode === "teams" ? (
    <p className="font-display text-2xl">
      Point to <span style={{ color }}>{scorer.name}</span>!
    </p>
  ) : (
    <p className="text-xl font-bold">
      <span style={{ color }}>{scorer.name}</span> takes a strike 💣{" "}
      <span className="text-muted">
        ({scorer.score} of {targetScore})
      </span>
    </p>
  );
}
