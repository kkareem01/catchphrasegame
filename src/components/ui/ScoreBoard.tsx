"use client";

import { useState } from "react";
import { useGame } from "@/hooks/useGame";
import { teamColor, tint } from "./colors";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * In-game header: both team scores, the target, and an End Game control.
 * `showHolder` highlights the team holding the phone.
 */
export function ScoreBoard({
  showHolder = false,
}: Readonly<{ showHolder?: boolean }>) {
  const { state, dispatch } = useGame();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <header className="flex flex-col gap-2 px-4 pt-[max(env(safe-area-inset-top),0.875rem)] pb-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[0.7rem] font-bold uppercase tracking-wider text-muted">
            First to {state.settings.targetScore} wins
          </span>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="rounded-lg border border-line px-2.5 py-1 text-xs font-bold text-muted active:bg-white/10"
          >
            End game
          </button>
        </div>
        <div className="flex items-stretch gap-2">
          {state.competitors.map((team, index) => {
            const color = teamColor(index);
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
                  {holding ? (
                    <span className="block truncate text-[0.65rem] text-muted">
                      🎤 has it
                    </span>
                  ) : null}
                </span>
              </div>
            );
          })}
        </div>
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
