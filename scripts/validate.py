#!/usr/bin/env python3
"""Validate data/manuscripts.json for the Pub-a-thon site.

Run locally with:  python3 scripts/validate.py
Also runs in CI on every pull request.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "manuscripts.json"

REQUIRED_MS_FIELDS = {"id", "title", "link", "status", "sectionsComplete"}
ALLOWED_STATUS = {"Submitted", "Published", "Ship-shape", "Slowly-sinking"}


def fail(msg):
    print(f"❌ {msg}")
    sys.exit(1)


def main():
    try:
        data = json.loads(DATA.read_text())
    except json.JSONDecodeError as e:
        fail(f"manuscripts.json is not valid JSON: {e}")

    sections = data.get("sections")
    if not sections:
        fail("Missing 'sections' array.")
    section_keys = {s["key"] for s in sections}

    manuscripts = data.get("manuscripts")
    if not isinstance(manuscripts, list):
        fail("Missing 'manuscripts' array.")

    seen_ids = set()
    for i, m in enumerate(manuscripts):
        where = f"manuscript[{i}] ({m.get('title', '?')})"
        missing = REQUIRED_MS_FIELDS - m.keys()
        if missing:
            fail(f"{where} is missing fields: {sorted(missing)}")
        if m["id"] in seen_ids:
            fail(f"{where} has a duplicate id '{m['id']}'.")
        seen_ids.add(m["id"])
        if m["status"] not in ALLOWED_STATUS:
            fail(f"{where} has invalid status '{m['status']}'. Allowed: {sorted(ALLOWED_STATUS)}")
        bad = [s for s in m["sectionsComplete"] if s not in section_keys]
        if bad:
            fail(f"{where} references unknown section keys: {bad}. Valid keys: {sorted(section_keys)}")

    print(f"✅ Valid! {len(manuscripts)} manuscripts, {len(sections)} sections, all section keys resolve.")


if __name__ == "__main__":
    main()
