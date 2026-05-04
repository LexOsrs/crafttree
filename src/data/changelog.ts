export interface ChangelogEntry {
  date: string;
  changes: string[];
}

// Most recent first. Date is YYYY-MM-DD.
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-05-04",
    changes: [
      "Added 45 new craftable items, including bamboo furniture, dyed clothing, and gold gemstone rings",
      "Tower indicators: each tower item now shows its required level in cyan (Mega Mastery) or violet (Grand Mastery). Use the level range slider in Settings to filter to the levels you care about",
      "Search now matches accented names — typing 'pinata' finds Piñata Whop Stick",
      "Cleaned up 73 raw fishing/material items that aren't part of any craft tree",
      "What's New panel added (this one)",
    ],
  },
];

export const LATEST_CHANGELOG_DATE = CHANGELOG[0]?.date ?? "";
