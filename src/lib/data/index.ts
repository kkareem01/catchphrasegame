import type { Category } from "@/lib/game/types";
import { animals } from "./categories/animals";
import { entertainment } from "./categories/entertainment";
import { everydayLife } from "./categories/everyday-life";
import { foodDrink } from "./categories/food-drink";
import { kids } from "./categories/kids";
import { popCulture } from "./categories/pop-culture";
import { sports } from "./categories/sports";

export const CATEGORIES: readonly Category[] = [
  kids,
  everydayLife,
  entertainment,
  foodDrink,
  sports,
  animals,
  popCulture,
];

/** Pseudo-category id that mixes every category's phrases together. */
export const EVERYTHING_CATEGORY_ID = "everything";

const EVERYTHING_CHOICE: Readonly<{ id: string; name: string; emoji: string }> = {
  id: EVERYTHING_CATEGORY_ID,
  name: "Everything",
  emoji: "🎲",
};

export const getPhrasesForCategory = (
  categoryId: string,
): readonly string[] => {
  if (categoryId === EVERYTHING_CATEGORY_ID) {
    return CATEGORIES.filter((c) => !c.excludeFromMix).flatMap(
      (c) => c.phrases,
    );
  }
  const category = CATEGORIES.find((c) => c.id === categoryId);
  if (!category) {
    throw new Error(`Unknown category id: "${categoryId}"`);
  }
  return category.phrases;
};

/** Category picker choices: Everything first, then each real category. */
export const getCategoryChoices = (): readonly Readonly<{
  id: string;
  name: string;
  emoji: string;
}>[] => [
  EVERYTHING_CHOICE,
  ...CATEGORIES.map(({ id, name, emoji }) => ({ id, name, emoji })),
];
