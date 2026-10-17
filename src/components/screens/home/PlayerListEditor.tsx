"use client";

import { competitorColor } from "@/components/ui/colors";
import {
  DEFAULT_PLAYER_PREFIX,
  MAX_NAME_LENGTH,
  SOLO_MAX_PLAYERS,
  SOLO_MIN_PLAYERS,
} from "@/lib/game/constants";

/** Free-for-all roster. Order = seating order around the circle. */
export function PlayerListEditor({
  names,
  onChange,
}: Readonly<{
  names: readonly string[];
  onChange: (names: readonly string[]) => void;
}>) {
  const canRemove = names.length > SOLO_MIN_PLAYERS;
  const canAdd = names.length < SOLO_MAX_PLAYERS;

  return (
    <div className="flex flex-col gap-2">
      <ol className="flex flex-col gap-2">
        {names.map((name, index) => {
          const color = competitorColor("solo", index);
          return (
            <li
              key={index}
              className="flex items-center gap-2 rounded-2xl border border-line bg-black/25 py-1 pr-1 pl-2 transition-colors focus-within:border-accent"
            >
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm text-[#120d26]"
                style={{ background: color }}
              >
                {index + 1}
              </span>
              <input
                value={name}
                onChange={(e) =>
                  onChange(names.map((n, i) => (i === index ? e.target.value : n)))
                }
                maxLength={MAX_NAME_LENGTH}
                placeholder={`${DEFAULT_PLAYER_PREFIX} ${index + 1}`}
                aria-label={`Player ${index + 1} name`}
                enterKeyHint="next"
                className="min-w-0 flex-1 bg-transparent py-2 text-lg font-bold outline-none placeholder:text-white/30"
              />
              {canRemove ? (
                <button
                  type="button"
                  onClick={() => onChange(names.filter((_, i) => i !== index))}
                  aria-label={`Remove player ${index + 1}`}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl text-muted active:bg-white/10"
                >
                  ×
                </button>
              ) : null}
            </li>
          );
        })}
      </ol>
      {canAdd ? (
        <button
          type="button"
          onClick={() => onChange([...names, ""])}
          className="rounded-2xl border-2 border-dashed border-line py-3 font-bold text-muted active:bg-white/5"
        >
          + Add player
        </button>
      ) : null}
      <p className="px-1 text-xs text-muted">
        Sit in a circle in this order — the phone travels round to the next seat.
      </p>
    </div>
  );
}
