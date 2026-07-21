import { useState, useCallback, useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import items from "./data/items.json";
import type { CraftingItem, ProductionConfig } from "./types";
import CraftingGraph from "./components/CraftingGraph";
import SearchBar from "./components/SearchBar";
import type { SearchBarHandle } from "./components/SearchBar";
import CraftingPanel from "./components/CraftingPanel";
import HelpModal from "./components/HelpModal";
import WhatsNewModal from "./components/WhatsNewModal";
import SettingsMenu, { computeBonus } from "./components/SettingsMenu";
import type { Perks } from "./components/SettingsMenu";
import { LATEST_CHANGELOG_DATE } from "./data/changelog";
import { TowerIndicatorContext, TOWER_LEVEL_MIN, TOWER_LEVEL_MAX } from "./towerIndicatorContext";

const craftingItems = items as unknown as CraftingItem[];
const itemNames = (() => {
  const names = new Set(craftingItems.map((i) => i.name));
  for (const item of craftingItems) {
    for (const ingredient of Object.keys(item.recipe)) names.add(ingredient);
  }
  return [...names].sort();
})();

function getHashQuery(): string {
  const hash = window.location.hash.slice(1);
  return hash ? decodeURIComponent(hash) : "";
}

const PERKS_KEY = "crafttree-perks";
const PRODUCTION_KEY = "crafttree-production";
const CHANGELOG_SEEN_KEY = "crafttree-changelog-seen";
const DEFAULT_PERKS: Perks = {
  rs1: false,
  rs2: false,
  rs3: false,
  showTowerIndicators: false,
  towerLevelMin: TOWER_LEVEL_MIN,
  towerLevelMax: TOWER_LEVEL_MAX,
};

function loadPerks(): Perks {
  try {
    const stored = localStorage.getItem(PERKS_KEY);
    if (stored) return { ...DEFAULT_PERKS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PERKS;
}

function loadChangelogSeen(): string {
  try {
    return localStorage.getItem(CHANGELOG_SEEN_KEY) ?? "";
  } catch {
    return "";
  }
}

const DEFAULT_PRODUCTION: ProductionConfig = { pulses: {}, inventoryCap: 0, ironDepot: false, antlerSnare: false };

function loadProduction(): ProductionConfig {
  try {
    const stored = localStorage.getItem(PRODUCTION_KEY);
    if (stored) return { ...DEFAULT_PRODUCTION, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PRODUCTION;
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState(getHashQuery);
  const [panelItem, setPanelItem] = useState<string | null>(null);
  const [craftCount, setCraftCount] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [showWhatsNew, setShowWhatsNew] = useState(false);
  const [changelogSeen, setChangelogSeen] = useState<string>(loadChangelogSeen);
  const [perks, setPerks] = useState<Perks>(loadPerks);
  const [productionConfig, setProductionConfig] = useState<ProductionConfig>(loadProduction);
  const hasUnseenChangelog = changelogSeen < LATEST_CHANGELOG_DATE;

  const openWhatsNew = useCallback(() => {
    setShowWhatsNew(true);
    if (LATEST_CHANGELOG_DATE && changelogSeen !== LATEST_CHANGELOG_DATE) {
      setChangelogSeen(LATEST_CHANGELOG_DATE);
      try {
        localStorage.setItem(CHANGELOG_SEEN_KEY, LATEST_CHANGELOG_DATE);
      } catch {}
    }
  }, [changelogSeen]);
  const searchRef = useRef<SearchBarHandle>(null);

  const resourceSaverBonus = computeBonus(perks);

  const handlePerksChange = useCallback((newPerks: Perks) => {
    setPerks(newPerks);
    localStorage.setItem(PERKS_KEY, JSON.stringify(newPerks));
  }, []);

  const handleProductionChange = useCallback((config: ProductionConfig) => {
    setProductionConfig(config);
    localStorage.setItem(PRODUCTION_KEY, JSON.stringify(config));
  }, []);

  const handleNodeSelect = useCallback((name: string | null) => {
    setPanelItem(name);
    if (name) setCraftCount(1);
  }, []);

  const handleNavigate = useCallback((name: string) => {
    setSearchQuery(name);
    setCraftCount(1);
  }, []);

  // Sync search query to URL hash
  useEffect(() => {
    const hash = searchQuery ? `#${encodeURIComponent(searchQuery)}` : "";
    if (window.location.hash !== hash) {
      window.history.replaceState(null, "", hash || window.location.pathname);
    }
  }, [searchQuery]);

  // Listen for browser back/forward
  useEffect(() => {
    function onHashChange() {
      setSearchQuery(getHashQuery());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Auto-open panel when search exactly matches a craftable item
  useEffect(() => {
    if (!searchQuery.trim()) return;
    const match = craftingItems.find(
      (i) => i.name.toLowerCase() === searchQuery.toLowerCase() && Object.keys(i.recipe).length > 0
    );
    if (match) {
      setPanelItem(match.name);
      setCraftCount(1);
    } else {
      setPanelItem(null);
    }
  }, [searchQuery]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === "?" && !isInput) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      } else if (e.key === "Escape") {
        if (showHelp) setShowHelp(false);
        if (showWhatsNew) setShowWhatsNew(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showHelp, showWhatsNew]);

  return (
    <div className="w-full h-dvh relative">
      <TowerIndicatorContext.Provider
        value={{
          min: perks.showTowerIndicators ? perks.towerLevelMin : 0,
          max: perks.showTowerIndicators ? perks.towerLevelMax : 0,
        }}
      >
      <ReactFlowProvider>
        <SearchBar
          ref={searchRef}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          itemNames={itemNames}
        />
        <CraftingGraph
          items={craftingItems}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onNodeSelect={handleNodeSelect}
        />
        {panelItem && (
          <CraftingPanel
            itemName={panelItem}
            count={craftCount}
            onCountChange={setCraftCount}
            onClose={() => setPanelItem(null)}
            onNavigate={handleNavigate}
            items={craftingItems}
            resourceSaverBonus={resourceSaverBonus}
            productionConfig={productionConfig}
          />
        )}
      </ReactFlowProvider>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      {showWhatsNew && <WhatsNewModal onClose={() => setShowWhatsNew(false)} />}
      <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
        <SettingsMenu
          perks={perks}
          onPerksChange={handlePerksChange}
          productionConfig={productionConfig}
          onProductionChange={handleProductionChange}
        />
        <button
          onClick={openWhatsNew}
          title="What's new"
          className="relative w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-800 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 text-sm font-mono transition-colors"
        >
          !
          {hasUnseenChangelog && (
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-gray-900" />
          )}
        </button>
        <button
          onClick={() => setShowHelp(true)}
          title="Help"
          className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-800 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 text-sm font-mono transition-colors"
        >
          ?
        </button>
      </div>
      </TowerIndicatorContext.Provider>
    </div>
  );
}
