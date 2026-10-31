/* Samy & Yasmine — invitation behaviour
   Reads everything personal from window.INVITATION (js/config.js). */
(() => {
  "use strict";
  const C = window.INVITATION;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  /* ---------- 1. Fill text from config ---------- */
  const get = (path) => path.split(".").reduce((o, k) => (o == null ? o : o[k]), C);
  $$("[data-cfg]").forEach((el) => {
    const v = get(el.dataset.cfg);
    if (v != null) el.textContent = v;
  });
  document.title = `${C.couple.first} & ${C.couple.second} — ${C.date.display}`;

  const address = $("#address");
  if (/^\s*\[/.test(C.venue.address)) address.classList.add("is-placeholder");
  $$("[data-map-link]").forEach((a) => (a.href = C.venue.mapsUrl));
  if (C.venue.mapEmbedUrl) {
    const f = document.createElement("iframe");
    f.src = C.venue.mapEmbedUrl; f.loading = "lazy"; f.title = "Map preview"; f.tabIndex = -1;
    $("#mapLive").appendChild(f);
  }

  /* ---------- 2. Elements & fallback ---------- */
  const opening = $("#opening"), env = $("#env"), flap = $("#flap"), letter = $("#letter"),
        seal = $("#seal"), tap = $("#tap"), main = $("#main");
  let opened = false;

  const finishInstant = () => {
    opening.style.display = "none";
    main.style.visibility = "visible"; main.style.opacity = 1;
    root.classList.remove("is-locked");
    $$("[data-hero]").forEach((e) => (e.style.opacity = 1));
  };

  if (!window.gsap) {            // libraries blocked / offline: still usable
    seal.addEventListener("click", finishInstant);
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- 3. Smooth scroll (Lenis, held until the seal is broken) ---------- */
  let lenis = null;
  if (window.Lenis && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- 4. Idle state of the opening screen ---------- */
  gsap.set(main, { autoAlpha: 0 });
  gsap.set("[data-hero]", { opacity: 0 });
  if (!reduce) {
    gsap.from(env, { y: 26, opacity: 0, duration: 1.4, ease: "power3.out" });
    gsap.from([".opening__above", tap], { opacity: 0, duration: 1.2, delay: .5 });
    $$(".sprig").forEach((s, i) => gsap.to(s, { rotation: "+=3", duration: 3.4 + i * .5, yoyo: true, repeat: -1, ease: "sine.inOut" }));
    gsap.to(seal, { scale: 1.035, duration: 1.8, yoyo: true, repeat: -1, ease: "sine.inOut" });
  }

  /* ---------- 5. The opening sequence ---------- */
  function openInvitation() {
    if (opened) return;
    opened = true;
    seal.blur();
    gsap.killTweensOf(seal);

    const envH = env.getBoundingClientRect().height;
    const colW = Math.min(innerWidth, parseFloat(getComputedStyle(root).getPropertyValue("--column")) || 520);

    if (reduce) {                 // gentle fade only
      gsap.to(opening, { autoAlpha: 0, duration: .6, onComplete: () => { finishInstant(); } });
      return;
    }

    const tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });

    // seal reacts, then cracks along a fissure and falls away
    tl.to(tap, { opacity: 0, duration: .4 }, 0)
      .to(seal, { scale: .9, duration: .16, ease: "power2.out" }, 0)
      .to(seal, { scale: 1.1, duration: .2, ease: "power2.out" })
      .add(() => seal.classList.add("is-broken"))
      .to(".seal__half--l", { x: -30, y: 70, rotation: -18, opacity: 0, duration: 1, ease: "power2.in" }, ">")
      .to(".seal__half--r", { x: 30, y: 84, rotation: 16, opacity: 0, duration: 1, ease: "power2.in" }, "<")

      // flap folds back, revealing the burgundy lining
      .to(flap, { rotationX: 180, duration: 1.15 }, "-=.7")
      .add(() => gsap.set(flap, { zIndex: 1 }), "-=.62")
      .to(env, { y: envH * .16, duration: 1.2 }, "<")

      // letter rises out of the envelope
      .to(letter, { y: -envH * .8, duration: 1.2, ease: "power2.out" }, "-=.35")

      // hand the letter over to the page: unfold it to the full invitation
      .add(() => {
        const r = letter.getBoundingClientRect();
        opening.appendChild(letter);
        gsap.set(letter, { position: "fixed", left: r.left, top: r.top, width: r.width, height: r.height, x: 0, y: 0, zIndex: 20 });
      })
      .to(letter, { left: (innerWidth - colW) / 2, top: 0, width: colW, height: innerHeight, duration: 1.5, ease: "power3.inOut" }, ">")
      .to(env, { opacity: 0, y: "+=40", duration: 1, ease: "power1.in" }, "<")
      .to([".opening__above", ".sprig"], { opacity: 0, duration: .8 }, "<")
      .to(".letter__copy", { opacity: 0, duration: .5 }, "<.1")
      .to(".letter__photo", { opacity: 1, duration: 1.1 }, "<.3")

      // reveal the real page beneath, then dissolve the opening layer
      .add(() => gsap.set(main, { autoAlpha: 1 }))
      .to(opening, { autoAlpha: 0, duration: 1, ease: "power1.inOut" }, ">.1")
      .add(() => {
        opening.style.display = "none";
        root.classList.remove("is-locked");
        window.scrollTo(0, 0);
        lenis && lenis.start();
        ScrollTrigger.refresh();
        playHero();
        startPetals();
      }, "-=.55");
  }
  seal.addEventListener("click", openInvitation);
  if (location.hash === "#open") openInvitation();

  /* ---------- 6. Hero entrance (names are "written" left to right) ---------- */
  function playHero() {
    const q = (n) => $$(`[data-hero="${n}"]`);
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(q("intro"), { opacity: 0, y: 14, filter: "blur(6px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.4 })
      .fromTo(q("name")[0], { opacity: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 -2% 0 -2%)", duration: 2, ease: "power2.inOut" }, "-=.6")
      .fromTo(q("amp"), { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: 1.1, ease: "back.out(1.6)" }, "-=1.1")
      .fromTo(q("name")[1], { opacity: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 -2% 0 -2%)", duration: 2.2, ease: "power2.inOut" }, "-=.7")
      .fromTo(q("announce"), { opacity: 0, letterSpacing: ".7em" }, { opacity: 1, letterSpacing: ".38em", duration: 1.6 }, "-=1")
      .fromTo(q("date"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.2 }, "-=1")
      .fromTo(".rule", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power2.inOut" }, "<")
      .to(q("scroll"), { opacity: 1, duration: 1 }, "-=.2");
  }

  /* ---------- 7. Scroll: parallax + reveals ---------- */
  if (!reduce) {
    $$("[data-parallax]").forEach((bg) => {
      gsap.fromTo(bg, { yPercent: -4 }, { yPercent: 4, ease: "none",
        scrollTrigger: { trigger: bg.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
    $$(".venue [data-reveal], .closing [data-reveal]").forEach((el) => {
      const card = el.dataset.reveal === "card";
      gsap.from(el, { opacity: 0, y: card ? 50 : 24, scale: card ? .97 : 1, filter: card ? "none" : "blur(5px)",
        duration: card ? 1.5 : 1.2, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });
    $$(".orn").forEach((o) => {
      gsap.from(o, { clipPath: "inset(0 50% 0 50%)", opacity: 0, duration: 2, ease: "power2.inOut",
        scrollTrigger: { trigger: o, start: "top 92%", once: true } });
    });
  }

  /* ---------- 8. Falling petals ---------- */
  function startPetals() {
    if (reduce) return;
    const box = $("#petals");
    const colors = ["#c58a8f", "#d9a5a8", "#ecd3cf", "#a8475a", "#e3b9b6"];
    const n = innerWidth < 600 ? 9 : 14;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("span");
      const s = gsap.utils.random(8, 15);
      p.className = "petal";
      p.style.cssText = `width:${s}px;height:${s * 1.25}px;left:${gsap.utils.random(0, 100)}%;background:${gsap.utils.random(colors)}`;
      box.appendChild(p);
      const fall = () => {
        gsap.set(p, { opacity: gsap.utils.random(.45, .8) });
        gsap.fromTo(p, { y: -30 }, { y: innerHeight + 40, duration: gsap.utils.random(11, 20), ease: "none", onComplete: fall });
      };
      gsap.delayedCall(gsap.utils.random(0, 9), fall);
      gsap.to(p, { x: gsap.utils.random(-50, 50), rotation: "+=" + gsap.utils.random(-120, 120), duration: gsap.utils.random(3, 5.5),
        yoyo: true, repeat: -1, ease: "sine.inOut", overwrite: false });
    }
  }
})();
