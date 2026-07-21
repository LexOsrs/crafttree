export interface CraftingItem {
  name: string;
  id: string;
  recipe: Record<string, number>;
}

export interface ProductionConfig {
  pulses: Record<string, number>; // item name → pulse size per tick (user-entered)
  inventoryCap: number;           // 0 = unconfigured (skip cap clamping and offline calc)
  ironDepot: boolean;             // Iron + Nails treated as infinite supply
}
