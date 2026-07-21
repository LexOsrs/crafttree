import type { CraftingItem, ProductionConfig } from "../types";
import { ITEM_TO_BUILDING, IRON_DEPOT_ITEMS, DERIVED_PULSES } from "../data/buildings";

export interface ProducedItem {
  itemName: string;
  ratePerHour: number; // Infinity = Iron Depot
}

export interface ProductionResult {
  ratePerHour: number;        // items/hr for the root item (Infinity = unlimited)
  maxOfflineHours: number;    // Infinity if no cap set or rate = 0
  producedItems: ProducedItem[]; // ingredients with active production, in tree order
}

interface RateInfo {
  produced: number; // from building pulse
  crafted: number;  // from recipe ingredients
  total: number;    // produced + crafted
}

function findItem(name: string, items: CraftingItem[]): CraftingItem | undefined {
  return items.find(i => i.name === name);
}

export function computeProduction(
  rootItemName: string,
  config: ProductionConfig,
  items: CraftingItem[],
  resourceSaverBonus = 0
): ProductionResult | null {
  const rateCache = new Map<string, RateInfo>();
  const multiplier = 1 + resourceSaverBonus;

  function getRateInfo(itemName: string, visiting: Set<string>): RateInfo {
    const cached = rateCache.get(itemName);
    if (cached) return cached;
    if (visiting.has(itemName)) return { produced: 0, crafted: 0, total: 0 };

    const nextVisiting = new Set(visiting).add(itemName);

    if (config.ironDepot && IRON_DEPOT_ITEMS.has(itemName)) {
      const info = { produced: Infinity, crafted: 0, total: Infinity };
      rateCache.set(itemName, info);
      return info;
    }

    const derived = DERIVED_PULSES[itemName];
    const pulseSize = derived
      ? (config.pulses[derived.from] ?? 0) * derived.ratio
      : (config.pulses[itemName] ?? 0);
    const building = ITEM_TO_BUILDING.get(itemName);
    let produced = 0;
    if (pulseSize > 0 && building) {
      const effective = config.inventoryCap > 0
        ? Math.min(pulseSize, config.inventoryCap)
        : pulseSize;
      produced = effective * building.pulsesPerHour;
    }

    const item = findItem(itemName, items);
    let crafted = 0;
    if (item && Object.keys(item.recipe).length > 0) {
      const ingRates = Object.entries(item.recipe).map(([ing, qty]) =>
        getRateInfo(ing, nextVisiting).total / (qty / multiplier)
      );
      if (ingRates.length > 0) {
        const finite = ingRates.filter(r => isFinite(r));
        crafted = finite.length > 0 ? Math.min(...finite) : Infinity;
      }
    }

    const info: RateInfo = { produced, crafted, total: produced + crafted };
    rateCache.set(itemName, info);
    return info;
  }

  const rootInfo = getRateInfo(rootItemName, new Set());
  if (rootInfo.total === 0) return null;

  // Collect all items in the tree that have active production (building pulse or Iron Depot)
  const producedItems: ProducedItem[] = [];
  const treeVisited = new Set<string>();

  function collectProduced(itemName: string) {
    if (treeVisited.has(itemName)) return;
    treeVisited.add(itemName);

    const info = rateCache.get(itemName) ?? getRateInfo(itemName, new Set());
    if (config.ironDepot && IRON_DEPOT_ITEMS.has(itemName)) {
      producedItems.push({ itemName, ratePerHour: Infinity });
    } else if ((config.pulses[itemName] ?? 0) > 0 && ITEM_TO_BUILDING.has(itemName)) {
      producedItems.push({ itemName, ratePerHour: info.produced });
    }

    const item = findItem(itemName, items);
    if (item) {
      for (const ing of Object.keys(item.recipe)) collectProduced(ing);
    }
  }

  collectProduced(rootItemName);

  const ratePerHour = rootInfo.total;
  const cap = config.inventoryCap;
  const maxOfflineHours =
    cap > 0 && isFinite(ratePerHour) && ratePerHour > 0
      ? cap / ratePerHour
      : Infinity;

  return { ratePerHour, maxOfflineHours, producedItems };
}

export function formatRate(r: number): string {
  if (!isFinite(r)) return "∞/hr";
  return `${r.toLocaleString(undefined, { maximumFractionDigits: 1 })}/hr`;
}

export function formatHours(h: number): string {
  if (!isFinite(h) || h < 0) return "—";
  if (h < 1 / 60) return "< 1 min";
  if (h < 1) return `${Math.round(h * 60)} min`;
  if (h < 24) return `${h.toFixed(1)} hrs`;
  return `${(h / 24).toFixed(1)} days`;
}
