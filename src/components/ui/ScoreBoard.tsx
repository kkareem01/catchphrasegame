"use client";

import { useState } from "react";
import { useGame } from "@/hooks/useGame";
import { ConfirmDialog } from "./ConfirmDialog";

const TEAM_TEXT_CLASSES = ["text-team-a", "text-team-b"] as const;

/** In-game header: live scores, the target, and an End Game control. */
export function ScoreBoard({
  showHolder = false,
}: Readonly<{ showHolder?: boolean }>) {
  const { state, dispatch } = useGame();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      <header className="relative flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
        {state.teams.map((team, index) => {
          const isHolding = showHolder && state.holdingTeam === index;
          return (
            <div
              key={team.name + index}
              className={`flex items-center gap-2 ${index === 1 ? "flex-row-reverse" : ""}`}
            >
              <span
                className={`text-3xl font-black tabular-nums ${TEAM_TEXT_CLASSES[index]}`}
              >
                {team.score}
              </span>
              <span className="max-w-20 truncate text-sm font-semibold opacity-80">
                {team.name}
                {isHolding ? " 🎤" : ""}
              </span>
            </div>
          );
        })}

        <div className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center">
          <span className="text-[0.6rem] font-medium uppercase tracking-wide opacity-50">
            first to {state.settings.targetScore}
          </span>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            aria-label="End game"
            className="flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-semibold opacity-70 active:bg-white/10"
          >
            <span aria-hidden>⏹</span>
            End
          </button>
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
