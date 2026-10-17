"use client";

import type { GameMode } from "@/lib/game/types";
import { BigButton } from "./BigButton";
import { Modal } from "./Modal";

const COMMON_STEPS: readonly string[] = [
  "Describe the phrase on screen without saying any word in it — no rhymes, no “sounds like”.",
  "When someone guesses it, tap Got it! and hand the phone on. Stuck? Skip.",
  "Beeps speed up as the hidden timer runs out. Nobody knows when it'll blow.",
];

const MODE_STEPS: Record<GameMode, readonly string[]> = {
  teams: [
    "Sit so the teams alternate around the circle. Only your teammates can guess.",
    "When the buzzer goes, the team NOT holding the phone scores a point.",
  ],
  solo: [
    "Any number of players, 3 to 10 — perfect for odd groups. Sit in the order you entered names.",
    "Everyone can guess. Whoever is caught holding the phone takes a strike 💣.",
    "Hit the strike limit and you're out — fewest strikes wins.",
  ],
};

export function HowToPlayDialog({
  mode,
  onClose,
}: Readonly<{ mode: GameMode; onClose: () => void }>) {
  const steps = [...COMMON_STEPS.slice(0, 1), ...MODE_STEPS[mode], ...COMMON_STEPS.slice(1)];
  return (
    <Modal title="How to play" onDismiss={onClose}>
      <p className="mt-1 text-center text-sm font-bold text-muted">
        {mode === "teams" ? "Teams" : "Free-for-all"}
      </p>
      <ol className="mt-4 flex flex-col gap-3">
        {steps.map((step, index) => (
          <li key={step} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm text-[#1d1400]">
              {index + 1}
            </span>
            <span className="pt-0.5 leading-snug">{step}</span>
          </li>
        ))}
      </ol>
      <BigButton onClick={onClose} className="mt-6 w-full py-4 text-lg">
        Got it
      </BigButton>
    </Modal>
  );
}
