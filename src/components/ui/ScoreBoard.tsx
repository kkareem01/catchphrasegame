"use client";

import { WINNING_SCORE } from "@/lib/game/constants";
import type { GameState } from "@/lib/game/types";

const TEAM_TEXT_CLASSES = ["text-team-a", "text-team-b"] as const;

export function ScoreBoard({
  state,
  showHolder = false,
}: Readonly<{ state: GameState; showHolder?: boolean }>) {
  return (
    <header className="flex items-center justify-between px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
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
            <span className="text-sm font-semibold opacity-80 max-w-28 truncate">
              {team.name}
              {isHolding ? " 🎤" : ""}
            </span>
          </div>
        );
      })}
      <span className="absolute left-1/2 -translate-x-1/2 text-xs opacity-50 font-medium">
        first to {WINNING_SCORE}
      </span>
    </header>
  );
}
