"""Rank tower crafting items by difficulty. Run with: uv run --with rich tower-rank.py"""

import json
import os
import re

from rich.console import Console
from rich.table import Table
from rich.text import Text

ITEMS_JSON = "src/data/items.json"
TOWER_REQS = "tower-reqs.txt"
MASTERY_CSV = "mastery.csv"
CONFIG_JSON = "tower-config.json"
CACHED_ITEMS_DIR = os.path.expanduser("../python/crafting/items")

GM_THRESHOLD = 100_000
MM_THRESHOLD = 1_000_000

def parse_rate(spec):
    """Parse a rate like '2000 per 10m' into units/hr."""
    m = re.match(r"(\d+)\s*per\s*(\d*)\s*(m|min|hr|hour|h|day|d)", str(spec))
    if not m:
        return float(spec)  # bare number = units/hr
    amount = int(m.group(1))
    mult = int(m.group(2)) if m.group(2) else 1
    unit = m.group(3)
    if unit in ("m", "min"):
        return amount * (60 / mult)
    if unit in ("hr", "hour", "h"):
        return amount / mult
    if unit in ("day", "d"):
        return amount / (24 * mult)


with open(CONFIG_JSON) as f:
    _config = json.load(f)

FREE = set(_config["free"])
PASSIVE = {name: parse_rate(spec) for name, spec in _config["passive"].items()}
INVENTORY_LIMIT = _config.get("inventory_limit", 5_000)


def load_rarity():
    """Load best (lowest) drop rate for each item from cached buddy.farm data."""
    rarity = {}
    if not os.path.isdir(CACHED_ITEMS_DIR):
        return rarity
    for fname in os.listdir(CACHED_ITEMS_DIR):
        if not fname.endswith(".json"):
            continue
        with open(os.path.join(CACHED_ITEMS_DIR, fname)) as f:
            try:
                j = json.load(f)
                item = j["result"]["data"]["farmrpg"]["items"][0]
                name = item["name"]
                drops = item.get("dropRatesItems") or []
                if drops:
                    rarity[name] = min(d["rate"] for d in drops)
            except (KeyError, IndexError, json.JSONDecodeError):
                pass
    return rarity


def material_weight(name, rarity):
    """Weight per unit. 0 = free, higher = harder to get."""
    if name in FREE:
        return 0.0
    if name in PASSIVE:
        # Calibrated so Wood (4500/hr) ≈ 0.02
        return 90.0 / PASSIVE[name]
    rate = rarity.get(name)
    if rate is None:
        return 0.5
    if rate <= 15:
        return 0.1
    if rate <= 30:
        return 0.15
    if rate <= 50:
        return 0.3
    if rate <= 100:
        return 0.7
    if rate <= 500:
        return 2.0
    return 5.0


def analyze(name, item_map, rarity, visited=None):
    if visited is None:
        visited = set()
    if name in visited:
        return {"stages": 0, "raw": {}}
    visited.add(name)
    item = item_map.get(name)
    if not item or not item["recipe"]:
        return {"stages": 0, "raw": {name: 1}}
    raw = {}
    max_sub = 0
    for ing, qty in item["recipe"].items():
        sub = analyze(ing, item_map, rarity, visited.copy())
        max_sub = max(max_sub, sub["stages"])
        for r, q in sub["raw"].items():
            raw[r] = raw.get(r, 0) + q * qty
    return {"stages": max_sub + 1, "raw": raw}


def parse_tower_reqs(path):
    """Parse tower reqs. Returns dict: name -> {"levels": [...], "needs_gm": bool, "needs_mm": bool}."""
    tower_items = {}
    with open(path) as f:
        for line in f:
            match = re.match(r"^\s*(\d+)\s*\|(.+)", line)
            if not match:
                continue
            level = int(match.group(1))
            parts = match.group(2).split("|")

            if level <= 300:
                # 200-300: single column, all MM
                for name in parts[0].split(","):
                    name = name.strip()
                    if name:
                        entry = tower_items.setdefault(name, {"levels": [], "needs_gm": False, "needs_mm": False})
                        entry["levels"].append(level)
                        entry["needs_mm"] = True
            else:
                # 301+: first column = GM, second column = MM
                if len(parts) >= 1:
                    for name in parts[0].split(","):
                        name = name.strip()
                        if name:
                            entry = tower_items.setdefault(name, {"levels": [], "needs_gm": False, "needs_mm": False})
                            entry["levels"].append(level)
                            entry["needs_gm"] = True
                if len(parts) >= 2:
                    for name in parts[1].split(","):
                        name = name.strip()
                        if name:
                            entry = tower_items.setdefault(name, {"levels": [], "needs_gm": False, "needs_mm": False})
                            entry["levels"].append(level)
                            entry["needs_mm"] = True
    return tower_items


def load_mastery(path):
    """Load mastery CSV: name -> count."""
    mastery = {}
    if not os.path.isfile(path):
        return mastery
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            # "Item Name,12345"
            parts = line.rsplit(",", 1)
            if len(parts) == 2:
                mastery[parts[0].strip()] = int(parts[1].strip())
    return mastery


def format_progress(current, target):
    """Format progress towards a mastery target."""
    if current >= target:
        return "[bold green]DONE[/]"
    pct = current / target * 100
    remaining = target - current
    if remaining >= 1_000_000:
        rem_str = f"{remaining / 1_000_000:.1f}M"
    elif remaining >= 1_000:
        rem_str = f"{remaining / 1_000:.0f}K"
    else:
        rem_str = str(remaining)
    if pct >= 75:
        color = "green"
    elif pct >= 50:
        color = "yellow"
    elif pct >= 25:
        color = "dark_orange"
    else:
        color = "red"
    return f"[{color}]{pct:.0f}%[/] [dim]{rem_str}[/]"


def score_color(score):
    if score < 3:
        return "green"
    if score < 10:
        return "yellow"
    if score < 30:
        return "dark_orange"
    return "red"


def format_materials(raw, rarity):
    parts = []
    sorted_mats = sorted(raw.items(), key=lambda x: -x[1] * material_weight(x[0], rarity))
    for mat, qty in sorted_mats:
        w = material_weight(mat, rarity)
        if mat in FREE or mat in PASSIVE:
            parts.append(f"[dim]{qty}x {mat}[/dim]")
        elif w <= 0.1:
            parts.append(f"[green]{qty}x {mat}[/green]")
        elif w <= 0.3:
            parts.append(f"{qty}x {mat}")
        elif w <= 0.7:
            parts.append(f"[yellow]{qty}x {mat}[/yellow]")
        else:
            parts.append(f"[red]{qty}x {mat}[/red]")
    return ", ".join(parts)


def main():
    console = Console(width=160)

    # Dump config
    console.print("[bold]Free:[/]", ", ".join(sorted(FREE)))
    passive_sorted = sorted(PASSIVE.items(), key=lambda x: -x[1])
    parts = []
    for name, rate in passive_sorted:
        if rate >= 500:
            parts.append(f"{name} [dim]{rate:,.0f}/hr[/]")
        else:
            parts.append(f"{name} [dim]{rate * 24:,.0f}/day[/]")
    console.print("[bold]Passive:[/]", ", ".join(parts))
    console.print(f"[bold]Inventory limit:[/] {INVENTORY_LIMIT:,}")
    console.print()

    with open(ITEMS_JSON) as f:
        all_items = json.load(f)
    item_map = {i["name"]: i for i in all_items}

    rarity = load_rarity()
    mastery = load_mastery(MASTERY_CSV)
    tower_items = parse_tower_reqs(TOWER_REQS)

    # Analyze craftable items
    craftable = []
    raw_only = []

    for name, info_req in tower_items.items():
        item = item_map.get(name)
        has_recipe = item and bool(item["recipe"])

        if not has_recipe:
            raw_only.append((name, info_req))
            continue

        info = analyze(name, item_map, rarity)
        # Base score: weighted sum of materials per craft
        score = sum(qty * material_weight(mat, rarity) for mat, qty in info["raw"].items())
        # Batch penalty: inventory limit constrains how many you can craft at once.
        # The bottleneck material determines batch size. Smaller batches = more tedious.
        max_qty = max(info["raw"].values()) if info["raw"] else 1
        batch_size = INVENTORY_LIMIT // max(max_qty, 1)
        if batch_size < 50:
            score *= 1 + (50 - batch_size) / 50  # up to 2x penalty for batch_size=0

        passive = all(mat in FREE or mat in PASSIVE for mat in info["raw"])

        craftable.append({
            "name": name,
            "levels": info_req["levels"],
            "stages": info["stages"],
            "score": score,
            "raw": info["raw"],
            "needs_gm": info_req["needs_gm"],
            "needs_mm": info_req["needs_mm"],
            "mastery": mastery.get(name, 0),
            "passive": passive,
        })

    craftable.sort(key=lambda r: (r["score"], r["stages"]))

    # Tier boundaries
    tiers = [
        (3, "Easiest", "green", "Simple recipes, common/free materials"),
        (10, "Moderate", "yellow", "A few uncommon materials or larger quantities"),
        (30, "Harder", "dark_orange", "Bulk materials or multiple uncommon ingredients"),
        (float("inf"), "Hardest", "red", "Massive quantities or rare materials"),
    ]

    tier_idx = 0
    rank = 1

    for tier_max, tier_name, tier_color, tier_desc in tiers:
        tier_items = [r for r in craftable if r["score"] < tier_max and (tier_idx == 0 or r["score"] >= tiers[tier_idx - 1][0])]
        if not tier_items:
            tier_idx += 1
            continue

        table = Table(
            title=f"[bold {tier_color}]{tier_name}[/] — {tier_desc}",
            title_style="",
            border_style="dim",
            show_lines=False,
            pad_edge=False,
        )
        table.add_column("#", style="dim", justify="right", width=3)
        table.add_column("Item", style="bold", no_wrap=True, min_width=16)
        table.add_column("Lvl", justify="right", width=5)
        table.add_column("Stg", justify="right", width=3)
        table.add_column("Score", justify="right", width=5)
        table.add_column("GM", justify="right", no_wrap=True, width=9)
        table.add_column("MM", justify="right", no_wrap=True, width=9)
        table.add_column("Materials", ratio=1)

        for r in tier_items:
            lvl = ",".join(str(l) for l in r["levels"])
            name_str = f"{r['name']} [dim](auto)[/]" if r["passive"] else r["name"]
            sc = f"[{score_color(r['score'])}]{r['score']:.1f}[/]"
            gm = format_progress(r["mastery"], GM_THRESHOLD)
            mm = format_progress(r["mastery"], MM_THRESHOLD) if r["needs_mm"] else "[dim]—[/]"
            mats = format_materials(r["raw"], rarity)
            table.add_row(str(rank), name_str, lvl, str(r["stages"]), sc, gm, mm, mats)
            rank += 1

        console.print()
        console.print(table)
        tier_idx += 1

    # Raw materials
    raw_only.sort(key=lambda x: x[1]["levels"][0])
    console.print()
    table = Table(
        title="[bold blue]Raw Materials[/] — No recipe, just collect",
        title_style="",
        border_style="dim",
    )
    table.add_column("Level", width=6, justify="right")
    table.add_column("Item", width=26)
    table.add_column("GM", width=18, justify="right")
    table.add_column("MM", width=18, justify="right")

    for name, info_req in raw_only:
        cur = mastery.get(name, 0)
        gm = format_progress(cur, GM_THRESHOLD)
        mm = format_progress(cur, MM_THRESHOLD) if info_req["needs_mm"] else "[dim]—[/]"
        table.add_row(str(info_req["levels"][0]), name, gm, mm)

    console.print(table)
    console.print()


if __name__ == "__main__":
    main()
