"use client";

import { gameAudio } from "@/lib/audio/gameAudio";
import { TARGET_SCORE_OPTIONS } from "@/lib/game/constants";
import type { SetupPrefs } from "@/lib/game/setup";
import { BigButton } from "./BigButton";
import { Modal } from "./Modal";
import { SegmentedControl } from "./SegmentedControl";

const POINT_OPTIONS = TARGET_SCORE_OPTIONS.map((value) => ({
  value,
  label: String(value),
}));

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
  return (
    <Modal title="Settings" onDismiss={onClose}>
      <section className="mt-5">
        <p className="mb-2 text-sm font-bold text-muted">Points to win</p>
        <SegmentedControl
          label="Points to win"
          options={POINT_OPTIONS}
          value={prefs.targetScore}
          onChange={(targetScore) => onChange({ targetScore })}
        />
      </section>

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
