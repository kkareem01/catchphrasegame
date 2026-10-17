"use client";

import { gameAudio } from "@/lib/audio/gameAudio";
import { STRIKE_LIMIT_OPTIONS, TARGET_SCORE_OPTIONS } from "@/lib/game/constants";
import type { SetupPrefs } from "@/lib/game/setup";
import { BigButton } from "./BigButton";
import { Modal } from "./Modal";
import { SegmentedControl } from "./SegmentedControl";

const toOptions = (values: readonly number[]) =>
  values.map((value) => ({ value, label: String(value) }));

/** Game-rule settings + a sound check, opened from the home screen. */
export function SettingsDialog({
  prefs,
  onChange,
  onClose,
}: Readonly<{
  prefs: SetupPrefs;
  onChange: (patch: Partial<SetupPrefs>) => void;
  onClose: () => void;
}>) {
  const isTeams = prefs.mode === "teams";

  return (
    <Modal title="Settings" onDismiss={onClose}>
      <section className="mt-5">
        <p className="mb-2 text-sm font-bold text-muted">
          {isTeams ? "Points to win" : "Strikes and you're out"}
        </p>
        {isTeams ? (
          <SegmentedControl
            label="Points to win"
            options={toOptions(TARGET_SCORE_OPTIONS)}
            value={prefs.targetScore}
            onChange={(targetScore) => onChange({ targetScore })}
          />
        ) : (
          <SegmentedControl
            label="Strikes to lose"
            options={toOptions(STRIKE_LIMIT_OPTIONS)}
            value={prefs.strikeLimit}
            onChange={(strikeLimit) => onChange({ strikeLimit })}
          />
        )}
      </section>

      {isTeams ? (
        <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-black/25 px-4 py-3.5">
          <span>
            <span className="font-bold">Steal rule</span>
            <span className="block text-sm text-muted">
              After the buzzer, the other team can guess the last phrase for +2
            </span>
          </span>
          <input
            type="checkbox"
            checked={prefs.stealRuleEnabled}
            onChange={(e) => onChange({ stealRuleEnabled: e.target.checked })}
            className="h-7 w-7 shrink-0 accent-[color:var(--accent)]"
          />
        </label>
      ) : null}

      <section className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-black/25 px-4 py-3.5">
        <span>
          <span className="font-bold">Sound check</span>
          <span className="block text-sm text-muted">
            Plays even on silent mode — turn the volume up!
          </span>
        </span>
        <BigButton
          onClick={() => gameAudio.playPreview()}
          variant="secondary"
          className="shrink-0 px-4 py-2.5 text-sm"
        >
          🔊 Test
        </BigButton>
      </section>

      <BigButton onClick={onClose} className="mt-6 w-full py-4 text-lg">
        Done
      </BigButton>
    </Modal>
  );
}
