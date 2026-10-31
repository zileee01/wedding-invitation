# Samy & Yasmine — Wedding Invitation Website

A vintage floral wedding invitation: ivory envelope → burgundy wax seal → letter unfolds into a garden-photo invitation → venue with map → closing message.
Plain HTML / CSS / JavaScript. Animation: [GSAP](https://gsap.com) + ScrollTrigger, smooth scrolling: [Lenis](https://lenis.studiofreight.com) (all loaded from CDN, no build step).

## Project structure

```
index.html            page structure
css/styles.css        design (colors & fonts are variables at the top)
js/config.js          ← names, date, venue, address, map link, texts
js/main.js            animations (opening sequence, hero, scroll)
assets/img/
  garden.jpg          your floral garden photo (invitation background)
  seal.png            wax seal, recolored burgundy from your seal artwork
  seal-original.png   the same seal in its original olive color
  paper.svg           paper-grain texture
vercel.json           caching headers for Vercel
package.json          optional local dev server (npm start)
```

## Run locally

Any static server works (opening `index.html` by double-click also works).

```bash
npm start            # serves http://localhost:3000  (uses npx serve)
# or
python3 -m http.server 3000
```

Tip: add `#open` to the URL (`http://localhost:3000/#open`) to skip the tap while testing.

## What to edit

| I want to change…            | Where |
|------------------------------|-------|
| Names, date, texts, closing message | `js/config.js` |
| **Venue address**            | `js/config.js` → `venue.address` (currently a visible placeholder in brackets) |
| **Google Maps link**         | `js/config.js` → `venue.mapsUrl` (Google Maps → Share → Copy link) |
| Live map instead of the illustrated preview | `js/config.js` → `venue.mapEmbedUrl` (Google Maps → Share → Embed a map → copy the `src="…"` URL) |
| Colors                       | `:root` in `css/styles.css` (`--burgundy`, `--ivory`, `--rose`, `--gold`…) |
| Fonts                        | `:root` in `css/styles.css` + the Google Fonts `<link>` in `index.html` |
| Background photo / seal      | replace `assets/img/garden.jpg` / `seal.png` (same file names) |
| Seal in its original olive   | in `index.html` swap `seal.png` for `seal-original.png` (3 places) |

The map preview is clickable in two places (the map and the button) and opens `venue.mapsUrl`.

## Deploy on Vercel

**Option A — drag & drop:** go to vercel.com/new, import the folder (or push it to GitHub and import the repo). Framework preset: **Other**. No build command, output directory: leave empty. Deploy → you get a public URL to share.

**Option B — CLI:**
```bash
npm i -g vercel
vercel --prod
```

## Notes

- Fonts (Cormorant Garamond, Great Vibes, Montserrat) and the animation libraries load from public CDNs, so guests need nothing installed. To self-host them instead, download the files, place them in `assets/` and update the `<link>`/`<script>` tags in `index.html`.
- `prefers-reduced-motion` is respected (simple fade instead of the full animation, no petals).
- The garden photo is 674 × 1200 px. On wide screens the invitation is shown as a phone-sized column over a blurred copy of the photo, which keeps it sharp; a higher-resolution photo (≥ 1200 px wide) would look even better.
