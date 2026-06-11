#!/usr/bin/env python3
"""Turn a submitted issue (new-manuscript or progress form) into a data update.

Reads the issue from environment variables provided by GitHub Actions:
  ISSUE_BODY, ISSUE_TITLE, ISSUE_NUMBER, ISSUE_LABELS (comma separated)

On success it edits data/manuscripts.json in place and prints a one-line
summary to stdout (used as the comment posted back on the issue).
Exit code 0 = updated, 2 = couldn't handle (maintainer should do it by hand).
"""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "manuscripts.json"

EMOJI_TO_KEY = {
    "🎯": "title", "📝": "abstract", "🧭": "introduction", "🔬": "methods",
    "📊": "results", "💭": "discussion", "📚": "references", "✨": "edit",
}
ALLOWED_STATUS = {"Idea Stage", "Drafting", "Revision", "Accepted"}


def parse_form(body: str) -> dict:
    """GitHub issue forms render as '### Heading\\n\\nvalue' blocks."""
    fields, current, buf = {}, None, []
    for line in body.splitlines():
        m = re.match(r"^###\s+(.*)$", line.strip())
        if m:
            if current is not None:
                fields[current] = "\n".join(buf).strip()
            current, buf = m.group(1).strip(), []
        elif current is not None:
            buf.append(line)
    if current is not None:
        fields[current] = "\n".join(buf).strip()
    return fields


def clean(v: str) -> str:
    if not v or v.strip() in ("_No response_", "_No response", "None"):
        return ""
    return v.strip()


def checked_keys(block: str) -> list:
    keys = []
    for line in (block or "").splitlines():
        if re.match(r"^\s*-\s*\[[xX]\]", line):
            for emoji, key in EMOJI_TO_KEY.items():
                if emoji in line:
                    keys.append(key)
    return keys


def slugify(title: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return s or "manuscript"


def find_field(fields: dict, *needles):
    for k, v in fields.items():
        low = k.lower()
        if all(n in low for n in needles):
            return v
    return ""


def add_manuscript(data, fields):
    title = clean(find_field(fields, "title"))
    if not title:
        return None, "No manuscript title found in the form."
    link = clean(find_field(fields, "draft", "link")) or clean(find_field(fields, "link"))
    if not link:
        return None, "No draft link found in the form."

    base = slugify(title)
    existing = {m["id"] for m in data["manuscripts"]}
    mid, n = base, 2
    while mid in existing:
        mid, n = f"{base}-{n}", n + 1

    status = clean(find_field(fields, "status")) or "Idea Stage"
    if status not in ALLOWED_STATUS:
        status = "Idea Stage"
    urgency_raw = clean(find_field(fields, "urgency"))
    urgency = "High" if urgency_raw.lower() == "high" else ""

    sections_block = find_field(fields, "section") or find_field(fields, "drafted")
    ms = {
        "id": mid,
        "title": title,
        "authors": clean(find_field(fields, "author")),
        "link": link,
        "repo": clean(find_field(fields, "repo")),
        "status": status,
        "urgency": urgency,
        "startDate": "",
        "targetDate": clean(find_field(fields, "target")),
        "sectionsComplete": checked_keys(sections_block),
    }
    data["manuscripts"].append(ms)
    return ms, f"⚓ Added **{title}** to the fleet ({len(ms['sectionsComplete'])}/8 sections). Welcome aboard!"


def update_progress(data, fields):
    name = clean(find_field(fields, "manuscript"))
    if not name:
        return None, "No manuscript named in the form."
    target = None
    nl = name.lower()
    for m in data["manuscripts"]:
        if m["id"] == name or m["title"].lower() == nl or nl in m["title"].lower():
            target = m
            break
    if not target:
        return None, f"Couldn't find a manuscript matching '{name}'."

    added = checked_keys(find_field(fields, "complete") or find_field(fields, "section"))
    have = set(target["sectionsComplete"])
    order = list(EMOJI_TO_KEY.values())
    for k in added:
        have.add(k)
    target["sectionsComplete"] = [k for k in order if k in have]

    new_status = clean(find_field(fields, "status"))
    if new_status and new_status.lower() != "no change" and new_status in ALLOWED_STATUS:
        target["status"] = new_status

    pct = round(len(target["sectionsComplete"]) / len(order) * 100)
    return target, f"⛵ Logged progress for **{target['title']}** — now {pct}% of the voyage ({target['status']})."


def main():
    body = os.environ.get("ISSUE_BODY", "")
    labels = os.environ.get("ISSUE_LABELS", "")
    fields = parse_form(body)
    data = json.loads(DATA.read_text())

    if "new-manuscript" in labels:
        obj, msg = add_manuscript(data, fields)
    elif "progress" in labels:
        obj, msg = update_progress(data, fields)
    else:
        print("Issue is not labeled new-manuscript or progress; nothing to do.")
        sys.exit(2)

    if obj is None:
        print(msg)
        sys.exit(2)

    DATA.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(msg)


if __name__ == "__main__":
    main()
