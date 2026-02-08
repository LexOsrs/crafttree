import { useState, useCallback, useEffect, useRef } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import items from "./data/items.json";
import type { CraftingItem } from "./types";
import CraftingGraph from "./components/CraftingGraph";
import SearchBar from "./components/SearchBar";
import type { SearchBarHandle } from "./components/SearchBar";
import CraftingPanel from "./components/CraftingPanel";
import HelpModal from "./components/HelpModal";
import SettingsMenu, { computeBonus } from "./components/SettingsMenu";
import type { Perks } from "./components/SettingsMenu";

const craftingItems = items as unknown as CraftingItem[];
const itemNames = craftingItems.map((i) => i.name).sort();

function getHashQuery(): string {
  const hash = window.location.hash.slice(1);
  return hash ? decodeURIComponent(hash) : "";
}

const PERKS_KEY = "crafttree-perks";
const DEFAULT_PERKS: Perks = { rs1: false, rs2: false, rs3: false };

function loadPerks(): Perks {
  try {
    const stored = localStorage.getItem(PERKS_KEY);
    if (stored) return { ...DEFAULT_PERKS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_PERKS;
}

export default function App() {
  const [searchQuery, setSearchQuery] = useState(getHashQuery);
  const [panelItem, setPanelItem] = useState<string | null>(null);
  const [craftCount, setCraftCount] = useState(1);
  const [showHelp, setShowHelp] = useState(false);
  const [perks, setPerks] = useState<Perks>(loadPerks);
  const searchRef = useRef<SearchBarHandle>(null);

  const resourceSaverBonus = computeBonus(perks);

  const handlePerksChange = useCallback((newPerks: Perks) => {
    setPerks(newPerks);
    localStorage.setItem(PERKS_KEY, JSON.stringify(newPerks));
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
      } else if (e.key === "Escape" && showHelp) {
        setShowHelp(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [showHelp]);

  return (
    <div className="w-full h-screen relative">
      <ReactFlowProvider>
        <SearchBar
          ref={searchRef}
          query={searchQuery}
          onQueryChange={setSearchQuery}
          itemNames={itemNames}
        >
          <SettingsMenu perks={perks} onPerksChange={handlePerksChange} />
        </SearchBar>
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
          />
        )}
      </ReactFlowProvider>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
      <button
        onClick={() => setShowHelp(true)}
        className="absolute bottom-4 left-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 text-sm font-mono transition-colors"
      >
        ?
      </button>
    </div>
  );
}
