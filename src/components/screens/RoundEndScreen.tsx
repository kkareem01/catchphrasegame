"use client";

import { useEffect } from "react";
import { BigButton } from "@/components/ui/BigButton";
import { ScoreBoard } from "@/components/ui/ScoreBoard";
import { useGame } from "@/hooks/useGame";
import { useVibration } from "@/hooks/useVibration";
import { BUZZER_VIBRATION_PATTERN } from "@/lib/game/constants";

const TEAM_TEXT_CLASSES = ["text-team-a", "text-team-b"] as const;

export function RoundEndScreen() {
  const { state, dispatch } = useGame();
  const vibrate = useVibration();

  useEffect(() => {
    vibrate(BUZZER_VIBRATION_PATTERN);
  }, [vibrate]);

  const stealPending =
    state.settings.stealRuleEnabled && state.lastPointWinner === null;
  const stealingTeam = state.holdingTeam === 0 ? 1 : 0;

  return (
    <main className="flex flex-1 flex-col animate-buzzer-flash">
      <ScoreBoard state={state} />

      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-6xl">🚨</p>
        <h2 className="text-4xl font-black">Time&apos;s up!</h2>

        {stealPending ? (
          <>
            <p className="opacity-80">
              The phrase was{" "}
              <span className="font-bold text-accent">
                “{state.currentPhrase}”
              </span>
            </p>
            <p className="text-lg">
              Can{" "}
              <span className={`font-bold ${TEAM_TEXT_CLASSES[stealingTeam]}`}>
                {state.teams[stealingTeam].name}
              </span>{" "}
              guess it for a bonus point?
            </p>
          </>
        ) : (
          state.lastPointWinner !== null && (
            <p className="text-xl">
              Point to{" "}
              <span
                className={`font-bold ${TEAM_TEXT_CLASSES[state.lastPointWinner]}`}
              >
                {state.teams[state.lastPointWinner].name}
              </span>
              !
            </p>
          )
        )}
      </div>

      <div className="flex flex-col gap-3 px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]">
        {stealPending ? (
          <>
            <BigButton
              onClick={() => dispatch({ type: "RESOLVE_STEAL", stolen: true })}
              className="py-6 text-xl"
            >
              They got it (+2)
            </BigButton>
            <BigButton
              onClick={() => dispatch({ type: "RESOLVE_STEAL", stolen: false })}
              variant="secondary"
              className="py-6 text-xl"
            >
              Nope (+1)
            </BigButton>
          </>
        ) : (
          <BigButton
            onClick={() => dispatch({ type: "START_NEXT_ROUND" })}
            className="py-8 text-2xl"
          >
            Next Round
          </BigButton>
        )}
      </div>
    </main>
  );
}
