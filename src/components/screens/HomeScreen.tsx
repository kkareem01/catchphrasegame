"use client";

import { useState } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { useGame } from "@/hooks/useGame";
import { beepPlayer } from "@/lib/audio/beepPlayer";
import { getCategoryChoices, getPhrasesForCategory } from "@/lib/data";
import { DEFAULT_TEAM_NAMES } from "@/lib/game/constants";
import { createDeck } from "@/lib/game/deck";

const CATEGORY_CHOICES = getCategoryChoices();

export function HomeScreen() {
  const { dispatch } = useGame();
  const [categoryId, setCategoryId] = useState(CATEGORY_CHOICES[0].id);
  const [teamNames, setTeamNames] = useState<[string, string]>([
    DEFAULT_TEAM_NAMES[0],
    DEFAULT_TEAM_NAMES[1],
  ]);
  const [stealRuleEnabled, setStealRuleEnabled] = useState(false);

  const startGame = () => {
    // Must happen inside this tap handler: iOS unlocks audio on gesture only.
    beepPlayer.unlock();
    dispatch({
      type: "START_GAME",
      teams: [
        teamNames[0].trim() || DEFAULT_TEAM_NAMES[0],
        teamNames[1].trim() || DEFAULT_TEAM_NAMES[1],
      ],
      deck: createDeck(getPhrasesForCategory(categoryId), Math.random),
      settings: { categoryId, stealRuleEnabled },
    });
  };

  return (
    <main className="flex flex-1 flex-col gap-6 px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] pt-[max(env(safe-area-inset-top),2rem)] max-w-lg w-full mx-auto">
      <div className="text-center">
        <h1 className="text-4xl font-black tracking-tight">
          Catch <span className="text-accent">Phrase</span>
        </h1>
        <p className="mt-1 text-sm opacity-60">
          Describe the phrase. Pass the phone. Beat the buzzer.
        </p>
      </div>

      <section aria-label="Teams" className="flex gap-3">
        {([0, 1] as const).map((index) => (
          <input
            key={index}
            value={teamNames[index]}
            onChange={(e) => {
              const next: [string, string] = [...teamNames];
              next[index] = e.target.value;
              setTeamNames(next);
            }}
            maxLength={14}
            aria-label={`Team ${index + 1} name`}
            className={`min-w-0 flex-1 rounded-xl bg-surface border px-4 py-3 text-center font-semibold outline-none focus:border-accent ${
              index === 0 ? "border-team-a/40 text-team-a" : "border-team-b/40 text-team-b"
            }`}
          />
        ))}
      </section>

      <section aria-label="Category" className="grid grid-cols-2 gap-2">
        {CATEGORY_CHOICES.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => setCategoryId(choice.id)}
            className={`rounded-xl px-3 py-3 text-left font-semibold border transition-colors ${
              categoryId === choice.id
                ? "bg-accent text-background border-accent"
                : "bg-surface border-white/10 active:bg-white/10"
            }`}
          >
            <span className="mr-2">{choice.emoji}</span>
            {choice.name}
          </button>
        ))}
      </section>

      <label className="flex items-center justify-between rounded-xl bg-surface border border-white/10 px-4 py-3">
        <span>
          <span className="font-semibold">Steal rule</span>
          <span className="block text-xs opacity-60">
            Other team can guess the last phrase for a bonus point
          </span>
        </span>
        <input
          type="checkbox"
          checked={stealRuleEnabled}
          onChange={(e) => setStealRuleEnabled(e.target.checked)}
          className="h-6 w-6 accent-[color:var(--accent)]"
        />
      </label>

      <BigButton onClick={startGame} className="mt-auto py-6 text-2xl">
        Start Game
      </BigButton>
    </main>
  );
}
