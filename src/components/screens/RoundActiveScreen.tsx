"use client";

import { useRef } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { competitorColor, tint } from "@/components/ui/colors";
import { ScoreBoard } from "@/components/ui/ScoreBoard";
import { useGame } from "@/hooks/useGame";
import { useVibration } from "@/hooks/useVibration";
import { gameAudio } from "@/lib/audio/gameAudio";
import {
  CORRECT_TAP_COOLDOWN_MS,
  CORRECT_VIBRATION_PATTERN,
} from "@/lib/game/constants";
import { nextHolderIndex } from "@/lib/game/selectors";

/** Long phrases get a smaller size so they never overflow the card. */
const LONG_PHRASE_CHARS = 16;

export function RoundActiveScreen() {
  const { state, dispatch } = useGame();
  const vibrate = useVibration();
  const lastCorrectAt = useRef(0);
  const { mode } = state.settings;
  const holder = state.competitors[state.holder];
  const holderColor = competitorColor(mode, state.holder);
  const nextIndex = nextHolderIndex(state);
  const nextColor = competitorColor(mode, nextIndex);
  const phrase = state.currentPhrase ?? "";

  const handleCorrect = () => {
    // A double tap would otherwise skip the next describer entirely.
    const now = performance.now();
    if (now - lastCorrectAt.current < CORRECT_TAP_COOLDOWN_MS) return;
    lastCorrectAt.current = now;
    gameAudio.playCorrect();
    vibrate(CORRECT_VIBRATION_PATTERN);
    dispatch({ type: "CORRECT" });
  };

  return (
    <main className="relative flex flex-1 flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-[background] duration-500"
        style={{
          background: `radial-gradient(90% 60% at 50% 30%, ${tint(holderColor, 22)}, transparent 75%)`,
        }}
      />

      <div className="relative flex flex-1 flex-col">
        <ScoreBoard showHolder />

        <div className="mt-2 text-center">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted">
            Now describing
          </p>
          <p className="font-display text-2xl" style={{ color: holderColor }}>
            {holder.name}
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-3">
          <div
            key={phrase}
            className="animate-phrase-pop w-full rounded-[2rem] border-2 bg-surface/80 px-5 py-[clamp(1.25rem,5dvh,2.5rem)] text-center shadow-2xl"
            style={{
              borderColor: tint(holderColor, 60),
              boxShadow: `0 20px 60px -20px ${tint(holderColor, 45)}`,
            }}
          >
            <p
              className="font-extrabold leading-[1.05] text-balance"
              style={{
                fontSize: `clamp(2rem, ${phrase.length > LONG_PHRASE_CHARS ? 9 : 12}vw, 4.5rem)`,
              }}
            >
              {phrase}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 px-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <BigButton
            onClick={handleCorrect}
            variant="go"
            className="flex min-h-[24dvh] flex-col items-center justify-center gap-2 py-5"
          >
            <span className="font-display text-4xl">Got it!</span>
            <span className="flex items-center gap-2 rounded-full bg-black/15 px-3 py-1 text-base font-extrabold">
              Pass to
              <span
                className="rounded-full bg-[#120d26] px-2.5 py-0.5"
                style={{ color: nextColor }}
              >
                {state.competitors[nextIndex].name}
              </span>
              →
            </span>
          </BigButton>
          <BigButton
            onClick={() => dispatch({ type: "SKIP" })}
            variant="secondary"
            className="py-3.5 text-lg"
          >
            Skip
          </BigButton>
        </div>
      </div>
    </main>
  );
}
