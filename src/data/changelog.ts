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
      "Tower indicators: toggle in Settings to highlight items required to climb the in-game Tower. Click any tower item to see its required level and mastery type",
      "Search now matches accented names — typing 'pinata' finds Piñata Whop Stick",
      "Cleaned up 73 raw fishing/material items that aren't part of any craft tree",
      "What's New panel added (this one)",
    ],
  },
];

export const LATEST_CHANGELOG_DATE = CHANGELOG[0]?.date ?? "";
