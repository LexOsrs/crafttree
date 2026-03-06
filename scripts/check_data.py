"""
Check data integrity: missing images, orphaned images, recipe consistency.
Run with: uv run scripts/check_data.py
"""
# /// script
# requires-python = ">=3.11"
# ///

import json
import pathlib

ROOT = pathlib.Path(__file__).parent.resolve().parent
IMAGES_DIR = ROOT / "public" / "images"
ITEMS_JSON = ROOT / "src" / "data" / "items.json"


def sanitise_item_name(item_name: str) -> str:
    return item_name.lower().replace(" ", "-").replace("'", "-")


def main():
    with ITEMS_JSON.open() as f:
        items = json.load(f)

    item_names = {i["name"] for i in items}
    item_ids = {i["id"] for i in items}
    errors = 0

    # Collect all referenced image IDs (items + their recipe components)
    referenced_ids = set(item_ids)
    for item in items:
        for component in item.get("recipe", {}).keys():
            referenced_ids.add(sanitise_item_name(component))

    # Check for missing images
    missing_images = []
    for ref_id in sorted(referenced_ids):
        img = IMAGES_DIR / f"{ref_id}.png"
        if not img.exists():
            missing_images.append(ref_id)

    if missing_images:
        print(f"Missing images ({len(missing_images)}):")
        for name in missing_images:
            print(f"  - {name}")
        errors += len(missing_images)
    else:
        print(f"All {len(referenced_ids)} referenced images present.")

    # Check for orphaned images (images with no corresponding item or component)
    actual_images = {p.stem for p in IMAGES_DIR.glob("*.png")}
    orphaned = actual_images - referenced_ids
    if orphaned:
        print(f"\nOrphaned images ({len(orphaned)}) — not referenced by any item:")
        for name in sorted(orphaned):
            print(f"  - {name}.png")
    else:
        print(f"No orphaned images.")

    # Check recipe components exist as items or have images
    missing_items = set()
    for item in items:
        for component in item.get("recipe", {}).keys():
            if component not in item_names:
                comp_id = sanitise_item_name(component)
                if comp_id not in item_ids:
                    missing_items.add(component)

    if missing_items:
        print(f"\nRecipe components not in items.json ({len(missing_items)}):")
        for name in sorted(missing_items):
            print(f"  - {name}")
    else:
        print(f"All recipe components are either items or raw materials.")

    # Summary
    print(f"\nSummary: {len(items)} items, {len(actual_images)} images, {errors} errors")


if __name__ == "__main__":
    main()
