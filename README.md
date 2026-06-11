# 🚢 Pub-a-thon 2026

A biweekly **scientific writing & peer-review workshop**. Every two weeks the crew
meets, picks one manuscript section, and works through it together using the
[Roberts Lab Writing Guide](https://robertslab.github.io/resources/Writing/).
Each manuscript is a little boat sailing from the *Port of Idea* to *Publication Harbor* — and
this repo's GitHub Page tracks the voyage. ⚓

### 👉 [**View the live tracker**](https://robertslab.github.io/pubathon-2026/)

*(Once Pages is enabled — see setup below.)*

---

## ⚓ The 8 Ports of Call

We tackle **one section per meeting**, in the order the writing guide recommends:

| # | Port | What we do |
|---|------|------------|
| 1 | 🎯 Title | Convey the central contribution in one line. |
| 2 | 📝 Abstract | A self-contained mini-paper (150–300 words). |
| 3 | 🧭 Introduction | Establish why the work matters. |
| 4 | 🔬 Methods | Enable replication and judge credibility. |
| 5 | 📊 Results | Present the data and the logical evidence. |
| 6 | 💭 Discussion | Interpret findings and implications. |
| 7 | 📚 Refs & Acks | Acknowledge prior work and helpers. |
| 8 | ✨ Final Edit | The three-pass review: details → structure → big picture. |

A manuscript's **progress bar = sections complete ÷ 8.** Reach 8/8 and the boat
pulls into the harbor 🏝️ (confetti included 🎉).

## 🗓️ How a meeting works

1. Open the [Writing Guide](https://robertslab.github.io/resources/Writing/) to that meeting's section.
2. The author shares their draft; the crew gives peer-review feedback on **that section only**.
3. After the meeting, log what got done (see below) — the boat advances.

We meet **every two weeks.** The site shows a live countdown to the next meeting.

## ➕ Add your manuscript

Two ways:

- **Easy:** open a [New manuscript issue](../../issues/new?template=new-manuscript.yml) and fill out the form.
- **Direct:** edit [`data/manuscripts.json`](data/manuscripts.json) and open a PR (see [CONTRIBUTING.md](CONTRIBUTING.md)).

## ✅ Log progress

After each meeting, mark the section done with a
[Progress issue](../../issues/new?template=update-progress.yml), or edit the
manuscript's `sectionsComplete` list in `data/manuscripts.json` directly.

---

## 🛠️ Maintainer setup (one time)

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
   The included [`pages.yml`](.github/workflows/pages.yml) workflow publishes the site on every push to `main`.
2. That's it. The site is plain HTML/CSS/JS reading `data/manuscripts.json` — no build step.

> The links above assume the repo lives at `RobertsLab/pubathon-2026`. If it lives
> somewhere else, the relative `../../issues/...` links still work; only update the
> hard-coded URL in `index.html`'s top buttons and the live-tracker link above.

## 🧪 Local preview

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

Validate the data file before committing:

```bash
python3 scripts/validate.py
```

## 📁 Repo layout

```
index.html              # the tracker page
assets/style.css        # nautical theme
assets/app.js           # renders cards + progress from the data file
data/manuscripts.json   # ← the single source of truth (edit this!)
scripts/validate.py     # sanity-checks the data file (runs in CI)
.github/                # issue forms + Pages/validate workflows
meetings/               # running log of what we covered each meeting
```

*Fair winds and following seas.* 🌊
