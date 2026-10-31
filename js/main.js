/* Samy & Yasmine — invitation behaviour
   Reads everything personal from window.INVITATION (js/config.js).

   The opening (seal → flap → letter → garden) is ONE time-driven timeline:
   render(t) computes the position of every element for a given time t, so all
   movements overlap and share the same clock. It has no dependency on GSAP,
   and can be inspected frame by frame with window.__invitation.seek(seconds). */
(() => {
  "use strict";
  const C = window.INVITATION;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;
  const hasGsap = !!window.gsap;
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

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

  /* ---------- 2. Elements ---------- */
  const opening = $("#opening"), openingBg = $("#openingBg"), env = $("#env"), flap = $("#flap"),
        letter = $("#letter"), letterPhoto = $(".letter__photo"), letterCopy = $(".letter__copy"),
        seal = $("#seal"), halfL = $(".seal__half--l"), halfR = $(".seal__half--r"),
        tap = $("#tap"), above = $(".opening__above"), crumbBox = $("#crumbs"),
        main = $("#main"), hero = $("#hero"), heroBg = $(".hero .scene__bg"), glow = $(".hero__glow");
  const envParts = [$(".env__back"), $(".env__pocket"), flap, $(".env__shadow")];
  const sprigs = $$(".sprig");
  let opened = false;

  const finishInstant = () => {
    opening.style.display = "none";
    main.style.visibility = "visible"; main.style.opacity = 1;
    glow.style.opacity = 1;
    root.classList.remove("is-locked");
    $$("[data-hero]").forEach((e) => (e.style.opacity = 1));
    document.dispatchEvent(new CustomEvent("invitation:opened"));
  };

  /* ---------- 3. Smooth scroll (Lenis, started once the page is open) ---------- */
  let lenis = null;
  if (window.Lenis && hasGsap && !reduce) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.stop();
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  glow.style.opacity = 0;
  if (hasGsap) gsap.set("[data-hero]", { opacity: 0 });

  /* ---------- 4. The opening timeline ---------- */
  const lin = (x) => x;
  const eIO = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);   // cubic in-out
  const eO = (x) => 1 - Math.pow(1 - x, 3);                                         // cubic out
  const eI = (x) => x * x;                                                          // gravity
  const eS = (x) => -(Math.cos(Math.PI * x) - 1) / 2;                               // sine in-out
  const seg = (t, a, b, e = lin) => e(Math.min(1, Math.max(0, (t - a) / (b - a))));
  const lerp = (a, b, k) => a + (b - a) * k;

  const DUR = 8.6;
  const T = {
    press: .18, crack: .34, fall: [.34, 1.3],
    flap: [.8, 2.1], rise: [2.0, 4.3], expand: [3.9, 6.1],
    copy: [4.2, 4.9], envFade: [4.2, 5.4], photo: [4.9, 6.4], zoom: [4.9, 8.6],
    paperFade: [5.6, 6.8], rootFade: [6.2, 7.0], glow: [6.8, 8.4],
    mainShown: 4.8, unlock: 6.9, heroIn: 6.9, ready: 8.0
  };

  let G = null;           // measured geometry
  let fired = {};
  let crumbs = [];

  function prepare() {
    opening.classList.add("is-opening");
    const mr = main.getBoundingClientRect(), hr = hero.getBoundingClientRect(), br = heroBg.getBoundingClientRect();
    G = {
      envX: env.offsetLeft, envY0: env.offsetTop, W: env.offsetWidth, u: env.offsetHeight, sealW: seal.offsetWidth,
      colLeft: mr.left, colW: mr.width, heroH: hr.height, heroTop: hr.top
    };
    // make the photo inside the letter geometrically identical to the hero background
    letterPhoto.style.top = ((br.top - hr.top) / hr.height * 100) + "%";
    letterPhoto.style.height = (br.height / hr.height * 100) + "%";
    fired = {};
    // wax crumbs
    crumbBox.innerHTML = ""; crumbs = [];
    let s = 11; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 10; i++) {
      const el = document.createElement("i");
      const size = 3 + rnd() * 4;
      el.style.cssText = `width:${size}px;height:${size}px`;
      crumbBox.appendChild(el);
      const a = (-0.15 + rnd() * 1.3) * Math.PI;           // fan out, mostly sideways/down
      crumbs.push({ el, vx: Math.cos(a) * (40 + rnd() * 70), vy: -Math.abs(Math.sin(a)) * (30 + rnd() * 50) - 20 });
    }
  }

  const once = (key, cond, fn) => { if (cond && !fired[key]) { fired[key] = 1; fn(); } };

  function render(t) {
    const { envX, envY0, W, u, sealW, colLeft, colW, heroH, heroTop } = G;

    /* seal: press → pop → crack → halves drop */
    let sc = 1;
    if (t < T.press) sc = lerp(1, .9, seg(t, 0, T.press, eO));
    else sc = lerp(.9, 1.07, seg(t, T.press, T.crack, eO));
    seal.style.transform = `scale(${sc})`;
    const broken = t >= T.crack;
    seal.classList.toggle("is-broken", broken);
    if (broken) {
      const f = seg(t, T.fall[0], T.fall[1], eI), sp = seg(t, T.fall[0], T.fall[0] + .6, eO);
      const o = 1 - seg(t, .75, T.fall[1]);
      halfL.style.transform = `translate(${-sp * sealW * .42}px, ${f * sealW * 1.9}px) rotate(${-f * 22}deg)`;
      halfR.style.transform = `translate(${sp * sealW * .42}px, ${f * sealW * 2.1}px) rotate(${f * 18}deg)`;
      halfL.style.opacity = halfR.style.opacity = o;
    }
    crumbs.forEach((c) => {
      const tau = Math.max(0, t - T.crack);
      c.el.style.opacity = tau <= 0 ? 0 : 1 - seg(t, T.crack + .45, T.crack + 1.1);
      c.el.style.transform = `translate(${c.vx * tau}px, ${c.vy * tau + 330 * tau * tau}px)`;
    });

    /* envelope: flap rotates back, whole envelope settles lower to make room */
    const th = 180 * seg(t, T.flap[0], T.flap[1], eIO);
    flap.style.transform = `rotateX(${th}deg)`;
    flap.style.zIndex = th > 90 ? 1 : 4;
    const envY = u * (.12 * seg(t, .7, 3.0, eS) + .38 * seg(t, T.envFade[0], 5.6, eI));
    env.style.transform = `translateY(${envY}px)`;
    const eo = 1 - seg(t, T.envFade[0], T.envFade[1]);
    envParts.forEach((p) => (p.style.opacity = eo));
    sprigs.forEach((s) => (s.style.opacity = .75 * eo));
    tap.style.opacity = 1 - seg(t, 0, .4);
    above.style.opacity = (1 - seg(t, 2.6, 3.6)) * .8;

    /* letter: rises out of the pocket (still behind its front), then comes forward and unfolds */
    const rise = u * .96 * seg(t, T.rise[0], T.rise[1], eIO);
    letter.style.zIndex = rise >= u * .86 ? 5 : 2;         // only swaps once it is clear of the pocket: no visual jump
    const k = seg(t, T.expand[0], T.expand[1], eIO);
    const L = lerp(envX + .09 * W, colLeft, k);
    const Tp = lerp(envY0 + envY + .08 * u - rise, heroTop, k);
    const Wd = lerp(.82 * W, colW, k);
    const Ht = lerp(.84 * u, heroH, k);
    letter.style.left = (L - envX) + "px";
    letter.style.top = (Tp - (envY0 + envY)) + "px";
    letter.style.width = Wd + "px";
    letter.style.height = Ht + "px";
    letter.style.transform = `rotate(${-1.3 * Math.sin(Math.PI * seg(t, T.rise[0], T.rise[1] + .2)) * (1 - k)}deg)`;
    letter.style.setProperty("--k", k);
    letter.style.setProperty("--lift", Math.min(1, rise / u) * (1 - k * .6));
    letter.style.setProperty("--crease", 1 - seg(t, 3.9, 4.8));
    letterCopy.style.opacity = 1 - seg(t, T.copy[0], T.copy[1]);

    /* paper becomes the garden */
    const zoom = 1 + .07 * (1 - seg(t, T.zoom[0], T.zoom[1], eO));
    root.style.setProperty("--zoom", zoom);
    letterPhoto.style.opacity = seg(t, T.photo[0], T.photo[1], eIO);
    openingBg.style.opacity = 1 - seg(t, T.paperFade[0], T.paperFade[1], eIO);
    opening.style.opacity = 1 - seg(t, T.rootFade[0], T.rootFade[1], eIO);
    glow.style.opacity = seg(t, T.glow[0], T.glow[1], eS);

    once("main", t >= T.mainShown, () => { main.style.visibility = "visible"; main.style.opacity = 1; });
    once("unlock", t >= T.unlock, () => {
      opening.style.visibility = "hidden";
      root.classList.remove("is-locked");
      window.scrollTo(0, 0);
      lenis && lenis.start();
      hasGsap && window.ScrollTrigger && ScrollTrigger.refresh();
    });
    once("hero", t >= T.heroIn, () => { playHero(); startPetals(); });
    once("ready", t >= T.ready, () => document.dispatchEvent(new CustomEvent("invitation:opened")));
  }

  function finish() {
    opening.style.display = "none";
    root.style.setProperty("--zoom", 1);
    $$("[data-hero]").length && !hasGsap && $$("[data-hero]").forEach((e) => (e.style.opacity = 1));
  }

  function openInvitation() {
    if (opened) return;
    opened = true;
    seal.blur();
    opening.style.pointerEvents = "none";
    if (reduce) {                       // gentle fade only
      opening.style.transition = "opacity .6s"; opening.style.opacity = 0;
      setTimeout(finishInstant, 650);
      return;
    }
    prepare();
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(DUR, (now - t0) / 1000);
      render(t);
      t < DUR ? requestAnimationFrame(tick) : finish();
    };
    requestAnimationFrame(tick);
  }
  seal.addEventListener("click", openInvitation);
  if (location.hash === "#open") openInvitation();

  // inspection hook: window.__invitation.seek(3.2) shows the opening at 3.2 s
  window.__invitation = Object.assign(window.__invitation || {}, {
    DUR, seek(t) { if (!G) { opened = true; prepare(); } render(t); }
  });

  /* ---------- 5. Hero entrance (names are "written" left to right) ---------- */
  function playHero() {
    if (!hasGsap) return;
    const q = (n) => $$(`[data-hero="${n}"]`);
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(q("intro"), { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 1.4 })
      .fromTo(q("name")[0], { opacity: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 -2% 0 -2%)", duration: 2, ease: "power2.inOut" }, "-=.6")
      .fromTo(q("amp"), { opacity: 0, scale: .6 }, { opacity: 1, scale: 1, duration: 1.1, ease: "back.out(1.6)" }, "-=1.1")
      .fromTo(q("name")[1], { opacity: 1, clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 -2% 0 -2%)", duration: 2.2, ease: "power2.inOut" }, "-=.7")
      .fromTo(q("announce"), { opacity: 0, letterSpacing: ".7em" }, { opacity: 1, letterSpacing: ".38em", duration: 1.6 }, "-=1")
      .fromTo(q("date"), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.2 }, "-=1")
      .fromTo(".rule", { scaleX: 0 }, { scaleX: 1, duration: 1.2, ease: "power2.inOut" }, "<")
      .to(q("scroll"), { opacity: 1, duration: 1 }, "-=.2");
  }

  /* ---------- 6. Scroll: parallax + reveals ---------- */
  if (hasGsap && !reduce) {
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

  /* ---------- 7. Falling petals ---------- */
  function startPetals() {
    if (!hasGsap || reduce) return;
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
