/* Music player — manual start only (never autoplays). Works with any MP3/OGG/WAV at config.music.src */
(() => {
  "use strict";
  const C = (window.INVITATION && window.INVITATION.music) || {};
  const $ = (id) => document.getElementById(id);
  const root = $("music"), disc = $("musicDisc"), play = $("musicPlay"), seek = $("musicSeek"),
        vol = $("musicVol"), cur = $("musicCur"), dur = $("musicDur"), msg = $("musicMsg");
  if (!root || !C.src) return;

  const audio = new Audio();
  audio.preload = "metadata";
  audio.loop = true;
  audio.src = C.src;
  audio.volume = parseFloat(vol.value);
  window.__invitation = Object.assign(window.__invitation || {}, { audio });

  const fmt = (s) => (isFinite(s) ? Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0") : "0:00");
  const setFill = (el, pct) => el.style.setProperty("--p", pct + "%");
  let dragging = false, raf = 0, idleTimer = 0;

  function paint() {
    const d = audio.duration, c = audio.currentTime;
    if (!dragging) {
      const v = isFinite(d) && d > 0 ? (c / d) * 1000 : 0;
      seek.value = v; setFill(seek, v / 10);
      cur.textContent = fmt(c);
    }
    if (isFinite(d)) dur.textContent = fmt(d);
  }
  const loop = () => { paint(); raf = requestAnimationFrame(loop); };

  function setOpen(open) {
    root.classList.toggle("is-open", open);
    disc.setAttribute("aria-expanded", String(open));
    disc.setAttribute("aria-label", open ? "Hide music player" : "Show music player");
  }
  const armIdle = (ms) => { clearTimeout(idleTimer); idleTimer = setTimeout(() => setOpen(false), ms); };

  audio.addEventListener("play", () => {
    root.classList.add("is-playing");
    play.setAttribute("aria-label", "Pause"); play.setAttribute("aria-pressed", "true");
    cancelAnimationFrame(raf); loop();
  });
  audio.addEventListener("pause", () => {
    root.classList.remove("is-playing");
    play.setAttribute("aria-label", "Play"); play.setAttribute("aria-pressed", "false");
    cancelAnimationFrame(raf); paint();
  });
  audio.addEventListener("loadedmetadata", paint);
  audio.addEventListener("durationchange", paint);
  audio.addEventListener("error", () => { msg.hidden = false; play.disabled = true; });

  play.addEventListener("click", () => {
    if (audio.paused) {
      const p = audio.play();
      if (p && p.catch) p.catch(() => { msg.hidden = false; });
      armIdle(4000);
    } else { audio.pause(); clearTimeout(idleTimer); }
  });

  seek.addEventListener("input", () => {
    dragging = true;
    setFill(seek, seek.value / 10);
    if (isFinite(audio.duration)) cur.textContent = fmt((seek.value / 1000) * audio.duration);
  });
  seek.addEventListener("change", () => {
    if (isFinite(audio.duration)) audio.currentTime = (seek.value / 1000) * audio.duration;
    dragging = false; paint();
  });
  vol.addEventListener("input", () => { audio.volume = parseFloat(vol.value); setFill(vol, vol.value * 100); });
  setFill(vol, parseFloat(vol.value) * 100);

  disc.addEventListener("click", () => { const o = !root.classList.contains("is-open"); setOpen(o); clearTimeout(idleTimer); if (o && !audio.paused) armIdle(6000); });
  root.addEventListener("pointerdown", () => clearTimeout(idleTimer));

  // appears once the invitation is open; shows itself briefly so guests notice it
  document.addEventListener("invitation:opened", () => {
    root.classList.add("is-ready");
    setTimeout(() => { setOpen(true); armIdle(6500); }, 700);
  });

  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({ title: C.title || "Wedding song", artist: C.artist || "" });
    navigator.mediaSession.setActionHandler("play", () => audio.play());
    navigator.mediaSession.setActionHandler("pause", () => audio.pause());
  }
})();
