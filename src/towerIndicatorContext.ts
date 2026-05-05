import { createContext } from "react";

export interface TowerIndicatorRange {
  min: number;
  max: number;
}

export const TowerIndicatorContext = createContext<TowerIndicatorRange>({ min: 0, max: 0 });

export const TOWER_LEVEL_MIN = 201;
export const TOWER_LEVEL_MAX = 330;
