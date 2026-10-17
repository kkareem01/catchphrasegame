"use client";

import { competitorColor, tint } from "@/components/ui/colors";
import { MAX_NAME_LENGTH } from "@/lib/game/constants";

export function TeamNamesEditor({
  names,
  onChange,
}: Readonly<{
  names: readonly [string, string];
  onChange: (names: readonly [string, string]) => void;
}>) {
  const rename = (index: 0 | 1, value: string) =>
    onChange(index === 0 ? [value, names[1]] : [names[0], value]);

  return (
    <div className="relative grid grid-cols-2 gap-3">
      {([0, 1] as const).map((index) => {
        const color = competitorColor("teams", index);
        return (
          <label
            key={index}
            className="flex flex-col gap-1 rounded-2xl border-2 px-3 pt-2 pb-2.5 focus-within:!border-accent"
            style={{ borderColor: tint(color, 45), background: tint(color, 8) }}
          >
            <span className="text-[0.7rem] font-bold uppercase tracking-wider" style={{ color }}>
              Team {index + 1}
            </span>
            <input
              value={names[index]}
              onChange={(e) => rename(index, e.target.value)}
              onFocus={(e) => e.target.select()}
              maxLength={MAX_NAME_LENGTH}
              placeholder={`Team ${index + 1}`}
              enterKeyHint="done"
              className="w-full min-w-0 bg-transparent text-lg font-extrabold outline-none placeholder:text-white/30"
            />
          </label>
        );
      })}
      <span
        aria-hidden
        className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-surface-2 font-display text-xs"
      >
        VS
      </span>
    </div>
  );
}
