import { describe, expect, it } from "vitest";
import {
  COOP_MAX_PLAYERS,
  COOP_MIN_PLAYERS,
  DEFAULT_COOP_ROUNDS,
  DEFAULT_STRIKE_LIMIT,
  DEFAULT_TARGET_SCORE,
  SOLO_MAX_PLAYERS,
  SOLO_MIN_PLAYERS,
} from "./constants";
import {
  DEFAULT_SETUP_PREFS,
  isValidRoster,
  normalizeNames,
  parseSetupPrefs,
  toGameSettings,
} from "./setup";

const CATEGORY_IDS = ["everything", "kids", "sports"] as const;

describe("normalizeNames", () => {
  it("trims names and fills blanks with numbered defaults", () => {
    expect(normalizeNames("teams", ["  Reds ", ""])).toEqual(["Reds", "Team 2"]);
    expect(normalizeNames("solo", ["Ann", " ", "Cy"])).toEqual([
      "Ann",
      "Player 2",
      "Cy",
    ]);
  });
});

describe("isValidRoster", () => {
  it("requires exactly two teams", () => {
    expect(isValidRoster("teams", 2)).toBe(true);
    expect(isValidRoster("teams", 3)).toBe(false);
  });

  it("requires a solo player count within the supported range", () => {
    expect(isValidRoster("solo", SOLO_MIN_PLAYERS - 1)).toBe(false);
    expect(isValidRoster("solo", SOLO_MIN_PLAYERS)).toBe(true);
    expect(isValidRoster("solo", 5)).toBe(true);
    expect(isValidRoster("solo", SOLO_MAX_PLAYERS)).toBe(true);
    expect(isValidRoster("solo", SOLO_MAX_PLAYERS + 1)).toBe(false);
  });
});

describe("parseSetupPrefs", () => {
  it("returns defaults for missing or malformed data", () => {
    expect(parseSetupPrefs(null, CATEGORY_IDS)).toEqual(DEFAULT_SETUP_PREFS);
    expect(parseSetupPrefs("garbage", CATEGORY_IDS)).toEqual(DEFAULT_SETUP_PREFS);
    expect(parseSetupPrefs([1, 2], CATEGORY_IDS)).toEqual(DEFAULT_SETUP_PREFS);
  });

  it("keeps valid saved values", () => {
    const saved = {
      mode: "solo",
      teamNames: ["Reds", "Blues"],
      playerNames: ["Ann", "Bo", "Cy", "Di", "Ed"],
      categoryId: "sports",
      stealRuleEnabled: true,
      targetScore: 10,
      strikeLimit: 5,
      coopNames: ["Ann", "Bo"],
      coopRounds: 5,
    };
    expect(parseSetupPrefs(saved, CATEGORY_IDS)).toEqual(saved);
  });

  it("replaces each invalid field with its default independently", () => {
    const parsed = parseSetupPrefs(
      {
        mode: "chaos",
        teamNames: ["Reds"],
        playerNames: ["Ann", 7, "Cy"],
        categoryId: "deleted-category",
        stealRuleEnabled: "yes",
        targetScore: 999,
        strikeLimit: 3,
        coopNames: ["Solo"],
        coopRounds: 4,
      },
      CATEGORY_IDS,
    );
    expect(parsed).toEqual({ ...DEFAULT_SETUP_PREFS, strikeLimit: 3 });
  });

  it("rejects player lists outside the supported size and clamps name length", () => {
    const tooFew = parseSetupPrefs({ playerNames: ["Ann"] }, CATEGORY_IDS);
    expect(tooFew.playerNames).toEqual(DEFAULT_SETUP_PREFS.playerNames);
    const longName = "x".repeat(50);
    const clamped = parseSetupPrefs(
      { teamNames: [longName, "B"] },
      CATEGORY_IDS,
    );
    expect(clamped.teamNames[0].length).toBeLessThan(longName.length);
  });
});

describe("toGameSettings", () => {
  it("uses the points target for teams", () => {
    const settings = toGameSettings({ ...DEFAULT_SETUP_PREFS, stealRuleEnabled: true });
    expect(settings).toEqual({
      mode: "teams",
      categoryId: DEFAULT_SETUP_PREFS.categoryId,
      stealRuleEnabled: true,
      targetScore: DEFAULT_TARGET_SCORE,
    });
  });

  it("uses the strike limit and disables stealing for solo", () => {
    const settings = toGameSettings({
      ...DEFAULT_SETUP_PREFS,
      mode: "solo",
      stealRuleEnabled: true,
    });
    expect(settings.targetScore).toBe(DEFAULT_STRIKE_LIMIT);
    expect(settings.stealRuleEnabled).toBe(false);
  });
});

describe("co-op setup", () => {
  it("allows 2 to 10 co-op players", () => {
    expect(isValidRoster("coop", COOP_MIN_PLAYERS - 1)).toBe(false);
    expect(isValidRoster("coop", 2)).toBe(true);
    expect(isValidRoster("coop", COOP_MAX_PLAYERS)).toBe(true);
    expect(isValidRoster("coop", COOP_MAX_PLAYERS + 1)).toBe(false);
  });

  it("names blank co-op players by seat", () => {
    expect(normalizeNames("coop", ["", "Bo"])).toEqual(["Player 1", "Bo"]);
  });

  it("defaults to two co-op players and the standard number of bombs", () => {
    expect(DEFAULT_SETUP_PREFS.coopNames).toHaveLength(2);
    expect(DEFAULT_SETUP_PREFS.coopRounds).toBe(DEFAULT_COOP_ROUNDS);
  });

  it("restores a saved co-op mode", () => {
    expect(parseSetupPrefs({ mode: "coop" }, CATEGORY_IDS).mode).toBe("coop");
  });

  it("uses the number of bombs as the game length and disables stealing", () => {
    const settings = toGameSettings({
      ...DEFAULT_SETUP_PREFS,
      mode: "coop",
      coopRounds: 5,
      stealRuleEnabled: true,
    });
    expect(settings.targetScore).toBe(5);
    expect(settings.stealRuleEnabled).toBe(false);
  });
});
