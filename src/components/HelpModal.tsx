interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-600 rounded-lg shadow-2xl w-[420px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <span className="text-sm font-medium text-gray-100">
            CraftTree — How to Use
          </span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-lg leading-none px-1"
          >
            x
          </button>
        </div>

        <div className="p-4 space-y-4 text-sm text-gray-300">
          {/* Keyboard shortcuts */}
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-1.5">
              <Row shortcut="/" desc="Focus search box" />
              <Row shortcut="?" desc="Toggle this help" />
              <Row shortcut="Esc" desc="Close search / help" />
            </div>
          </section>

          {/* Interactions */}
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
              Interactions
            </h3>
            <div className="space-y-1.5">
              <Row shortcut="Click" desc="Select a node and show its crafting summary" />
              <Row shortcut="Double-click" desc="Search for that item and show its crafting tree" />
              <Row shortcut="Drag" desc="Move nodes around" />
              <Row shortcut="Scroll" desc="Zoom in / out" />
            </div>
          </section>

          {/* Node styles */}
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
              Node Borders
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-gray-600 bg-gray-800 shrink-0" />
                <span className="text-gray-400">
                  Solid border — craftable item (has a recipe)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-dashed border-gray-700 bg-gray-900/80 shrink-0" />
                <span className="text-gray-400">
                  Dashed border — raw material (no recipe)
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg border border-amber-400 bg-gray-700 shrink-0" />
                <span className="text-gray-400">
                  Amber border — search match
                </span>
              </div>
            </div>
          </section>

          {/* Search */}
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
              Search
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Type to see autocomplete suggestions. Select an item to filter
              the graph to its full crafting tree — all ingredients above and
              all products below. The crafting panel opens automatically for
              craftable items.
            </p>
          </section>

          {/* Perks */}
          <section>
            <h3 className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">
              Perks
            </h3>
            <p className="text-gray-400 leading-relaxed">
              Click the gear icon in the bottom-left to toggle Resource Saver
              perks. Each perk gives a chance to duplicate items during
              crafting, reducing the total materials needed. The bonus
              compounds through the crafting tree. Your selection is saved
              automatically.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ shortcut, desc }: { shortcut: string; desc: string }) {
  return (
    <div className="flex items-center gap-3">
      <kbd className="min-w-[56px] text-center px-2 py-0.5 text-xs bg-gray-800 border border-gray-600 rounded text-gray-300 font-mono">
        {shortcut}
      </kbd>
      <span className="text-gray-400">{desc}</span>
    </div>
  );
}
