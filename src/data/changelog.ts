export interface ChangelogEntry {
  date: string;
  changes: string[];
}

// Most recent first. Date is YYYY-MM-DD.
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-06-13",
    changes: [
      "Tower levels 331–340 added, including new items Runestone 04 and Seaweed",
      "Tower level range slider now updates automatically when new levels are added",
    ],
  },
  {
    date: "2026-06-04",
    changes: ["New craftable: Valve"],
  },
  {
    date: "2026-05-07",
    changes: [
      "Search now also finds ingredient-only items like Spider that don't have a recipe of their own",
    ],
  },
  {
    date: "2026-05-05",
    changes: [
      "Tower indicators: each tower item now shows its required level in cyan (Mega Mastery) or violet (Grand Mastery). Use the level range slider in Settings to filter to the levels you care about",
      "What's New panel — you're looking at it",
      "Feedback link in the help menu — message me on Discord with bugs or ideas",
      "Search now matches accented names — typing 'pinata' finds Piñata Whop Stick",
      "New craftables: Blue Milk, Jade, Milk Carton, Piñata Whop Stick",
      "Removed retired event items (Green Top Hat, Shamrock Milk) since they can't be crafted any more",
    ],
  },
];

export const LATEST_CHANGELOG_DATE = CHANGELOG[0]?.date ?? "";
