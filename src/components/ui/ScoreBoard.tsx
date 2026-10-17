"use client";

import { useState } from "react";
import { useGame } from "@/hooks/useGame";
import { competitorColor, tint } from "./colors";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * In-game header: live scores (team points or player strikes), the target,
 * and an End Game control. `showHolder` highlights who has the phone.
 */
export function ScoreBoard({
  showHolder = false,
}: Readonly<{ showHolder?: boolean }>) {
  const { state, dispatch } = useGame();
  const [confirming, setConfirming] = useState(false);
  const { mode, targetScore } = state.settings;

  return (
    <>
      <header className="flex flex-col gap-2 px-4 pt-[max(env(safe-area-inset-top),0.875rem)] pb-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
            {mode === "teams" ? `First to ${targetScore} wins` : `${targetScore} strikes and you're out`}
          </span>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg border border-line px-2.5 py-1 text-xs font-bold text-muted active:bg-white/10"
          >
            End game
          </button>
        </div>
        {mode === "teams" ? (
          <TeamScores showHolder={showHolder} />
        ) : (
          <PlayerStrikes showHolder={showHolder} />
        )}
      </header>

      {confirming ? (
        <ConfirmDialog
          title="End game?"
          message="This clears the score and returns to the home screen."
          confirmLabel="End Game"
          onConfirm={() => dispatch({ type: "NEW_GAME" })}
          onCancel={() => setConfirming(false)}
        />
      ) : null}
    </>
  );
}

function TeamScores({ showHolder }: Readonly<{ showHolder: boolean }>) {
  const { state } = useGame();
  return (
    <div className="flex items-stretch gap-2">
      {state.competitors.map((team, index) => {
        const color = competitorColor("teams", index);
        const holding = showHolder && state.holder === index;
        return (
          <div
            key={index}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border px-3 py-1.5 transition-colors"
            style={{
              borderColor: holding ? color : "var(--line)",
              background: holding ? tint(color, 16) : "rgb(0 0 0 / 0.25)",
            }}
          >
            <span className="font-display text-3xl tabular-nums" style={{ color }}>
              {team.score}
            </span>
            <span className="min-w-0 truncate text-sm font-bold leading-tight">
              {team.name}
              {holding ? <span className="block text-[0.65rem] text-muted">🎤 has it</span> : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PlayerStrikes({ showHolder }: Readonly<{ showHolder: boolean }>) {
  const { state } = useGame();
  const limit = state.settings.targetScore;
  return (
    <ul className="flex flex-wrap justify-center gap-1.5">
      {state.competitors.map((player, index) => {
        const color = competitorColor("solo", index);
        const holding = showHolder && state.holder === index;
        return (
          <li
            key={index}
            className="flex flex-col items-center gap-1 rounded-xl border px-2.5 py-1.5"
            style={{
              borderColor: holding ? color : "var(--line)",
              background: holding ? tint(color, 18) : "rgb(0 0 0 / 0.25)",
            }}
            aria-label={`${player.name}: ${player.score} of ${limit} strikes`}
          >
            <span className="max-w-20 truncate text-sm font-bold" style={{ color }}>
              {player.name}
            </span>
            <span aria-hidden className="flex gap-1">
              {Array.from({ length: limit }, (_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full border-2 ${
                    i < player.score
                      ? "border-danger bg-danger shadow-[0_0_6px_var(--danger)]"
                      : "border-white/25"
                  }`}
                />
              ))}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
