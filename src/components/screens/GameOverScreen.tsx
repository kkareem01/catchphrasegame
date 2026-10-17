"use client";

import { BigButton } from "@/components/ui/BigButton";
import { competitorColor } from "@/components/ui/colors";
import { useGame } from "@/hooks/useGame";
import { getWinners } from "@/lib/game/selectors";
import type { GameState } from "@/lib/game/types";

const MEDALS = ["🥇", "🥈", "🥉"] as const;
const listFormat = new Intl.ListFormat("en", { type: "conjunction" });

export function GameOverScreen() {
  const { state, dispatch } = useGame();

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),1.5rem)]">
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        {state.settings.mode === "teams" ? (
          <TeamsHeadline state={state} />
        ) : (
          <SoloHeadline state={state} />
        )}
        <Standings state={state} />
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
          Change players or category
        </BigButton>
      </div>
    </main>
  );
}

function TeamsHeadline({ state }: Readonly<{ state: GameState }>) {
  const [winner] = getWinners(state);
  return (
    <>
      <p aria-hidden className="animate-slam text-8xl leading-none">🏆</p>
      <h2
        className="animate-rise-in font-display text-4xl text-balance"
        style={{ color: competitorColor("teams", winner) }}
      >
        {state.competitors[winner].name} wins!
      </h2>
    </>
  );
}

/** Free-for-all: the drama is who got caught; winners share the glory. */
function SoloHeadline({ state }: Readonly<{ state: GameState }>) {
  const winners = getWinners(state).map((i) => state.competitors[i].name);
  const out = state.lastScorer;
  return (
    <>
      <p aria-hidden className="animate-slam text-8xl leading-none">💥</p>
      {out !== null ? (
        <h2 className="animate-rise-in font-display text-4xl text-balance">
          <span style={{ color: competitorColor("solo", out) }}>
            {state.competitors[out].name}
          </span>{" "}
          struck out!
        </h2>
      ) : null}
      <p className="animate-rise-in text-lg font-bold text-balance">
        🏆 {listFormat.format(winners)} {winners.length === 1 ? "wins" : "win"}
      </p>
    </>
  );
}

function Standings({ state }: Readonly<{ state: GameState }>) {
  const { mode } = state.settings;
  const better = (a: number, b: number) => (mode === "teams" ? a > b : a < b);
  // Teams: most points first. Solo: fewest strikes first. Ties share a rank.
  const rows = state.competitors
    .map((competitor, index) => ({
      ...competitor,
      index,
      rank: state.competitors.filter((other) => better(other.score, competitor.score)).length,
    }))
    .sort((a, b) => a.rank - b.rank);

  return (
    <ol className="animate-rise-in mt-4 flex w-full flex-col gap-2 [animation-delay:150ms]">
      {rows.map((row) => {
        const isOut = mode === "solo" && row.index === state.lastScorer;
        return (
          <li
            key={row.index}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface/80 px-4 py-2.5"
          >
            <span aria-hidden className="w-7 text-xl">
              {isOut ? "💥" : (MEDALS[row.rank] ?? "")}
            </span>
            <span
              className="min-w-0 flex-1 truncate text-left font-extrabold"
              style={{ color: competitorColor(mode, row.index) }}
            >
              {row.name}
            </span>
            <span className="font-display tabular-nums">
              {row.score}
              <span className="ml-1 font-sans text-xs font-bold text-muted">
                {mode === "teams" ? "pts" : row.score === 1 ? "strike" : "strikes"}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
