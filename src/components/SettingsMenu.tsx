import { useState, useRef, useEffect } from "react";

export interface Perks {
  rs1: boolean;
  rs2: boolean;
  rs3: boolean;
}

interface SettingsMenuProps {
  perks: Perks;
  onPerksChange: (perks: Perks) => void;
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

export default function SettingsMenu({ perks, onPerksChange }: SettingsMenuProps) {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 border border-gray-600 text-gray-400 hover:text-gray-200 hover:border-gray-400 text-sm transition-colors"
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
        <div className="absolute left-0 bottom-full mb-1 w-56 bg-gray-800 border border-gray-600 rounded shadow-lg p-3 space-y-2">
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
        </div>
      )}
    </div>
  );
}
