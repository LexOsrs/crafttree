# CraftTree

Interactive crafting tree visualizer for FarmRPG. Fan-made, not affiliated with FarmRPG.

## Stack

- React 19 + TypeScript, Vite, Tailwind CSS v4
- @xyflow/react (ReactFlow) for the node graph
- No router, no state library — single-page app with URL hash for search state

## Commands

- `npm run dev` — dev server
- `npm run build` — typecheck + production build (`tsc -b && vite build`)
- `npm run lint` — ESLint

## Architecture

```
src/
  App.tsx              — root: state, keyboard shortcuts, layout
  types.ts             — CraftingItem { name, id, recipe }
  data/items.json      — all items + recipes (generated externally)
  components/
    CraftingGraph.tsx  — ReactFlow wrapper: filtering, highlighting, click/double-click
    ItemNode.tsx       — custom node: 80x80px, image + label, border styles for state
    CraftingPanel.tsx  — right sidebar (desktop) / bottom sheet (mobile): crafting steps + raw materials
    SearchBar.tsx      — autocomplete search with / shortcut
    HelpModal.tsx      — keyboard shortcuts + interaction guide
    SettingsMenu.tsx   — Resource Saver perk toggles (persisted to localStorage)
  utils/
    graphBuilder.ts    — builds nodes+edges from items, hierarchical layout with barycenter ordering
    craftingCalculator.ts — topological-sort material calculator with resource saver bonus
```

## Key patterns

- **Mobile responsive** at `sm:` (640px) breakpoint. Below = phone, above = desktop. All responsive via Tailwind prefixes, no JS breakpoint detection.
- **CraftingPanel** is `absolute bottom-0 inset-x-0 max-h-[50vh]` on mobile, `absolute right-0 top-0 bottom-0 w-80` on desktop.
- **Search** filters graph to connected subtree (walks edges both directions from exact match). URL hash syncs with search query.
- **Click** a node = select + show panel. **Double-click** = search for that item. `zoomOnDoubleClick={false}` on ReactFlow so double-tap works on mobile.
- **Node highlighting**: clicking a node highlights its connected subgraph and dims the rest.
- **Crafting calculator** does topological sort, applies Resource Saver bonus (compounds through the tree).
- Numbers displayed with `toLocaleString()` for comma formatting.

## Style conventions

- Tailwind utility classes, no CSS modules or styled-components
- Dark theme: gray-900 backgrounds, gray-100/400 text, amber-400/500 accents
- Text sizes: `text-sm` for primary, `text-xs` for secondary, `text-[10px]` for labels/hints
- `100dvh` for viewport height (iOS Safari fix)
