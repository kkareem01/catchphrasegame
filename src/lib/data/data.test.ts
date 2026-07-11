import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  EVERYTHING_CATEGORY_ID,
  getCategoryChoices,
  getPhrasesForCategory,
} from "./index";

const MIN_PHRASES_PER_CATEGORY = 50;

describe("categories", () => {
  it("has at least six categories", () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(6);
  });

  it("gives every category an id, name, emoji, and enough phrases", () => {
    for (const category of CATEGORIES) {
      expect(category.id).toMatch(/^[a-z0-9-]+$/);
      expect(category.name.length).toBeGreaterThan(0);
      expect(category.emoji.length).toBeGreaterThan(0);
      expect(category.phrases.length).toBeGreaterThanOrEqual(
        MIN_PHRASES_PER_CATEGORY,
      );
    }
  });

  it("has unique category ids", () => {
    const ids = CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has no duplicate phrases within or across categories", () => {
    const all = CATEGORIES.flatMap((c) => c.phrases.map((p) => p.toLowerCase()));
    const duplicates = all.filter((p, i) => all.indexOf(p) !== i);
    expect(duplicates).toEqual([]);
  });

  it("has no empty or whitespace-padded phrases", () => {
    for (const category of CATEGORIES) {
      for (const phrase of category.phrases) {
        expect(phrase).toBe(phrase.trim());
        expect(phrase.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("getPhrasesForCategory", () => {
  it("returns a single category's phrases by id", () => {
    const first = CATEGORIES[0];
    expect(getPhrasesForCategory(first.id)).toEqual(first.phrases);
  });

  it("returns the union of all categories for the Everything id", () => {
    const everything = getPhrasesForCategory(EVERYTHING_CATEGORY_ID);
    const expectedCount = CATEGORIES.reduce((n, c) => n + c.phrases.length, 0);
    expect(everything.length).toBe(expectedCount);
  });

  it("throws a clear error for an unknown category id", () => {
    expect(() => getPhrasesForCategory("nope")).toThrow(/unknown category/i);
  });
});

describe("getCategoryChoices", () => {
  it("lists Everything first, then every category", () => {
    const choices = getCategoryChoices();
    expect(choices[0].id).toBe(EVERYTHING_CATEGORY_ID);
    expect(choices.length).toBe(CATEGORIES.length + 1);
  });
});
