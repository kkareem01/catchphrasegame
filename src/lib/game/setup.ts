import {
  DEFAULT_TARGET_SCORE,
  DEFAULT_TEAM_NAMES,
  DEFAULT_TEAM_PREFIX,
  MAX_NAME_LENGTH,
  TARGET_SCORE_OPTIONS,
} from "./constants";
import type { GameSettings } from "./types";

type Pair<T> = readonly [T, T];

/** Everything the home screen lets players choose; persisted between visits. */
export type SetupPrefs = Readonly<{
  teamNames: Pair<string>;
  categoryId: string;
  stealRuleEnabled: boolean;
  targetScore: number;
}>;

export const DEFAULT_SETUP_PREFS: SetupPrefs = {
  teamNames: DEFAULT_TEAM_NAMES,
  categoryId: "everything",
  stealRuleEnabled: false,
  targetScore: DEFAULT_TARGET_SCORE,
};

/** Trims team names; blanks become "Team 1" / "Team 2". */
export const normalizeNames = (names: readonly string[]): readonly string[] =>
  names.map((name, index) => name.trim() || `${DEFAULT_TEAM_PREFIX} ${index + 1}`);

export const toGameSettings = (prefs: SetupPrefs): GameSettings => ({
  categoryId: prefs.categoryId,
  stealRuleEnabled: prefs.stealRuleEnabled,
  targetScore: prefs.targetScore,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parsePair = <T>(
  value: unknown,
  parseItem: (item: unknown) => T | null,
): Pair<T> | null => {
  if (!Array.isArray(value) || value.length !== 2) return null;
  const [a, b] = value.map(parseItem);
  return a !== null && b !== null ? [a, b] : null;
};

const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/**
 * Validates untrusted saved prefs (localStorage). Each field falls back to
 * its default on its own, so one bad value never wipes the rest. Fields
 * from older versions (free-for-all, player rosters) are ignored.
 */
export const parseSetupPrefs = (
  raw: unknown,
  categoryIds: readonly string[],
): SetupPrefs => {
  if (!isRecord(raw)) return DEFAULT_SETUP_PREFS;
  const d = DEFAULT_SETUP_PREFS;
  const teamNamePair = parsePair(raw.teamNames, (v) =>
    typeof v === "string" ? v.slice(0, MAX_NAME_LENGTH) : null,
  );
  return {
    teamNames: teamNamePair ?? d.teamNames,
    categoryId: pick(raw.categoryId, categoryIds, d.categoryId),
    stealRuleEnabled:
      typeof raw.stealRuleEnabled === "boolean"
        ? raw.stealRuleEnabled
        : d.stealRuleEnabled,
    targetScore: pick(raw.targetScore, TARGET_SCORE_OPTIONS, d.targetScore),
  };
};
