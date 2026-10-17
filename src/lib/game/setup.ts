import {
  COOP_MAX_PLAYERS,
  COOP_MIN_PLAYERS,
  COOP_ROUND_OPTIONS,
  DEFAULT_COOP_ROUNDS,
  DEFAULT_PLAYER_PREFIX,
  DEFAULT_STRIKE_LIMIT,
  DEFAULT_TARGET_SCORE,
  DEFAULT_TEAM_NAMES,
  DEFAULT_TEAM_PREFIX,
  MAX_NAME_LENGTH,
  SOLO_MAX_PLAYERS,
  SOLO_MIN_PLAYERS,
  STRIKE_LIMIT_OPTIONS,
  TARGET_SCORE_OPTIONS,
} from "./constants";
import type { GameMode, GameSettings } from "./types";

/** Everything the home screen lets players choose; persisted between visits. */
export type SetupPrefs = Readonly<{
  mode: GameMode;
  teamNames: readonly [string, string];
  playerNames: readonly string[];
  categoryId: string;
  stealRuleEnabled: boolean;
  targetScore: number;
  strikeLimit: number;
  coopNames: readonly string[];
  coopRounds: number;
}>;

export const DEFAULT_SETUP_PREFS: SetupPrefs = {
  mode: "teams",
  teamNames: DEFAULT_TEAM_NAMES,
  playerNames: Array.from({ length: SOLO_MIN_PLAYERS }, () => ""),
  categoryId: "everything",
  stealRuleEnabled: false,
  targetScore: DEFAULT_TARGET_SCORE,
  strikeLimit: DEFAULT_STRIKE_LIMIT,
  coopNames: Array.from({ length: COOP_MIN_PLAYERS }, () => ""),
  coopRounds: DEFAULT_COOP_ROUNDS,
};

const ROSTER_LIMITS: Record<GameMode, readonly [number, number]> = {
  teams: [2, 2],
  solo: [SOLO_MIN_PLAYERS, SOLO_MAX_PLAYERS],
  coop: [COOP_MIN_PLAYERS, COOP_MAX_PLAYERS],
};

/** Game length for the chosen mode: points, strikes or bombs. */
const GAME_LENGTH: Record<GameMode, (prefs: SetupPrefs) => number> = {
  teams: (prefs) => prefs.targetScore,
  solo: (prefs) => prefs.strikeLimit,
  coop: (prefs) => prefs.coopRounds,
};

export const isValidRoster = (mode: GameMode, count: number): boolean => {
  const [min, max] = ROSTER_LIMITS[mode];
  return count >= min && count <= max;
};

/** The roster the home screen is editing for the chosen mode. */
export const rosterFor = (prefs: SetupPrefs): readonly string[] =>
  ({ teams: prefs.teamNames, solo: prefs.playerNames, coop: prefs.coopNames })[
    prefs.mode
  ];

/** Trims names; blanks become "Team 2" / "Player 3" by seat number. */
export const normalizeNames = (
  mode: GameMode,
  names: readonly string[],
): readonly string[] => {
  const prefix = mode === "teams" ? DEFAULT_TEAM_PREFIX : DEFAULT_PLAYER_PREFIX;
  return names.map((name, index) => name.trim() || `${prefix} ${index + 1}`);
};

export const toGameSettings = (prefs: SetupPrefs): GameSettings => ({
  mode: prefs.mode,
  categoryId: prefs.categoryId,
  stealRuleEnabled: prefs.mode === "teams" && prefs.stealRuleEnabled,
  targetScore: GAME_LENGTH[prefs.mode](prefs),
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseNames = (value: unknown): readonly string[] | null =>
  Array.isArray(value) && value.every((v) => typeof v === "string")
    ? value.map((v: string) => v.slice(0, MAX_NAME_LENGTH))
    : null;

const pick = <T>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

/**
 * Validates untrusted saved prefs (localStorage). Each field falls back to
 * its default on its own, so one bad value never wipes the rest.
 */
export const parseSetupPrefs = (
  raw: unknown,
  categoryIds: readonly string[],
): SetupPrefs => {
  if (!isRecord(raw)) return DEFAULT_SETUP_PREFS;
  const d = DEFAULT_SETUP_PREFS;
  const teamNames = parseNames(raw.teamNames);
  const playerNames = parseNames(raw.playerNames);
  const coopNames = parseNames(raw.coopNames);
  return {
    mode: pick<GameMode>(raw.mode, ["teams", "solo", "coop"], d.mode),
    teamNames:
      teamNames?.length === 2 ? [teamNames[0], teamNames[1]] : d.teamNames,
    playerNames:
      playerNames && isValidRoster("solo", playerNames.length)
        ? playerNames
        : d.playerNames,
    categoryId: pick(raw.categoryId, categoryIds, d.categoryId),
    stealRuleEnabled:
      typeof raw.stealRuleEnabled === "boolean"
        ? raw.stealRuleEnabled
        : d.stealRuleEnabled,
    targetScore: pick(raw.targetScore, TARGET_SCORE_OPTIONS, d.targetScore),
    strikeLimit: pick(raw.strikeLimit, STRIKE_LIMIT_OPTIONS, d.strikeLimit),
    coopNames:
      coopNames && isValidRoster("coop", coopNames.length) ? coopNames : d.coopNames,
    coopRounds: pick(raw.coopRounds, COOP_ROUND_OPTIONS, d.coopRounds),
  };
};
