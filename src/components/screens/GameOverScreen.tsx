"use client";

import { useEffect } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { competitorColor } from "@/components/ui/colors";
import { useGame } from "@/hooks/useGame";
import { saveHighScore } from "@/hooks/useHighScore";
import { coopTotal, getTopDescribers, getWinners } from "@/lib/game/selectors";
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
        ) : state.settings.mode === "solo" ? (
          <SoloHeadline state={state} />
        ) : (
          <CoopSummary state={state} />
        )}
        {state.settings.mode === "coop" ? null : <Standings state={state} />}
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

/** Co-op: the team's final score against its record, bomb by bomb. */
function CoopSummary({ state }: Readonly<{ state: GameState }>) {
  const total = coopTotal(state);
  const { categoryId, targetScore } = state.settings;
  const previousBest = state.coop?.previousBest ?? 0;
  const roundScores = state.coop?.roundScores ?? [];
  const mvps = getTopDescribers(state);

  useEffect(() => {
    saveHighScore(categoryId, targetScore, total);
  }, [categoryId, targetScore, total]);

  return (
    <>
      <div aria-hidden className="animate-buzzer-flash pointer-events-none fixed inset-0 z-10" />
      <p aria-hidden className="animate-slam text-7xl leading-none">💥</p>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Final score</p>
      <p className="animate-slam font-display text-8xl leading-none text-accent [text-shadow:0_6px_0_#8a5d00]">
        {total}
      </p>
      <RecordLine total={total} previousBest={previousBest} />

      <ol className="animate-rise-in mt-3 flex flex-wrap justify-center gap-2 [animation-delay:150ms]">
        {roundScores.map((score, index) => (
          <li
            key={index}
            className="rounded-xl border border-line bg-surface/80 px-3 py-1.5 text-sm font-bold"
          >
            💣 {index + 1}: <span className="text-accent">{score}</span>
          </li>
        ))}
      </ol>

      {mvps.length > 0 ? (
        <p className="animate-rise-in mt-2 text-muted [animation-delay:250ms]">
          🎤 Top describer:{" "}
          {mvps.map((index, i) => (
            <span key={index}>
              {i > 0 ? " & " : ""}
              <span className="font-extrabold" style={{ color: competitorColor("coop", index) }}>
                {state.competitors[index].name}
              </span>
            </span>
          ))}{" "}
          ({state.competitors[mvps[0]].score})
        </p>
      ) : null}
    </>
  );
}

function RecordLine({ total, previousBest }: Readonly<{ total: number; previousBest: number }>) {
  if (total > previousBest && total > 0) {
    return (
      <p className="animate-rise-in rounded-full bg-go/15 px-4 py-1.5 font-display text-lg text-go">
        🏆 New record!{previousBest > 0 ? ` (old best ${previousBest})` : ""}
      </p>
    );
  }
  if (previousBest > 0 && total === previousBest) {
    return <p className="font-bold text-accent">Tied your best!</p>;
  }
  if (previousBest > 0) {
    const short = previousBest - total;
    return (
      <p className="font-bold text-muted">
        Best is {previousBest} — {short} short. Again?
      </p>
    );
  }
  return null;
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
