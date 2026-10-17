"use client";

import { useState, type ReactNode } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { HowToPlayDialog } from "@/components/ui/HowToPlayDialog";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { SettingsDialog } from "@/components/ui/SettingsDialog";
import { useGame } from "@/hooks/useGame";
import { useHighScore } from "@/hooks/useHighScore";
import { useSetupPrefs } from "@/hooks/useSetupPrefs";
import { gameAudio } from "@/lib/audio/gameAudio";
import { getPhrasesForCategory } from "@/lib/data";
import {
  COOP_MAX_PLAYERS,
  COOP_MIN_PLAYERS,
  SOLO_MAX_PLAYERS,
  SOLO_MIN_PLAYERS,
} from "@/lib/game/constants";
import { createDeck } from "@/lib/game/deck";
import { normalizeNames, rosterFor, toGameSettings, type SetupPrefs } from "@/lib/game/setup";
import type { GameMode } from "@/lib/game/types";
import { CategoryPicker } from "./home/CategoryPicker";
import { PlayerListEditor } from "./home/PlayerListEditor";
import { TeamNamesEditor } from "./home/TeamNamesEditor";

const MODE_OPTIONS: readonly Readonly<{ value: GameMode; label: string; hint: string }>[] = [
  { value: "teams", label: "Teams", hint: "2 teams" },
  { value: "solo", label: "Free-for-all", hint: "3–10, odd OK" },
  { value: "coop", label: "Co-op 💣", hint: "Beat the Bomb" },
];

const rulesSummary = (prefs: SetupPrefs, best: number): string => {
  switch (prefs.mode) {
    case "teams":
      return `First to ${prefs.targetScore} · Steal ${prefs.stealRuleEnabled ? "on" : "off"}`;
    case "solo":
      return `${prefs.strikeLimit} strikes and you're out`;
    case "coop":
      return `${prefs.coopRounds} bombs${best > 0 ? ` · Best ${best}` : ""}`;
  }
};

type Sheet = "settings" | "help" | null;

export function HomeScreen() {
  const { dispatch } = useGame();
  const [prefs, updatePrefs] = useSetupPrefs();
  const [sheet, setSheet] = useState<Sheet>(null);
  const coopBest = useHighScore(prefs.categoryId, prefs.coopRounds);

  const startGame = () => {
    // Belt and braces: the document-level listener also unlocks on this tap.
    gameAudio.unlock();
    dispatch({
      type: "START_GAME",
      names: normalizeNames(prefs.mode, rosterFor(prefs)),
      deck: createDeck(getPhrasesForCategory(prefs.categoryId), Math.random),
      settings: toGameSettings(prefs),
      previousBest: prefs.mode === "coop" ? coopBest : undefined,
    });
  };

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pt-[max(env(safe-area-inset-top),1.25rem)]">
      <header className="animate-rise-in relative pt-3 pb-6 text-center">
        <button
          type="button"
          onClick={() => setSheet("help")}
          className="absolute top-2 right-0 flex h-10 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-sm font-bold active:bg-white/10"
        >
          <span aria-hidden className="font-display">?</span> How to play
        </button>
        <h1 className="logo-3d mt-10 -rotate-3 text-[2.9rem] leading-[0.95]">
          Catch
          <br />
          Phrase
        </h1>
        <p className="mt-4 text-sm font-semibold text-muted">
          Describe it. Pass it. Don&apos;t get caught holding it.
        </p>
      </header>

      <div className="flex flex-col gap-6 pb-6">
        <Section title="Who's playing?">
          <SegmentedControl
            label="Game mode"
            options={MODE_OPTIONS}
            value={prefs.mode}
            onChange={(mode) => updatePrefs({ mode })}
          />
          <div className="mt-3">
            {prefs.mode === "teams" ? (
              <TeamNamesEditor
                names={prefs.teamNames}
                onChange={(teamNames) => updatePrefs({ teamNames })}
              />
            ) : prefs.mode === "solo" ? (
              <PlayerListEditor
                names={prefs.playerNames}
                onChange={(playerNames) => updatePrefs({ playerNames })}
                minPlayers={SOLO_MIN_PLAYERS}
                maxPlayers={SOLO_MAX_PLAYERS}
                hint="Sit in a circle in this order — the phone travels round to the next seat."
              />
            ) : (
              <PlayerListEditor
                names={prefs.coopNames}
                onChange={(coopNames) => updatePrefs({ coopNames })}
                minPlayers={COOP_MIN_PLAYERS}
                maxPlayers={COOP_MAX_PLAYERS}
                hint="Everyone's on the same team. Pass the phone round in this order and clear as many phrases as you can before each bomb blows."
              />
            )}
          </div>
        </Section>

        <Section title="Category">
          <CategoryPicker
            value={prefs.categoryId}
            onChange={(categoryId) => updatePrefs({ categoryId })}
          />
        </Section>

        <button
          type="button"
          onClick={() => setSheet("settings")}
          className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3.5 text-left active:bg-white/10"
        >
          <span className="flex items-center gap-2.5 font-bold">
            <span aria-hidden className="text-xl">⚙️</span>
            Rules &amp; sound
          </span>
          <span className="text-right text-xs font-semibold text-muted">
            {rulesSummary(prefs, coopBest)} ›
          </span>
        </button>
      </div>

      <div className="sticky bottom-0 mt-auto -mx-4 bg-gradient-to-t from-background via-background/95 to-transparent px-4 pt-6 pb-[max(env(safe-area-inset-bottom),1rem)]">
        <BigButton onClick={startGame} className="w-full py-5 font-display text-2xl tracking-wide">
          Start game
        </BigButton>
      </div>

      {sheet === "settings" ? (
        <SettingsDialog prefs={prefs} onChange={updatePrefs} onClose={() => setSheet(null)} />
      ) : null}
      {sheet === "help" ? (
        <HowToPlayDialog mode={prefs.mode} onClose={() => setSheet(null)} />
      ) : null}
    </main>
  );
}

function Section({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2.5 px-1 font-display text-sm tracking-wide text-muted">{title}</h2>
      {children}
    </section>
  );
}
