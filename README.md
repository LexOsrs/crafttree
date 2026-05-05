# CraftTree

Interactive crafting tree visualizer for FarmRPG. Fan-made, not affiliated with FarmRPG.

Built with React 19, TypeScript, Vite, and Tailwind CSS v4. Uses [ReactFlow](https://reactflow.dev/) for the node graph. Item data and images sourced from [buddy.farm](https://buddy.farm).

## Development

```
npm install
npm run dev       # dev server
npm run build     # typecheck + production build
npm run lint      # ESLint
```

## Updating item data

Item recipes and images are fetched from the [buddy.farm](https://buddy.farm) API.

### 1. Get the current list of craftable items

Open `https://farmrpg.com/#!/craftitems.php` in your browser and run this in the console:

```js
copy(JSON.stringify(
  [...document.querySelectorAll('li[class^="level"] .item-title strong')]
    .map(s => s.textContent.trim()).filter(Boolean),
  null, 2
));
```

Paste the output into `scraped.txt` at the repo root (gitignored).

### 2. Fetch data and images

```
node scripts/fetch-items.js
```

This will:
- Fetch any names from `scraped.txt` not already in `src/data/items.json`
- Download missing images to `public/images/`
- Skip items that already exist (idempotent — safe to re-run)

## Updating tower data

`src/data/tower.ts` (which items are required at which Tower level) is generated from `tower-reqs.txt` via:

```
node scripts/gen-tower.js
```

Greedy-matches against `items.json`; logs anything unmatched so it can be added.
