# Contributing to Pub-a-thon 🚢

Everything on the tracker comes from one file: [`data/manuscripts.json`](data/manuscripts.json).
Edit it, and the GitHub Page updates itself. No build step, no framework.

## Add a manuscript

Add an object to the `manuscripts` array:

```json
{
  "id": "short-unique-slug",
  "title": "My Manuscript Title",
  "authors": "Doe, Smith, et al.",
  "link": "https://docs.google.com/document/d/.../edit",
  "repo": "https://github.com/me/my-manuscript",
  "status": "Ship-shape",
  "startDate": "2026-02-01",
  "targetDate": "2026-09-01",
  "sectionsComplete": ["title", "abstract"]
}
```

Field notes:

| Field | Notes |
|-------|-------|
| `id` | unique, lowercase, kebab-case |
| `status` | one of `Ship-shape`, `Slowly-sinking`, `Submitted`, `Published` |
| `repo`, `authors`, `startDate`, `targetDate` | optional — leave `""` if unknown |
| `sectionsComplete` | list of section **keys** (see below). Order doesn't matter. |

## Mark progress after a meeting

Add the section's **key** to that manuscript's `sectionsComplete` list. The valid keys
(in voyage order) are:

```
title  abstract  introduction  methods  results  discussion  references  edit
```

Example — the crew finished **Results** for `time-series-platform`:

```diff
-      "sectionsComplete": ["title", "abstract", "introduction", "methods"]
+      "sectionsComplete": ["title", "abstract", "introduction", "methods", "results"]
```

The boat advances to 5/8 = 63% automatically. When all 8 are listed (or `status` is
`Published`), the manuscript reaches harbor 🏝️.

## The four status tags

| Tag | Meaning |
|-----|---------|
| ⛵ `Ship-shape` | Under way and making progress — the default for a healthy draft. |
| 🌊 `Slowly-sinking` | Stalled or taking on water. Sorts to the top under **Needs a hand 🛟**. |
| 📮 `Submitted` | Out the door and with the editors. |
| 🏝️ `Published` | Reached the harbor. Counts toward **In harbor 🏆** on the dashboard. |

## Before you commit

```bash
python3 scripts/validate.py
```

This checks the JSON parses, ids are unique, statuses are valid, and every section key
resolves. CI runs the same check on your PR.

## Don't want to touch JSON?

Open an issue instead — the maintainers will transcribe it:

- [➕ Add a manuscript](../../issues/new?template=new-manuscript.yml)
- [✅ Log progress](../../issues/new?template=update-progress.yml)
