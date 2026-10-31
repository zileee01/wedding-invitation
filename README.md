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
  garden.jpg          floral garden photo (invitation background)
  seal.png            wax seal, recolored burgundy from your seal artwork
  seal-original.png   the same seal in its original olive color
  music-disc.svg      music-disc illustration (lightweight copy of the disc, same artwork)
  paper.svg           paper-grain texture
assets/audio/
  canon-in-d.mp3      the wedding song (see "Music" below)
js/music.js           music player (play/pause, progress, volume)
source/               original SVG file
vercel.json           caching headers for Vercel
package.json          optional local dev server (npm start)
```

