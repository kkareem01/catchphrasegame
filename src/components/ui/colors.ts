const TEAM_COLORS = ["var(--team-a)", "var(--team-b)"] as const;

/** CSS colour for team 0 or team 1. */
export const teamColor = (index: number): string =>
  TEAM_COLORS[index % TEAM_COLORS.length];

/** Translucent version of a CSS colour, for tints and glows. */
export const tint = (color: string, percent: number): string =>
  `color-mix(in srgb, ${color} ${percent}%, transparent)`;
