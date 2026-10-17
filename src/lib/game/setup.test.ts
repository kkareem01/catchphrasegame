import { describe, expect, it } from "vitest";
import { DEFAULT_TARGET_SCORE } from "./constants";
import {
  DEFAULT_SETUP_PREFS,
  normalizeNames,
  parseSetupPrefs,
  toGameSettings,
} from "./setup";

const CATEGORY_IDS = ["everything", "kids", "sports"] as const;

describe("normalizeNames", () => {
  it("trims team names and fills blanks with numbered defaults", () => {
    expect(normalizeNames(["  Reds ", ""])).toEqual(["Reds", "Team 2"]);
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
        categoryId: "deleted-category",
        stealRuleEnabled: "yes",
        targetScore: 10,
      },
      CATEGORY_IDS,
    );
    expect(parsed).toEqual({ ...DEFAULT_SETUP_PREFS, targetScore: 10 });
  });

  it("ignores fields from older versions (free-for-all, player rosters)", () => {
    const parsed = parseSetupPrefs(
      {
        mode: "solo",
        playerNames: ["Ann", "Bo", "Cy"],
        strikeLimit: 3,
        teamPlayers: [["Ann", "Cy"], ["Bo"]],
      },
      CATEGORY_IDS,
    );
    expect(parsed).toEqual(DEFAULT_SETUP_PREFS);
  });

  it("clamps name length", () => {
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
