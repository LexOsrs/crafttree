import { useState, useRef, useEffect, useCallback } from "react";
import { TOWER_LEVEL_MIN, TOWER_LEVEL_MAX } from "../towerIndicatorContext";
import { BUILDINGS, DERIVED_PULSES } from "../data/buildings";
import type { ProductionConfig } from "../types";

export type { ProductionConfig };

export interface Perks {
  rs1: boolean;
  rs2: boolean;
  rs3: boolean;
  showTowerIndicators: boolean;
  towerLevelMin: number;
  towerLevelMax: number;
}

interface SettingsMenuProps {
  perks: Perks;
  onPerksChange: (perks: Perks) => void;
  productionConfig: ProductionConfig;
  onProductionChange: (config: ProductionConfig) => void;
}

const PERK_OPTIONS = [
  { key: "rs1" as const, label: "Resource Saver I", value: 0.10 },
  { key: "rs2" as const, label: "Resource Saver II", value: 0.15 },
  { key: "rs3" as const, label: "Resource Saver III", value: 0.20 },
];

export function computeBonus(perks: Perks): number {
  let bonus = 0;
  for (const opt of PERK_OPTIONS) {
    if (perks[opt.key]) bonus += opt.value;
  }
  return Math.round(bonus * 100) / 100;
}

function cadenceLabel(pph: number): string {
  if (pph >= 6) return "every 10 min";
  if (pph >= 1) return "hourly";
  return "daily";
}

function parseShorthand(value: string): number {
  const v = value.trim().toLowerCase().replace(/,/g, "");
  if (!v) return 0;
  const match = v.match(/^(\d+(?:\.\d+)?)\s*([km]?)$/);
  if (!match) return 0;
  const num = parseFloat(match[1]);
  if (match[2] === "k") return Math.round(num * 1_000);
  if (match[2] === "m") return Math.round(num * 1_000_000);
  return Math.round(num);
}

function ShorthandInput({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: number;
  onChange: (n: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState(value > 0 ? String(value) : "");
  const committedRef = useRef(value);

  useEffect(() => {
    if (value !== committedRef.current) {
      committedRef.current = value;
      setText(value > 0 ? String(value) : "");
    }
  }, [value]);

  const commit = useCallback(() => {
    const n = parseShorthand(text);
    committedRef.current = n;
    onChange(n);
    setText(n > 0 ? String(n) : "");
  }, [text, onChange]);

  return (
    <input
      type="text"
      inputMode="numeric"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
      className={className}
    />
  );
}

export default function SettingsMenu({ perks, onPerksChange, productionConfig, onProductionChange }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
  const [showProduction, setShowProduction] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const bonus = computeBonus(perks);
  const anyActive = bonus > 0;

  function setPulse(itemName: string, value: string) {
    const n = parseShorthand(value);
    const pulses = { ...productionConfig.pulses };
    if (n <= 0) {
      delete pulses[itemName];
    } else {
      pulses[itemName] = n;
    }
    onProductionChange({ ...productionConfig, pulses });
  }

  const configuredCount =
    Object.keys(productionConfig.pulses).length +
    (productionConfig.ironDepot ? 1 : 0);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-10 h-10 sm:w-8 sm:h-8 flex items-center justify-center rounded-full bg-gray-800 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 text-sm transition-colors"
        title="Settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-3.5 h-3.5"
        >
          <path
            fillRule="evenodd"
            d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 bottom-full mb-1 w-64 bg-gray-800 border border-gray-600 rounded shadow-lg p-3 space-y-2 max-h-[80vh] overflow-y-auto styled-scroll">
          {/* Perks */}
          <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">
            Perks
          </div>
          {PERK_OPTIONS.map((opt) => (
            <label
              key={opt.key}
              className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-gray-100"
            >
              <input
                type="checkbox"
                checked={perks[opt.key]}
                onChange={() =>
                  onPerksChange({ ...perks, [opt.key]: !perks[opt.key] })
                }
                className="rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
              />
              {opt.label} ({Math.round(opt.value * 100)}%)
            </label>
          ))}
          {anyActive && (
            <div className="text-[10px] text-amber-400 pt-1 border-t border-gray-700">
              Total bonus: +{Math.round(bonus * 100)}%
            </div>
          )}

          {/* Indicators */}
          <div className="text-[10px] uppercase tracking-wider text-gray-500 pt-2 mt-2 border-t border-gray-700">
            Indicators
          </div>
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-gray-100">
            <input
              type="checkbox"
              checked={perks.showTowerIndicators}
              onChange={() =>
                onPerksChange({
                  ...perks,
                  showTowerIndicators: !perks.showTowerIndicators,
                })
              }
              className="rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
            />
            Show tower items
          </label>
          <div className={`space-y-1.5 ${perks.showTowerIndicators ? "" : "opacity-40 pointer-events-none"}`}>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Levels</span>
              <span className="font-mono text-[10px]">
                {perks.towerLevelMin} – {perks.towerLevelMax}
              </span>
            </div>
            <div className="range-dual flex items-center">
              <div className="absolute inset-x-1.5 h-1 rounded-full bg-gray-700" />
              <div
                className="absolute h-1 rounded-full bg-cyan-400/60"
                style={{
                  left: `${((perks.towerLevelMin - TOWER_LEVEL_MIN) / (TOWER_LEVEL_MAX - TOWER_LEVEL_MIN)) * 100}%`,
                  right: `${100 - ((perks.towerLevelMax - TOWER_LEVEL_MIN) / (TOWER_LEVEL_MAX - TOWER_LEVEL_MIN)) * 100}%`,
                }}
              />
              <input
                type="range"
                min={TOWER_LEVEL_MIN}
                max={TOWER_LEVEL_MAX}
                value={perks.towerLevelMin}
                disabled={!perks.showTowerIndicators}
                onChange={(e) => {
                  const v = Math.min(parseInt(e.target.value), perks.towerLevelMax);
                  onPerksChange({ ...perks, towerLevelMin: v });
                }}
              />
              <input
                type="range"
                min={TOWER_LEVEL_MIN}
                max={TOWER_LEVEL_MAX}
                value={perks.towerLevelMax}
                disabled={!perks.showTowerIndicators}
                onChange={(e) => {
                  const v = Math.max(parseInt(e.target.value), perks.towerLevelMin);
                  onPerksChange({ ...perks, towerLevelMax: v });
                }}
              />
            </div>
          </div>

          {/* Production */}
          <div className="pt-2 mt-2 border-t border-gray-700">
            <button
              onClick={() => setShowProduction(p => !p)}
              className="flex items-center justify-between w-full text-[10px] uppercase tracking-wider text-gray-500 hover:text-gray-300"
            >
              <span>Production</span>
              <span className="flex items-center gap-1">
                {configuredCount > 0 && (
                  <span className="text-amber-400 normal-case tracking-normal">{configuredCount} set</span>
                )}
                <span>{showProduction ? "▲" : "▼"}</span>
              </span>
            </button>

            {showProduction && (
              <div className="mt-2 space-y-3">
                {/* Inventory cap */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-400">Inventory cap</span>
                  <ShorthandInput
                    value={productionConfig.inventoryCap}
                    onChange={(n) => onProductionChange({ ...productionConfig, inventoryCap: n })}
                    placeholder="0"
                    className="w-20 px-1.5 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-100 text-right focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Production perks */}
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-gray-100">
                  <input
                    type="checkbox"
                    checked={productionConfig.ironDepot}
                    onChange={() =>
                      onProductionChange({ ...productionConfig, ironDepot: !productionConfig.ironDepot })
                    }
                    className="rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                  />
                  Iron Depot <span className="text-gray-500">(Iron + Nails: ∞)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-300 hover:text-gray-100">
                  <input
                    type="checkbox"
                    checked={productionConfig.antlerSnare ?? false}
                    onChange={() =>
                      onProductionChange({ ...productionConfig, antlerSnare: !productionConfig.antlerSnare })
                    }
                    className="rounded border-gray-600 bg-gray-700 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                  />
                  Antler Snare <span className="text-gray-500">(+10% antlers)</span>
                </label>

                {/* Buildings */}
                {BUILDINGS.map((building) => (
                  <div key={building.name}>
                    <div className="text-[10px] text-gray-500 mb-1">
                      {building.name} · <span className="text-gray-600">{cadenceLabel(building.pulsesPerHour)}</span>
                    </div>
                    <div className="space-y-1">
                      {building.items.map((itemName) => {
                        const derivedFrom = DERIVED_PULSES[itemName];
                        if (derivedFrom) {
                          const sourcePulse = productionConfig.pulses[derivedFrom.from] ?? 0;
                          const derivedValue = Math.floor(sourcePulse * derivedFrom.ratio);
                          return (
                            <div key={itemName} className="flex items-center gap-2 pl-2">
                              <span className="text-xs text-gray-400 truncate flex-1">{itemName}</span>
                              <span className="text-xs text-gray-600 font-mono">
                                {derivedValue > 0 ? `= ${derivedValue.toLocaleString()}` : `= ${derivedFrom.from} ÷ ${Math.round(1 / derivedFrom.ratio)}`}
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div key={itemName} className="flex items-center gap-2 pl-2">
                            <span className="text-xs text-gray-400 truncate flex-1">{itemName}</span>
                            <ShorthandInput
                              value={productionConfig.pulses[itemName] ?? 0}
                              onChange={(n) => setPulse(itemName, String(n))}
                              placeholder="0"
                              className="w-20 px-1.5 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-gray-100 text-right focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
