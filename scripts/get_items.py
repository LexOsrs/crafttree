"""
Fetch item data and images from buddy.farm API.
Run with: uv run scripts/get_items.py

Caches JSON responses in scripts/cache/items/ and images in public/images/.
Outputs src/data/items.json with all recipes.
"""
# /// script
# requires-python = ">=3.11"
# dependencies = ["requests", "pydantic"]
# ///

import json
import pathlib
import time
from typing import Any

import requests
from pydantic import BaseModel

SCRIPTS_DIR = pathlib.Path(__file__).parent.resolve()
ROOT = SCRIPTS_DIR.parent
CACHE_DIR = SCRIPTS_DIR / "cache" / "items"
IMAGES_DIR = ROOT / "public" / "images"
ITEMS_LIST = SCRIPTS_DIR / "items.txt"
OUTPUT_FILE = ROOT / "src" / "data" / "items.json"


class Item(BaseModel):
    name: str
    id: str
    recipe: dict[str, int] = {}


def sanitise_item_name(item_name: str) -> str:
    return item_name.lower().replace(" ", "-").replace("'", "-")


def get_item_data(sanitised_name: str) -> dict[str, Any]:
    dest_path = CACHE_DIR / f"{sanitised_name}.json"

    if dest_path.exists():
        with dest_path.open() as f:
            return json.load(f)

    print(f"Fetching data for {sanitised_name}...")
    url = f"https://buddy.farm/page-data/i/{sanitised_name}/page-data.json"
    item_data = requests.get(url=url).json()

    dest_path.parent.mkdir(parents=True, exist_ok=True)
    with dest_path.open("w") as f:
        json.dump(item_data, f, indent=4)

    time.sleep(1)
    return item_data


def download_image(item_data: dict, sanitised_name: str) -> None:
    image_path = IMAGES_DIR / f"{sanitised_name}.png"

    if image_path.exists():
        return

    img_path = pathlib.Path(
        item_data["result"]["data"]["farmrpg"]["items"][0]["image"]
    ).name

    print(f"Downloading image for {sanitised_name}...")
    url = f"https://farmrpg.com/img/items/{img_path}"

    with requests.get(url=url, stream=True) as r:
        r.raise_for_status()
        with image_path.open("wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)

    time.sleep(1)


def check_missing_images() -> list[str]:
    """Check which items are missing images in public/images/."""
    missing = []
    items_json = OUTPUT_FILE
    if not items_json.exists():
        return missing

    with items_json.open() as f:
        items = json.load(f)

    for item in items:
        img = IMAGES_DIR / f"{item['id']}.png"
        if not img.exists():
            missing.append(item["name"])

        # Check recipe component images too
        for component in item.get("recipe", {}).keys():
            comp_id = sanitise_item_name(component)
            img = IMAGES_DIR / f"{comp_id}.png"
            if not img.exists():
                missing.append(component)

    return sorted(set(missing))


def load_item_list() -> list[str]:
    with ITEMS_LIST.open() as f:
        return [line.strip() for line in f if line.strip()]


if __name__ == "__main__":
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    all_items: list[Item] = []

    for item in load_item_list():
        sanitised_name = sanitise_item_name(item)
        item_data = get_item_data(sanitised_name)
        download_image(item_data, sanitised_name)

        recipe = item_data["result"]["data"]["farmrpg"]["items"][0]["recipeItems"]
        recipe_dict = {r["item"]["name"]: r["quantity"] for r in recipe}

        all_items.append(Item(name=item, id=sanitised_name, recipe=recipe_dict))

        # Also fetch data/images for all recipe components
        for component in recipe_dict.keys():
            comp_name = sanitise_item_name(component)
            comp_data = get_item_data(comp_name)
            download_image(comp_data, comp_name)

    with OUTPUT_FILE.open("w") as f:
        json.dump([it.model_dump() for it in all_items], f, indent=4)

    print(f"\nWrote {len(all_items)} items to {OUTPUT_FILE}")

    # Check for missing images
    missing = check_missing_images()
    if missing:
        print(f"\nMissing images for {len(missing)} items:")
        for name in missing:
            print(f"  - {name}")
    else:
        print("All images present.")
