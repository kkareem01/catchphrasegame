"use client";

import { useSyncExternalStore } from "react";
import { createHighScoreStore, highScoreKey } from "@/lib/storage/highScoreStore";

const store = createHighScoreStore(() => window.localStorage);

/** Best co-op total for this category and bomb count (0 if none yet). */
export function useHighScore(categoryId: string, rounds: number): number {
  const records = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );
  return store.getBest(records, highScoreKey(categoryId, rounds));
}

/** Raises the record if `score` beats it. Safe to call more than once. */
export const saveHighScore = (categoryId: string, rounds: number, score: number): void =>
  store.saveBest(highScoreKey(categoryId, rounds), score);
