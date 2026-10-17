import type { GameMode } from "@/lib/game/types";

const TEAM_COLORS = ["var(--team-a)", "var(--team-b)"] as const;
const PLAYER_PALETTE_SIZE = 10;

/** CSS colour for a team or a free-for-all seat (see --p0…--p9). */
export const competitorColor = (mode: GameMode, index: number): string =>
  mode === "teams"
    ? TEAM_COLORS[index % TEAM_COLORS.length]
    : `var(--p${index % PLAYER_PALETTE_SIZE})`;

/** Translucent version of a CSS colour, for tints and glows. */
export const tint = (color: string, percent: number): string =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;
