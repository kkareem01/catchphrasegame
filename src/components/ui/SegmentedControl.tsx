"use client";

type Option<T extends string | number> = Readonly<{
  value: T;
  label: string;
  hint?: string;
}>;

/** Pill toggle group: one choice from a few, all visible at once. */
export function SegmentedControl<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: Readonly<{
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="grid gap-1.5 rounded-2xl border border-line bg-black/25 p-1.5"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`rounded-xl px-2 py-2.5 text-center transition-colors ${
              selected
                ? "bg-accent text-[#1d1400] shadow-md shadow-accent/20"
                : "text-foreground active:bg-white/10"
            }`}
          >
            <span className="block text-base font-extrabold leading-tight">
              {option.label}
            </span>
            {option.hint ? (
              <span
                className={`block text-[0.7rem] font-semibold leading-tight ${
                  selected ? "opacity-75" : "text-muted"
                }`}
              >
                {option.hint}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
