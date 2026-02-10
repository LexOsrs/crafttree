import { useMemo } from "react";
import type { CraftingItem } from "../types";
import { calculateCrafting } from "../utils/craftingCalculator";

interface CraftingPanelProps {
  itemName: string;
  count: number;
  onCountChange: (count: number) => void;
  onClose: () => void;
  onNavigate: (name: string) => void;
  items: CraftingItem[];
  resourceSaverBonus?: number;
}

function toId(name: string, items: CraftingItem[]): string {
  const item = items.find((i) => i.name === name);
  return item?.id ?? name.toLowerCase().replace(/[' ]/g, "-").replace(/--+/g, "-");
}

export default function CraftingPanel({
  itemName,
  count,
  onCountChange,
  onClose,
  onNavigate,
  items,
  resourceSaverBonus = 0,
}: CraftingPanelProps) {
  const summary = useMemo(
    () => calculateCrafting(itemName, count, items, resourceSaverBonus),
    [itemName, count, items, resourceSaverBonus]
  );

  const itemId = toId(itemName, items);
  const hasSteps = summary.steps.length > 0;

  return (
    <div className="absolute inset-x-0 bottom-0 max-h-[50vh] sm:max-h-none sm:inset-x-auto sm:right-0 sm:top-0 sm:bottom-0 sm:w-80 z-20 bg-gray-900/95 backdrop-blur border-t sm:border-t-0 sm:border-l border-gray-700 flex flex-col">
      {/* Drag handle (mobile) */}
      <div className="sm:hidden flex justify-center py-1.5">
        <div className="w-10 h-1 rounded-full bg-gray-600" />
      </div>
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-700">
        <img
          src={`/images/${itemId}.png`}
          alt={itemName}
          className="w-10 h-10 object-contain"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-100 truncate">
            {itemName}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-400">Make</span>
            <input
              type="number"
              min={1}
              value={count}
              onFocus={(e) => { const t = e.target; requestAnimationFrame(() => t.select()); }}
              onChange={(e) =>
                onCountChange(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="w-16 px-1.5 py-0.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-100 text-center focus:outline-none focus:border-amber-500"
            />
            {resourceSaverBonus > 0 && summary.steps.length > 0 && (
              <span className="text-[10px] text-amber-400">
                Resource Saver: {Math.round(resourceSaverBonus * 100)}%
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 text-lg leading-none px-1"
        >
          x
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Crafting Steps */}
        {hasSteps && (
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
              Crafting Steps
            </div>
            <div className="space-y-2">
              {summary.steps.map((step, i) => {
                const isTarget = step.name === itemName;
                return (
                <div
                  key={step.name}
                  className={`rounded p-2 border ${
                    isTarget
                      ? "bg-gray-800 border-amber-500/50"
                      : "bg-gray-800/60 border-gray-700/50"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] text-gray-500 w-4">
                      {i + 1}.
                    </span>
                    <img
                      src={`/images/${step.id}.png`}
                      alt={step.name}
                      className="w-5 h-5 object-contain"
                      onError={(e) => { e.currentTarget.style.display = "none"; }}
                    />
                    <button
                      onClick={() => onNavigate(step.name)}
                      className="text-xs text-gray-100 font-medium hover:text-amber-400 transition-colors text-left"
                    >
                      {step.quantity.toLocaleString()}x {step.name}
                    </button>
                  </div>
                  <div className="ml-6 flex flex-wrap gap-x-3 gap-y-0.5">
                    {step.ingredients.map((ing) => (
                      <button
                        key={ing.name}
                        onClick={() => onNavigate(ing.name)}
                        className="text-[10px] text-gray-400 hover:text-amber-400 transition-colors"
                      >
                        {ing.quantity.toLocaleString()} {ing.name}
                      </button>
                    ))}
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        )}

        {/* Raw Materials */}
        <div className="p-3">
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
            Raw Materials
          </div>
          <div className="space-y-1">
            {summary.rawMaterials.map((mat) => (
              <button
                key={mat.name}
                onClick={() => onNavigate(mat.name)}
                className="flex items-center gap-2 py-0.5 w-full text-left hover:bg-gray-800/50 rounded px-1 -mx-1 transition-colors group"
              >
                <img
                  src={`/images/${mat.id}.png`}
                  alt={mat.name}
                  className="w-5 h-5 object-contain"
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                />
                <span className="text-xs text-gray-300 flex-1 group-hover:text-amber-400 transition-colors">
                  {mat.name}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  {mat.quantity.toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
