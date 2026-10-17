"use client";

import { BigButton } from "@/components/ui/BigButton";
import { teamColor } from "@/components/ui/colors";
import { useGame } from "@/hooks/useGame";
import { getWinners } from "@/lib/game/selectors";

export function GameOverScreen() {
  const { state, dispatch } = useGame();
  const [winner] = getWinners(state);
  const loser = winner === 0 ? 1 : 0;
  const [first, second] = [state.competitors[winner], state.competitors[loser]];

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <p aria-hidden className="animate-slam text-8xl leading-none">🏆</p>
        <h2
          className="animate-rise-in font-display text-4xl text-balance"
          style={{ color: teamColor(winner) }}
        >
          {first.name} wins!
        </h2>
        <p className="animate-rise-in font-display text-3xl tabular-nums [animation-delay:150ms]">
          <span style={{ color: teamColor(winner) }}>{first.score}</span>
          <span className="mx-3 text-muted">–</span>
          <span style={{ color: teamColor(loser) }}>{second.score}</span>
        </p>
        <p className="text-muted">over {second.name}</p>
      </div>

      <div className="flex flex-col gap-4 pt-6 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <BigButton
          onClick={() => dispatch({ type: "REMATCH" })}
          className="py-5 font-display text-2xl"
        >
          Rematch
        </BigButton>
        <BigButton
          onClick={() => dispatch({ type: "NEW_GAME" })}
          variant="secondary"
          className="py-4 text-lg"
        >
          Change teams or category
        </BigButton>
      </div>
    </main>
  );
}
