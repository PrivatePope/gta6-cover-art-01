# Vice Cover Lab

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/PrivatePope/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/PrivatePope/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns any photo and a caption into GTA 6-style cover art — the multi-panel poster look with bold lettering and a Vice City sunset or neon grade — exported as a PNG to share. Built for make.fun's [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01) bounty ($250, 50 places).

## Run it

```sh
# Serve the app (any static server works; it makes no network request)
npx serve app
# then open http://localhost:3000
```

Node 22 or later for the entry program, standard library only:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` there.

## How it works

1. **Add photos** — your own files from your machine (never uploaded), or try one of the two built-in sample photos.
2. **Pick a layout** — Hero + 3, four-panel grid, full bleed, triptych, split, or story strip. Click a panel on the cover to select it, drag to move its photo, scroll to zoom.
3. **Pick a grade** — Sunset, Neon Night, Vice Gold, Mono Noir, or Palm Haze. Each grade is a gradient wash over every panel plus its own accent colour.
4. **Write the caption** — a title in Anton and a subtitle in Pacifico script, over a halftone title band, with a retro sun disc and palm silhouettes in the hero panel.
5. **Export** — one click saves a PNG in 1080 × 1080, 1080 × 1350, or 1920 × 1080, or all three at once. Undo and redo cover every change.

Everything is drawn on a canvas in the browser: the cover you see is the cover you get. The two fonts (Anton and Pacifico) ship under `app/fonts/` under the SIL Open Font License, and the two sample photos were made with an image model for make.fun and are free to use. No Rockstar Games logo, artwork, or font is used anywhere.

## Files

- `main.ts` — the entry program: hands `app/` and `screenshots/` in and writes `dossier.json`.
- `vendor/makefun-app.ts` — the kit's dossier library, unchanged.
- `app/index.html`, `app/style.css` — the editor page.
- `app/src/cover.js` — the cover renderer (panels, grades, sun, palms, title band, grain, vignette).
- `app/src/grades.js` — the five grades and six layouts.
- `app/src/main.js` — the editor wiring (photos, crop, export, undo/redo).
- `app/src/shots.js` — fixed `?shot=` scenes for screenshots.
- `screenshots/` — the app with a photo loaded and the covers it exported.
