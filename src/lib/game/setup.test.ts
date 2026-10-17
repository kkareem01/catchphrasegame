import { describe, expect, it } from "vitest";
import { DEFAULT_TARGET_SCORE, MAX_PLAYERS_PER_TEAM } from "./constants";
import {
  DEFAULT_SETUP_PREFS,
  normalizeNames,
  normalizeRosters,
  parseSetupPrefs,
  toGameSettings,
} from "./setup";

const CATEGORY_IDS = ["everything", "kids", "sports"] as const;

describe("normalizeNames", () => {
  it("trims team names and fills blanks with numbered defaults", () => {
    expect(normalizeNames(["  Reds ", ""])).toEqual(["Reds", "Team 2"]);
  });
});

describe("normalizeRosters", () => {
  it("trims player names and drops blank rows", () => {
    expect(normalizeRosters([[" Ann ", "", "Cy"], ["  "]])).toEqual([["Ann", "Cy"], []]);
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
      teamNames: ["Reds", "Blues"],
      teamPlayers: [["Ann", "Cy", "Eve"], ["Bo", "Di"]],
      categoryId: "sports",
      stealRuleEnabled: true,
      targetScore: 10,
    };
    expect(parseSetupPrefs(saved, CATEGORY_IDS)).toEqual(saved);
  });

  it("replaces each invalid field with its default independently", () => {
    const parsed = parseSetupPrefs(
      {
        teamNames: ["Reds"],
        teamPlayers: [["Ann"], [7]],
        categoryId: "deleted-category",
        stealRuleEnabled: "yes",
        targetScore: 10,
      },
      CATEGORY_IDS,
    );
    expect(parsed).toEqual({ ...DEFAULT_SETUP_PREFS, targetScore: 10 });
  });

  it("ignores fields from older versions (e.g. free-for-all)", () => {
    const parsed = parseSetupPrefs(
      { mode: "solo", playerNames: ["Ann", "Bo", "Cy"], strikeLimit: 3 },
      CATEGORY_IDS,
    );
    expect(parsed).toEqual(DEFAULT_SETUP_PREFS);
  });

  it("rejects oversized rosters and clamps name length", () => {
    const tooMany = Array.from({ length: MAX_PLAYERS_PER_TEAM + 1 }, () => "x");
    expect(
      parseSetupPrefs({ teamPlayers: [tooMany, []] }, CATEGORY_IDS).teamPlayers,
    ).toEqual(DEFAULT_SETUP_PREFS.teamPlayers);
    const longName = "x".repeat(50);
    const clamped = parseSetupPrefs({ teamNames: [longName, "B"] }, CATEGORY_IDS);
    expect(clamped.teamNames[0].length).toBeLessThan(longName.length);
  });
});

describe("toGameSettings", () => {
  it("carries over category, steal rule and points to win", () => {
    expect(toGameSettings({ ...DEFAULT_SETUP_PREFS, stealRuleEnabled: true })).toEqual({
      categoryId: DEFAULT_SETUP_PREFS.categoryId,
      stealRuleEnabled: true,
      targetScore: DEFAULT_TARGET_SCORE,
    });
  });
});
