"use client";

import { BigButton } from "@/components/ui/BigButton";
import { useGame } from "@/hooks/useGame";

const TEAM_TEXT_CLASSES = ["text-team-a", "text-team-b"] as const;

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const winner =
    state.teams[0].score > state.teams[1].score
      ? (0 as const)
      : (1 as const);

  return (
    <main className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-7xl">🏆</p>
        <h2
          className={`text-5xl font-black text-balance ${TEAM_TEXT_CLASSES[winner]}`}
        >
          {state.teams[winner].name} wins!
        </h2>
        <p className="text-2xl font-bold tabular-nums opacity-80">
          {state.teams[0].score} — {state.teams[1].score}
        </p>
      </div>

      <div className="px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <BigButton
          onClick={() => dispatch({ type: "NEW_GAME" })}
          className="w-full py-8 text-2xl"
        >
          New Game
        </BigButton>
      </div>
    </main>
  );
}
