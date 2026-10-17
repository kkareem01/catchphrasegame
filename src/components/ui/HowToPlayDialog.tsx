"use client";

import { BigButton } from "./BigButton";
import { Modal } from "./Modal";

const STEPS: readonly string[] = [
  "Split into two teams and sit so the teams alternate around the circle.",
  "Describe the phrase on screen without saying any word in it — no rhymes, no “sounds like”. Only your teammates can guess.",
  "When your team gets it, tap Got it! and hand the phone to the other team. Stuck? Skip.",
  "Beeps speed up as the hidden timer runs out. Nobody knows when it'll blow.",
  "When the buzzer goes, the team NOT holding the phone scores a point.",
  "Odd number of players? Just play — somewhere two teammates will sit side by side. When the phone passes between them, the passer sits out guessing that one phrase.",
];

export function HowToPlayDialog({ onClose }: Readonly<{ onClose: () => void }>) {
  return (
    <Modal title="How to play" onDismiss={onClose}>
      <ol className="mt-4 flex flex-col gap-3">
        {STEPS.map((step, index) => (
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
