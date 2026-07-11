"use client";

import { BigButton } from "@/components/ui/BigButton";
import { ScoreBoard } from "@/components/ui/ScoreBoard";
import { useGame } from "@/hooks/useGame";

const TEAM_TINT_CLASSES = [
  "bg-gradient-to-b from-team-a/15 to-transparent",
  "bg-gradient-to-b from-team-b/15 to-transparent",
] as const;

const TEAM_TEXT_CLASSES = ["text-team-a", "text-team-b"] as const;

export function RoundActiveScreen() {
  const { state, dispatch } = useGame();
  const holder = state.holdingTeam;

  return (
    <main
      className={`relative flex flex-1 flex-col ${TEAM_TINT_CLASSES[holder]}`}
    >
      <ScoreBoard state={state} showHolder />

      <p className={`text-center text-sm font-semibold ${TEAM_TEXT_CLASSES[holder]}`}>
        {state.teams[holder].name} is describing
      </p>

      <div className="flex flex-1 items-center justify-center px-6">
        <p
          className="text-center font-black leading-tight text-balance"
          style={{ fontSize: "clamp(2.25rem, 10vw, 4.5rem)" }}
        >
          {state.currentPhrase}
        </p>
      </div>

      <div className="flex flex-col gap-3 px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        <BigButton
          onClick={() => dispatch({ type: "CORRECT" })}
          className="py-10 text-3xl min-h-[28vh]"
        >
          Got it! Pass it on
        </BigButton>
        <BigButton
          onClick={() => dispatch({ type: "SKIP" })}
          variant="secondary"
          className="py-4 text-lg"
        >
          Skip
        </BigButton>
      </div>
    </main>
  );
}
