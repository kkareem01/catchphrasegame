"use client";

import { getCategoryChoices } from "@/lib/data";

const CATEGORY_CHOICES = getCategoryChoices();

export function CategoryPicker({
  value,
  onChange,
}: Readonly<{ value: string; onChange: (categoryId: string) => void }>) {
  return (
    <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-2">
      {CATEGORY_CHOICES.map((choice) => {
        const selected = value === choice.id;
        return (
          <button
            key={choice.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(choice.id)}
            className={`flex items-center gap-2.5 rounded-2xl border-2 px-3 py-2.5 text-left font-bold transition-colors ${
              selected
                ? "border-accent bg-accent/15 text-accent"
                : "border-line bg-black/25 active:bg-white/10"
            }`}
          >
            <span aria-hidden className="text-2xl leading-none">
              {choice.emoji}
            </span>
            <span className="leading-tight">{choice.name}</span>
          </button>
        );
      })}
    </div>
  );
}
