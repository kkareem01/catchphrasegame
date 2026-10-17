"use client";

import { useState, type ReactNode } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { HowToPlayDialog } from "@/components/ui/HowToPlayDialog";
import { SettingsDialog } from "@/components/ui/SettingsDialog";
import { useGame } from "@/hooks/useGame";
import { useSetupPrefs } from "@/hooks/useSetupPrefs";
import { gameAudio } from "@/lib/audio/gameAudio";
import { getPhrasesForCategory } from "@/lib/data";
import { createDeck } from "@/lib/game/deck";
import { normalizeNames, toGameSettings } from "@/lib/game/setup";
import { CategoryPicker } from "./home/CategoryPicker";
import { TeamNamesEditor } from "./home/TeamNamesEditor";

type Sheet = "settings" | "help" | null;

export function HomeScreen() {
  const { dispatch } = useGame();
  const [prefs, updatePrefs] = useSetupPrefs();
  const [sheet, setSheet] = useState<Sheet>(null);

  const startGame = () => {
    // Belt and braces: the document-level listener also unlocks on this tap.
    gameAudio.unlock();
    dispatch({
      type: "START_GAME",
      names: normalizeNames(prefs.teamNames),
      deck: createDeck(getPhrasesForCategory(prefs.categoryId), Math.random),
      settings: toGameSettings(prefs),
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
        <Section title="Teams">
          <TeamNamesEditor
            names={prefs.teamNames}
            onChange={(teamNames) => updatePrefs({ teamNames })}
          />
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
            First to {prefs.targetScore} · Steal {prefs.stealRuleEnabled ? "on" : "off"} ›
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
      {sheet === "help" ? <HowToPlayDialog onClose={() => setSheet(null)} /> : null}
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
