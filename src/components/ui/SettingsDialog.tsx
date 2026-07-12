"use client";

import { TARGET_SCORE_OPTIONS } from "@/lib/game/constants";
import { BigButton } from "./BigButton";
import { Modal } from "./Modal";

/** Game-rule settings, opened from the home screen. */
export function SettingsDialog({
  targetScore,
  onTargetScoreChange,
  stealRuleEnabled,
  onStealRuleChange,
  onClose,
}: Readonly<{
  targetScore: number;
  onTargetScoreChange: (points: number) => void;
  stealRuleEnabled: boolean;
  onStealRuleChange: (enabled: boolean) => void;
  onClose: () => void;
}>) {
  return (
    <Modal onDismiss={onClose}>
      <h3 className="text-center text-2xl font-black">Settings</h3>

      <section aria-label="Points to win" className="mt-5">
        <p className="mb-2 text-sm font-semibold opacity-70">Points to win</p>
        <div className="grid grid-cols-4 gap-2">
          {TARGET_SCORE_OPTIONS.map((points) => (
            <button
              key={points}
              type="button"
              onClick={() => onTargetScoreChange(points)}
              aria-pressed={targetScore === points}
              className={`rounded-xl border py-3 text-lg font-bold transition-colors ${
                targetScore === points
                  ? "border-accent bg-accent text-background"
                  : "border-white/10 bg-background active:bg-white/10"
              }`}
            >
              {points}
            </button>
          ))}
        </div>
      </section>

      <label className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-background px-4 py-3">
        <span>
          <span className="font-semibold">Steal rule</span>
          <span className="block text-xs opacity-60">
            Other team can guess the last phrase for a bonus point
          </span>
        </span>
        <input
          type="checkbox"
          checked={stealRuleEnabled}
          onChange={(e) => onStealRuleChange(e.target.checked)}
          className="h-6 w-6 shrink-0 accent-[color:var(--accent)]"
        />
      </label>

      <BigButton onClick={onClose} className="mt-5 w-full py-4 text-lg">
        Done
      </BigButton>
    </Modal>
  );
}
