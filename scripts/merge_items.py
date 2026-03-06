"""
Merge new items into items.txt without removing existing ones.
Run with: uv run scripts/merge_items.py

Paste item names (one per line) then press Ctrl+D (or Ctrl+Z on Windows).
"""
# /// script
# requires-python = ">=3.11"
# ///

import pathlib
import sys

ITEMS_FILE = pathlib.Path(__file__).parent / "items.txt"


def load_items() -> set[str]:
    if not ITEMS_FILE.exists():
        return set()
    with ITEMS_FILE.open() as f:
        return {line.strip() for line in f if line.strip()}


def save_items(items: set[str]) -> None:
    with ITEMS_FILE.open("w") as f:
        f.write("\n".join(sorted(items)) + "\n")


if __name__ == "__main__":
    existing = load_items()
    print(f"Current items: {len(existing)}")
    print("Paste item names (one per line), then Ctrl+D to finish:\n")

    new_items = {line.strip() for line in sys.stdin if line.strip()}
    added = new_items - existing
    merged = existing | new_items

    save_items(merged)

    if added:
        print(f"\nAdded {len(added)} new items:")
        for name in sorted(added):
            print(f"  + {name}")
    else:
        print("\nNo new items to add.")

    print(f"Total: {len(merged)} items")
