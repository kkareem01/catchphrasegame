"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { createInitialState, gameReducer } from "@/lib/game/reducer";
import type { GameEvent, GameState } from "@/lib/game/types";

type GameContextValue = Readonly<{
  state: GameState;
  dispatch: Dispatch<GameEvent>;
}>;

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(
    (s: GameState, e: GameEvent) => gameReducer(s, e),
    undefined,
    createInitialState,
  );
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameContextValue {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used inside a <GameProvider>");
  }
  return context;
}
