import type { CraftingItem } from "../types";

export interface CraftingStep {
  name: string;
  id: string;
  quantity: number;
  ingredients: { name: string; quantity: number }[];
}

export interface CraftingSummary {
  steps: CraftingStep[];
  rawMaterials: { name: string; id: string; quantity: number }[];
}

export function calculateCrafting(
  targetName: string,
  count: number,
  items: CraftingItem[]
): CraftingSummary {
  const itemMap = new Map(items.map((i) => [i.name, i]));

  function toId(name: string): string {
    const item = itemMap.get(name);
    return item?.id ?? name.toLowerCase().replace(/[' ]/g, "-").replace(/--+/g, "-");
  }

  const steps: CraftingStep[] = [];
  const rawTotals = new Map<string, number>();
  const visited = new Set<string>();

  // Track total quantities needed for each craftable item
  const craftTotals = new Map<string, number>();

  function resolve(name: string, qty: number) {
    const item = itemMap.get(name);
    const hasRecipe = item && Object.keys(item.recipe).length > 0;

    if (!hasRecipe) {
      rawTotals.set(name, (rawTotals.get(name) ?? 0) + qty);
      return;
    }

    craftTotals.set(name, (craftTotals.get(name) ?? 0) + qty);

    // Resolve ingredients depth-first (dependencies before dependents)
    for (const [ingName, ingQty] of Object.entries(item!.recipe)) {
      resolve(ingName, ingQty * qty);
    }

    // Add step only once (we accumulate totals in craftTotals)
    if (!visited.has(name)) {
      visited.add(name);
    }
  }

  resolve(targetName, count);

  // Build steps in dependency order (items with no craftable deps first)
  // by doing a topological sort
  const ordered: string[] = [];
  const tempVisited = new Set<string>();

  function topoSort(name: string) {
    if (tempVisited.has(name)) return;
    tempVisited.add(name);
    const item = itemMap.get(name);
    if (!item || Object.keys(item.recipe).length === 0) return;
    if (!craftTotals.has(name)) return;

    for (const ingName of Object.keys(item.recipe)) {
      topoSort(ingName);
    }
    ordered.push(name);
  }

  topoSort(targetName);

  for (const name of ordered) {
    const item = itemMap.get(name)!;
    const totalQty = craftTotals.get(name) ?? 0;
    steps.push({
      name,
      id: toId(name),
      quantity: totalQty,
      ingredients: Object.entries(item.recipe).map(([ingName, ingQty]) => ({
        name: ingName,
        quantity: ingQty * totalQty,
      })),
    });
  }

  const rawMaterials = Array.from(rawTotals.entries())
    .map(([name, quantity]) => ({ name, id: toId(name), quantity }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { steps, rawMaterials };
}
