// Fetches missing items from buddy.farm into src/data/items.json,
// downloading images into public/images/. Reads names from scraped.txt
// (a JSON array). Existing items are not refetched.
//
// Usage: node scripts/fetch-items.js

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NAMES_FILE = path.join(ROOT, 'scraped.txt');
const ITEMS_FILE = path.join(ROOT, 'src/data/items.json');
const IMG_DIR = path.join(ROOT, 'public/images');

const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exists = (p) => fs.access(p).then(() => true, () => false);

async function fetchItem(id) {
  const res = await fetch(`https://buddy.farm/page-data/i/${id}/page-data.json`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()).result.data.farmrpg.items[0];
}

async function fetchImage(imgPath, id) {
  const dest = path.join(IMG_DIR, `${id}.png`);
  if (await exists(dest)) return;
  const res = await fetch(`https://farmrpg.com/img/items/${path.basename(imgPath)}`);
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

const names = JSON.parse(await fs.readFile(NAMES_FILE, 'utf8'));
const items = JSON.parse(await fs.readFile(ITEMS_FILE, 'utf8'));
const byName = new Map(items.map((i) => [i.name, i]));

let added = 0;
for (const name of names) {
  if (byName.has(name)) continue;
  const id = slug(name);
  process.stdout.write(`+ ${name} (${id})… `);
  try {
    const data = await fetchItem(id);
    const recipe = Object.fromEntries(
      data.recipeItems.map((r) => [r.item.name, r.quantity])
    );
    byName.set(name, { name, id, recipe });
    await fetchImage(data.image, id);
    for (const comp of Object.keys(recipe)) {
      const cid = slug(comp);
      if (await exists(path.join(IMG_DIR, `${cid}.png`))) continue;
      try {
        const cdata = await fetchItem(cid);
        await fetchImage(cdata.image, cid);
        await sleep(500);
      } catch {}
    }
    added++;
    console.log('ok');
    await sleep(500);
  } catch (e) {
    console.log(`fail: ${e.message}`);
  }
}

const out = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
await fs.writeFile(ITEMS_FILE, JSON.stringify(out, null, 4) + '\n');
console.log(`\nadded ${added}, total ${out.length}`);
