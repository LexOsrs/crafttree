export interface Building {
  name: string;
  items: string[];
  pulsesPerHour: number; // 6 = every 10 min, 1 = hourly, 1/24 = daily
}

export const BUILDINGS: Building[] = [
  { name: "Sawmill",           items: ["Wood", "Board"],                  pulsesPerHour: 1      },
  { name: "Quarry",            items: ["Stone", "Coal"],                  pulsesPerHour: 6      },
  { name: "Steelworks",        items: ["Steel", "Steel Wire"],            pulsesPerHour: 1      },
  { name: "Hay Field",         items: ["Straw"],                          pulsesPerHour: 6      },
  { name: "Orchard",           items: ["Apple", "Lemon", "Orange"],      pulsesPerHour: 1 / 24 },
  { name: "Vineyard",          items: ["Grapes"],                         pulsesPerHour: 1 / 24 },
  { name: "Worm Habitat",      items: ["Worms", "Gummies", "Mealworms"], pulsesPerHour: 1      },
  { name: "Trout / Bait Farm", items: ["Trout", "Grubs", "Minnows"],    pulsesPerHour: 1 / 24 },
  { name: "Chicken Coop",      items: ["Feathers", "Eggs"],              pulsesPerHour: 1 / 24 },
  { name: "Cows",              items: ["Milk"],                          pulsesPerHour: 1 / 24 },
  { name: "Raptor Pen",        items: ["Antler"],                        pulsesPerHour: 1 / 24 },
];

export const ITEM_TO_BUILDING = new Map<string, Building>(
  BUILDINGS.flatMap(b => b.items.map(item => [item, b] as [string, Building]))
);

// Items treated as infinite supply when Iron Depot perk is active
export const IRON_DEPOT_ITEMS = new Set(["Iron", "Nails"]);

// Items whose pulse size is always a fixed ratio of another item's pulse
export const DERIVED_PULSES: Record<string, { from: string; ratio: number }> = {
  "Steel Wire": { from: "Steel", ratio: 1 / 3 },
};
