#!/usr/bin/env python3
"""Refresh a video playlist from a public Google Drive folder.

Reads the folder's public embedded view (no API key needed), and writes or merges
src/data/videos/<slug>.json. Entries are matched by file name without its extension, so
replacing an .mkv with an .mp4 of the same name keeps the hand-edited fields (titleAr,
order, repoPath) and only updates the Drive ID.

    python scripts/fetch_drive_folder.py 1RmLTdls3ibxA4-ZrY-6eVhfEjQSI0yv2 dsa20
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "src" / "data" / "videos"
VIDEO_EXTENSIONS = {".mp4", ".mkv", ".mov", ".webm", ".avi", ".m4v"}

ENTRY_RE = re.compile(
    r'<div class="flip-entry" id="entry-(?P<id>[\w-]+)".*?'
    r'<div class="flip-entry-title">(?P<name>.*?)</div>.*?'
    r'<div class="flip-entry-last-modified"><div>(?P<modified>.*?)</div>',
    re.S,
)


def fetch_folder(folder_id: str) -> list[dict[str, str]]:
    url = f"https://drive.google.com/embeddedfolderview?id={folder_id}"
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        page = response.read().decode("utf-8")

    files = []
    for match in ENTRY_RE.finditer(page):
        name = html.unescape(match["name"]).strip()
        if Path(name).suffix.lower() not in VIDEO_EXTENSIONS:
            continue
        files.append({"id": match["id"], "name": name, "modified": parse_date(match["modified"])})
    return files


def parse_date(value: str) -> str:
    # The embedded view shows M/D/YY for older files and a time of day for files changed today.
    try:
        return datetime.strptime(value.strip(), "%m/%d/%y").date().isoformat()
    except ValueError:
        return datetime.now().date().isoformat()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("folder_id")
    parser.add_argument("slug")
    args = parser.parse_args()

    files = fetch_folder(args.folder_id)
    if not files:
        print("No video files found; is the folder shared as 'Anyone with the link'?", file=sys.stderr)
        return 1

    target = DATA_DIR / f"{args.slug}.json"
    existing = json.loads(target.read_text(encoding="utf-8")) if target.exists() else []
    by_key = {item["key"]: item for item in existing}
    next_order = max((item.get("order", 0) for item in existing), default=0) + 1

    # While an .mkv is being replaced, both files are in the folder; the .mp4 wins.
    chosen: dict[str, dict[str, str]] = {}
    for file in files:
        key = Path(file["name"]).stem
        if key not in chosen or file["name"].lower().endswith(".mp4"):
            chosen[key] = file

    videos = []
    seen = set()
    for key, file in sorted(chosen.items(), key=lambda pair: pair[0].lower()):
        seen.add(key)
        item = by_key.get(key)
        if item is None:
            item = {"key": key, "title": key, "titleAr": key, "order": next_order, "repoPath": ""}
            next_order += 1
            print(f"new: {file['name']}")
        elif item["id"] != file["id"]:
            print(f"updated id: {file['name']}")
        item.update({"id": file["id"], "fileName": file["name"], "modified": file["modified"]})
        videos.append(item)

    for key in by_key.keys() - seen:
        print(f"removed (no longer in the folder): {key}")

    videos.sort(key=lambda item: item["order"])
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(videos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"{len(videos)} videos -> {target.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
