import { createContext } from "react";
import { TOWER_REQUIREMENTS } from "./data/tower";

export interface TowerIndicatorRange {
  min: number;
  max: number;
}

export const TowerIndicatorContext = createContext<TowerIndicatorRange>({ min: 0, max: 0 });

const levels = Object.values(TOWER_REQUIREMENTS).map((r) => r.level);
export const TOWER_LEVEL_MIN = Math.min(...levels);
export const TOWER_LEVEL_MAX = Math.max(...levels);
