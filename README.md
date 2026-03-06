# CraftTree

Interactive crafting tree visualizer for FarmRPG. Fan-made, not affiliated with FarmRPG.

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

Open the FarmRPG crafting page in your browser and run this in the console:

```js
copy(
  Array.from(document.querySelectorAll('.item-title strong'))
    .filter(el => /\(\d[\d,]*\)$/.test(el.textContent.trim()))
    .map(el => el.textContent.trim().replace(/\s*\(\d[\d,]*\)$/, ''))
    .sort()
    .join('\n')
)
```

Then merge the new items into `scripts/items.txt`:

```
uv run scripts/merge_items.py
```

Paste when prompted. This adds new items without removing existing ones (some items are seasonal and may not always appear in the crafting page).

You can also just edit `scripts/items.txt` by hand — one item per line, sorted alphabetically.

### 2. Fetch data and images

```
uv run scripts/get_items.py
```

This will:
- Fetch item data from buddy.farm for any new items (cached in `scripts/cache/items/`)
- Download missing images to `public/images/`
- Write `src/data/items.json` with all recipes

### 3. Verify

```
uv run scripts/check_data.py
```

Reports missing images, orphaned images, and recipe consistency.
