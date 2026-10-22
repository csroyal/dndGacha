/* =====================================================================
   MULTIVERSE ARMORY — UI, storage, animation, sound
   ===================================================================== */
(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const STORAGE_KEY = "multiverseArmory.v1";
  const RARITY_NAMES = { C: "Common", R: "Rare", SR: "Super Rare", SSR: "Specially Super Rare" };
  const RARITY_RGB = { C: [200, 214, 236], R: [90, 170, 255], SR: [190, 120, 255], SSR: [255, 205, 90] };
  const RANK = { C: 0, R: 1, SR: 2, SSR: 3 };
  const OUTCOME_TAGS = {
    won: ["tag-won", "Won 50/50"],
    lost: ["tag-lost", "Lost 50/50 · next pity is limited"],
    guaranteed: ["tag-guar", "Guaranteed limited"],
  };

  /* ---------------------------------------------------------------
     State
     --------------------------------------------------------------- */
  const freshState = () => ({
    pity: 0, pityPulls: [], guaranteed: false, rotation: "default", forceNext: null, forceItem: null, turn: 0, pullCount: 0, nextUid: 1,
    history: [], inventory: [], undo: null, muted: false,
  });

  let state = loadState();

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved) {
        const s = Object.assign(freshState(), saved);
        // Older saves: rebuild the pity pip colors from the most recent pulls.
        if (!Array.isArray(saved.pityPulls)) s.pityPulls = s.pity > 0 ? s.history.slice(-s.pity).map(h => h.rarity) : [];
        return s;
      }
    } catch (e) { /* ignore corrupt or blocked storage */ }
    return freshState();
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
  }
  const snapshotState = () => JSON.stringify({ ...state, undo: null });

  /* ---------------------------------------------------------------
     Helpers
     --------------------------------------------------------------- */
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sleep = ms => new Promise(res => setTimeout(res, ms));
  const isPermanent = d => d === "permanent" || d === Infinity;
  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const ordinal = n => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");

  const snap = item => ({ name: item.name, rarity: item.rarity, icon: item.icon, image: item.image });

  // Current definition from items.js, or a stand-in if the item was since removed.
  function getItem(id, s = {}) {
    return Gacha.findItem(id) || {
      id, name: s.name || id, rarity: s.rarity || "C", icon: s.icon || "❔", image: s.image || "",
      stats: {}, duration: 1, description: "This item is no longer in js/items.js.",
    };
  }

  window.__artFallback = img => {
    const div = document.createElement("div");
    div.className = "art art-icon";
    div.textContent = img.dataset.icon || "❔";
    img.replaceWith(div);
  };

  function artHTML(item) {
    if (item.image) {
      return `<img class="art" src="${esc(item.image)}" alt="${esc(item.name)}" data-icon="${esc(item.icon || "❔")}" onerror="__artFallback(this)" draggable="false">`;
    }
    return `<div class="art art-icon" aria-hidden="true">${esc(item.icon || "❔")}</div>`;
  }

  function durationText(d) {
    if (isPermanent(d)) return "Kept for the rest of the encounter";
    const n = Number(d) || 1;
    return n <= 1 ? "This turn only" : `Kept for ${n} turns`;
  }

  const multiline = s => esc(s).replace(/\n/g, "<br>");

  function tagsHTML(meta) {
    const tags = [];
    if (meta.preview) tags.push(`<span class="tag tag-preview">Preview</span>`);
    if (meta.limited) tags.push(`<span class="tag tag-limited">Limited</span>`);
    if (meta.isPity) tags.push(`<span class="tag tag-pity">Pity</span>`);
    const oc = OUTCOME_TAGS[meta.outcome];
    if (oc) tags.push(`<span class="tag ${oc[0]}">${oc[1]}</span>`);
    return tags.join("");
  }

  // "Finesse, Versatile (1d8)" → each known term gets a hover definition from PROPERTY_GLOSSARY.
  const GLOSSARY = new Map(Object.entries(typeof PROPERTY_GLOSSARY === "object" ? PROPERTY_GLOSSARY : {})
    .map(([term, text]) => [term.toLowerCase(), [term, text]]));
  // Spell names (SPELL_GLOSSARY) and conditions (CONDITION_GLOSSARY) become hoverable in
  // already-escaped text. Case-sensitive, whole words.
  const SPELL_DATA = typeof SPELL_GLOSSARY === "object" ? SPELL_GLOSSARY : {};
  const CONDITION_DATA = typeof CONDITION_GLOSSARY === "object" ? CONDITION_GLOSSARY : {};
  const TERMS = new Map([
    ...Object.keys(CONDITION_DATA).map(name => [esc(name), { name, kind: "condition" }]),
    ...Object.keys(SPELL_DATA).map(name => [esc(name), { name, kind: "spell" }]),
  ]);
  const TERM_RE = TERMS.size
    ? new RegExp(`(?<![\\w])(${[...TERMS.keys()].sort((a, b) => b.length - a.length).map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\w])`, "g")
    : null;
  // "Fireball at 5th level" / "Fireball (5th level)" / "5th-level Fireball"
  const LEVEL_AFTER = /^\s*(?:\(|at\s+(?:the\s+)?)(\d)(?:st|nd|rd|th)[\s-]level/i;
  const LEVEL_BEFORE = /(\d)(?:st|nd|rd|th)[\s-]level\s+$/i;

  // The spell's hover text, cast at `castLevel` when given. [8d6 +1d6] tokens scale per level.
  function spellText(name, castLevel) {
    const s = SPELL_DATA[name];
    if (typeof s === "string") return s;
    const base = s.level || 0;
    const level = castLevel > base ? castLevel : base;
    const up = level - base;
    const body = String(s.text || "").replace(/\[(\d+)(d\d+)?\s*\+\s*(\d+)(?:d\d+)?\]/g,
      (_, n, die = "", per) => `${Number(n) + up * Number(per)}${die}`);
    const kind = base === 0 ? `${s.school} cantrip` : `${ordinal(level)}-level ${s.school}${up ? ` (upcast from ${ordinal(base)})` : ""}`;
    const meta = [kind, s.castingTime, s.range && `Range ${s.range}`, s.duration].filter(Boolean).join(" · ");
    return [meta, body, !up && s.higher ? `At higher levels: ${s.higher}` : ""].filter(Boolean).join("\n");
  }

  function linkTerms(html) {
    if (!TERM_RE) return html;
    return html.replace(TERM_RE, (match, _name, offset, str) => {
      const { name, kind } = TERMS.get(match);
      let text;
      if (kind === "condition") {
        text = `Condition\n${CONDITION_DATA[name]}`;
      } else {
        const after = str.slice(offset + match.length, offset + match.length + 30);
        const before = str.slice(Math.max(0, offset - 20), offset);
        const level = (after.match(LEVEL_AFTER) || before.match(LEVEL_BEFORE) || [])[1];
        text = spellText(name, level ? Number(level) : 0);
      }
      // &#10; keeps the definition's line breaks out of reach of the description's \n → <br> pass.
      return `<span class="prop" tabindex="0" data-tip-title="${esc(name)}" data-tip="${esc(text).replace(/\n/g, "&#10;")}">${match}</span>`;
    });
  }

  function propertiesHTML(value) {
    return String(value).split(/\s*,\s*/).map(part => {
      const hit = GLOSSARY.get(part.replace(/\s*\(.*\)\s*$/, "").trim().toLowerCase());
      if (!hit) return esc(part);
      return `<span class="prop" tabindex="0" data-tip-title="${esc(hit[0])}" data-tip="${esc(hit[1])}">${esc(part)}</span>`;
    }).join(", ");
  }

  // Shared by the reveal screen and the detail modal. `.st` blocks stagger in on reveal.
  function infoHTML(item, meta = {}) {
    let d = 0;
    const block = (cls, html, tag = "div") => `<${tag} class="${cls} st" style="--d:${d++}">${html}</${tag}>`;
    const letters = [...item.rarity].map((ch, i) => `<span style="--i:${i}">${ch}</span>`).join("");
    const tags = tagsHTML(meta);
    const origin = [item.type, item.origin && `from ${item.origin}`].filter(Boolean).map(esc).join(" · ");
    const stats = Object.entries(item.stats || {});

    return `
      <div class="rarity-letters">${letters}</div>
      ${tags ? block("tags", tags) : ""}
      ${block("item-name", esc(item.name), "h2")}
      ${origin ? block("item-origin", origin) : ""}
      ${stats.length ? block("stats", stats.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${k.toLowerCase() === "properties" ? propertiesHTML(v) : linkTerms(esc(v))}</dd></div>`).join(""), "dl") : ""}
      ${item.description ? block("desc", linkTerms(esc(item.description)).replace(/\n/g, "<br>"), "p") : ""}
      ${item.flavor ? block("flavor", multiline(item.flavor), "p") : ""}
      ${block("duration", `Duration: <b>${durationText(item.duration)}</b>`)}`;
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 3000);
  }

  /* ---------------------------------------------------------------
     Starfield (canvas) — drifts at idle, warps during a pull
     --------------------------------------------------------------- */
  const Starfield = (() => {
    const canvas = $("#stars");
    const ctx = canvas.getContext("2d");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const IDLE = reduced ? 0 : 0.00005;   // depth units per ms
    const WARP = reduced ? 0.0003 : 0.0022;
    const BASE = [210, 214, 255];
    let W = 0, H = 0, dpr = 1, speed = IDLE, target = IDLE;
    const tint = [...BASE], tintTo = [...BASE];

    const spawn = (s, anyDepth) => {
      s.x = Math.random() * 2 - 1;
      s.y = Math.random() * 2 - 1;
      s.z = anyDepth ? 0.05 + Math.random() * 0.95 : 1;
      s.tw = Math.random() * Math.PI * 2;
      return s;
    };
    const stars = Array.from({ length: 480 }, () => spawn({}, true));

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.width = Math.round(innerWidth * dpr);
      H = canvas.height = Math.round(innerHeight * dpr);
    }
    addEventListener("resize", resize);
    resize();

    let last = performance.now();
    function frame(now) {
      const dt = Math.min(50, now - last);
      last = now;
      speed += (target - speed) * Math.min(1, dt * 0.003);
      for (let i = 0; i < 3; i++) tint[i] += (tintTo[i] - tint[i]) * Math.min(1, dt * 0.004);

      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2, k = Math.max(W, H) * 0.5;
      const trail = Math.min(0.3, speed * 70);
      const rgb = `${tint[0] | 0},${tint[1] | 0},${tint[2] | 0}`;
      ctx.lineCap = "round";

      for (const s of stars) {
        s.z -= speed * dt;
        if (s.z <= 0.03) { spawn(s, false); continue; }
        const x = cx + (s.x / s.z) * k, y = cy + (s.y / s.z) * k;
        if (x < -40 || x > W + 40 || y < -40 || y > H + 40) { spawn(s, false); continue; }
        const z2 = Math.min(1, s.z + trail);
        const x2 = cx + (s.x / z2) * k, y2 = cy + (s.y / z2) * k;
        const near = 1 - s.z;
        const twinkle = 0.7 + 0.3 * Math.sin(now * 0.002 + s.tw);
        ctx.strokeStyle = `rgba(${rgb},${(Math.min(1, near * 1.3) * twinkle).toFixed(3)})`;
        ctx.lineWidth = (0.35 + near * 2.1) * dpr;
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x + 0.01, y);
        ctx.stroke();
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return {
      warp(rgb) { target = WARP; tintTo.splice(0, 3, ...rgb); },
      calm() { target = IDLE; tintTo.splice(0, 3, ...BASE); },
    };
  })();

  /* ---------------------------------------------------------------
     Portal — a ring of spinning sparks (sling-ring style), drawn on
     canvas. It's a particle system, so it never visibly loops.
     --------------------------------------------------------------- */
  // [hot core color, outer spark color] for the idle portal and each rarity.
  const PORTAL_TINTS = {
    base: ["#ffc860", "#ff7a12"],
    C:    ["#dfe7f3", "#93a6c4"],
    R:    ["#6cbcff", "#1f6fff"],
    SR:   ["#c98cff", "#8a2cff"],
    SSR:  ["#ffe070", "#ffa800"],
  };
  const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const lerp3 = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a.toFixed(3)})`;
  const TAU = Math.PI * 2;

  function SparkPortal(canvas) {
    const ctx = canvas.getContext("2d");
    const sparks = [];
    const innerStars = Array.from({ length: 60 }, () => ({ a: Math.random() * TAU, d: Math.sqrt(Math.random()) * 0.95, s: Math.random() }));
    let core = hexRgb(PORTAL_TINTS.base[0]), edge = hexRgb(PORTAL_TINTS.base[1]);
    let coreTo = core, edgeTo = edge;
    let intensity = 1, intensityTo = 1, ringCarry = 0, shedCarry = 0, t = 0;
    let W = 0, H = 0, dpr = 1;

    function fit() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (w !== W || h !== H) { W = canvas.width = w; H = canvas.height = h; sparks.length = 0; }
    }

    // Sparks riding around the ring.
    function emitRing(n, R) {
      const spin = 0.75 + 0.35 * intensity;
      for (let i = 0; i < n; i++) {
        sparks.push({
          ring: true,
          a: Math.random() * TAU,
          r: R * (1 + (Math.random() + Math.random() - 1) * 0.03),
          w: (2.4 + Math.random() * 2) * spin,
          vr: R * (Math.random() * 0.18 - 0.03),
          life: 0, max: 0.2 + Math.random() * 0.4,
          size: (0.8 + Math.random() * 1.6) * dpr,
        });
      }
    }
    // Sparks flung off the ring that fall away under gravity.
    function emitShed(n, R, cx, cy) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU;
        const speed = R * (0.9 + Math.random() * 1.3) * (0.8 + 0.25 * intensity);
        const out = R * (0.15 + Math.random() * 0.7);
        sparks.push({
          ring: false,
          x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R,
          vx: -Math.sin(a) * speed + Math.cos(a) * out,
          vy: Math.cos(a) * speed + Math.sin(a) * out,
          life: 0, max: 0.2 + Math.random() * 0.55,
          size: (0.6 + Math.random() * 1.2) * dpr,
        });
      }
    }

    function frame(dt) {
      fit();
      if (!W) return;
      t += dt;
      const k = Math.min(1, dt * 7);
      core = lerp3(core, coreTo, k);
      edge = lerp3(edge, edgeTo, k);
      intensity += (intensityTo - intensity) * Math.min(1, dt * 2.5);

      const cx = W / 2, cy = H / 2;
      const R = W * 0.23;                       // canvas is 2x the portal box; ring sits near its edge
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, W, H);

      // The other side: a dark window with slowly turning stars.
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
      g.addColorStop(0, "rgba(10,6,28,0.94)");
      g.addColorStop(0.86, "rgba(14,8,34,0.92)");
      g.addColorStop(0.97, rgba(edge, 0.18));
      g.addColorStop(1, rgba(edge, 0));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
      for (const s of innerStars) {
        const ang = s.a + t * 0.06;
        const tw = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.7 + s.s * 9));
        ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(3)})`;
        const sz = (0.6 + s.s * 1.2) * dpr;
        ctx.fillRect(cx + Math.cos(ang) * s.d * R, cy + Math.sin(ang) * s.d * R, sz, sz);
      }

      // Soft glow under the sparks.
      ctx.globalCompositeOperation = "lighter";
      ctx.shadowColor = rgba(edge, 0.8);
      ctx.shadowBlur = 12 * dpr * Math.min(1.3, intensity);
      ctx.strokeStyle = rgba(edge, 0.22);
      ctx.lineWidth = 3 * dpr;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
      ctx.shadowBlur = 0;

      // Sparks per second, scaled to ring size. Charging adds spray more than ring density,
      // so overlapping sparks don't blow the color out to white.
      const rate = 5.5 * (R / dpr);
      ringCarry += rate * (0.6 + 0.4 * intensity) * dt;
      shedCarry += rate * 0.2 * Math.pow(intensity, 1.2) * dt;
      const nRing = ringCarry | 0, nShed = shedCarry | 0;
      ringCarry -= nRing; shedCarry -= nShed;
      emitRing(nRing, R);
      emitShed(nShed, R, cx, cy);

      const gravity = R * 3;
      const fade = 0.8 / Math.sqrt(Math.max(1, intensity));   // keeps the color readable when charged
      ctx.lineCap = "round";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const p = sparks[i];
        p.life += dt;
        if (p.life >= p.max) { sparks[i] = sparks[sparks.length - 1]; sparks.pop(); continue; }
        const f = p.life / p.max;
        let x1, y1, x2, y2;
        if (p.ring) {
          p.a += p.w * dt;
          p.r += p.vr * dt;
          const tail = p.w * 0.075;
          x2 = cx + Math.cos(p.a) * p.r; y2 = cy + Math.sin(p.a) * p.r;
          x1 = cx + Math.cos(p.a - tail) * p.r; y1 = cy + Math.sin(p.a - tail) * p.r;
        } else {
          p.vy += gravity * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          x2 = p.x; y2 = p.y;
          x1 = p.x - p.vx * 0.045; y1 = p.y - p.vy * 0.045;
        }
        const color = f < 0.4 ? lerp3(core, edge, f / 0.4) : edge;
        ctx.strokeStyle = rgba(color, Math.pow(1 - f, 1.3) * fade);
        ctx.lineWidth = p.size * (1 - f * 0.5);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }

    return {
      frame,
      setTint(name, instant = false) {
        const [c, e] = PORTAL_TINTS[name] || PORTAL_TINTS.base;
        coreTo = hexRgb(c); edgeTo = hexRgb(e);
        if (instant) { core = coreTo; edge = edgeTo; }
      },
      setIntensity(x, instant = false) { intensityTo = x; if (instant) intensity = x; },
      burst(n = 250) {
        if (!W) return;
        const R = W * 0.23;
        emitRing(n, R);
        emitShed(Math.round(n * 0.25), R, W / 2, H / 2);
      },
      reset() { sparks.length = 0; },
    };
  }

  const altarPortal = SparkPortal($("#altarPortal"));
  const overlayPortal = SparkPortal($("#overlayPortal"));
  (() => {
    let last = performance.now();
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (document.body.classList.contains("pulling")) overlayPortal.frame(dt);
      else if ($("#view-summon").classList.contains("active")) altarPortal.frame(dt);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  })();

  /* ---------------------------------------------------------------
     Sound — small WebAudio synth, no files needed
     --------------------------------------------------------------- */
  const Sfx = (() => {
    let ctx = null, master = null, noiseBuf = null, currentFile = null, prepared = null;
    const clamp01 = v => Math.min(1, Math.max(0, Number(v) || 0));
    const masterVolume = () => clamp01(state.volume ?? 1);
    function ac() {
      if (state.muted) return null;
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = masterVolume();
        master.connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }
    function envelope(c, t0, dur, peak, attack) {
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(peak, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      g.connect(master);
      return g;
    }
    // `lowpass` softens bright waveforms (e.g. sawtooth brass).
    function tone({ f, f2, t = 0, dur = 0.5, type = "sine", g = 0.12, attack = 0.01, lowpass }) {
      const c = ac(); if (!c) return;
      const t0 = c.currentTime + t;
      const o = c.createOscillator();
      o.type = type;
      o.frequency.setValueAtTime(f, t0);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      let out = o;
      if (lowpass) {
        const lp = c.createBiquadFilter();
        lp.type = "lowpass"; lp.frequency.value = lowpass;
        out = o.connect(lp);
      }
      out.connect(envelope(c, t0, dur, g, attack));
      o.start(t0); o.stop(t0 + dur + 0.05);
    }
    function noise({ t = 0, dur = 1, g = 0.1, f = 800, f2, q = 1, type = "bandpass", attack = 0.05 }) {
      const c = ac(); if (!c) return;
      if (!noiseBuf) {
        noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      }
      const t0 = c.currentTime + t;
      const src = c.createBufferSource();
      src.buffer = noiseBuf; src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = type; filter.Q.value = q;
      filter.frequency.setValueAtTime(f, t0);
      if (f2) filter.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
      src.connect(filter).connect(envelope(c, t0, dur, g, attack));
      src.start(t0); src.stop(t0 + dur + 0.05);
    }
    const NOTES = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98];
    return {
      charge(sec) {
        noise({ dur: sec + 0.3, g: 0.07, f: 200, f2: 2600, q: 4, attack: sec * 0.85 });
        tone({ f: 55, f2: 220, dur: sec + 0.3, type: "sawtooth", g: 0.025, attack: sec * 0.8 });
      },
      blip(r) {
        if (r === "SSR") {
          // Golden bell chord with a rising shimmer, distinct from the plain blips.
          [1318.5, 1975.5, 2637].forEach((f, i) => {
            tone({ f, t: i * 0.03, dur: 1.1, g: 0.06 });
            tone({ f: f * 2.76, t: i * 0.03, dur: 0.5, g: 0.012 });
          });
          noise({ dur: 0.6, g: 0.05, f: 2500, f2: 9000, type: "highpass", attack: 0.3 });
          return;
        }
        const f = { C: 440, R: 587, SR: 740 }[r];
        tone({ f, dur: 0.4, type: "triangle", g: 0.1 });
        tone({ f: f * 2, t: 0.04, dur: 0.35, g: 0.04 });
      },
      fall() { noise({ dur: 0.7, g: 0.14, f: 3200, f2: 300, q: 1.5, attack: 0.08 }); },
      impact(r) {
        if (r === "SSR") return this.ssr();
        tone({ f: 95, f2: 38, dur: 0.9, g: 0.35 });
        noise({ dur: 0.5, g: 0.18, f: 1400, f2: 180, type: "lowpass", attack: 0.005 });
        const count = { C: 2, R: 3, SR: 4 }[r];
        NOTES.slice(0, count).forEach((f, i) => tone({ f, t: 0.12 + i * 0.09, dur: 1.4, type: "triangle", g: 0.08 }));
      },
      // SSR fanfare: thunderous hit, golden arpeggio, then a brass chord under sparkling bells.
      ssr() {
        tone({ f: 70, f2: 30, dur: 1.4, g: 0.4 });
        noise({ dur: 0.5, g: 0.16, f: 1400, f2: 160, type: "lowpass", attack: 0.005 });
        noise({ dur: 2.4, g: 0.06, f: 6000, type: "highpass", attack: 0.03 });
        [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98, 2093].forEach((f, i) =>
          tone({ f, t: 0.08 + i * 0.055, dur: 0.55, type: "triangle", g: 0.07 }));
        [261.63, 392, 523.25, 659.25, 783.99].forEach(f => {
          tone({ f, t: 0.5, dur: 2.8, type: "sawtooth", g: 0.03, attack: 0.09, lowpass: 1800 });
          tone({ f: f * 1.004, t: 0.5, dur: 2.8, type: "sawtooth", g: 0.022, attack: 0.09, lowpass: 1800 });
        });
        const bells = [2093, 2349.3, 2637, 3136, 3520, 4186];
        for (let i = 0; i < 14; i++) {
          const f = bells[(Math.random() * bells.length) | 0];
          const t = 0.6 + i * 0.11 + Math.random() * 0.05;
          tone({ f, t, dur: 0.9, g: 0.022 });
          tone({ f: f * 2.76, t, dur: 0.4, g: 0.007 });
        }
      },
      // Starts downloading an item's sound early (at the start of the pull animation) so it's
      // ready by the reveal, even on a slow connection.
      prepare(src) {
        if (state.muted || !src) return;
        const audio = new Audio();
        audio.preload = "auto";
        audio.src = src;
        audio.load();
        prepared = { src, audio };
      },
      // An item's own sound file, if it has one. Only one plays at a time.
      file(src, volume = 1) {
        this.stopFile();
        if (state.muted) { prepared = null; return; }
        const audio = prepared && prepared.src === src ? prepared.audio : new Audio(src);
        prepared = null;
        audio.baseVolume = clamp01(volume);
        audio.volume = clamp01(audio.baseVolume * masterVolume());
        audio.play().catch(() => {});
        currentFile = audio;
      },
      // Master volume (0 to 1) for everything: the built-in sounds and item sounds.
      setVolume(v) {
        state.volume = clamp01(v);
        if (master) master.gain.value = state.volume;
        if (currentFile && !currentFile.paused) currentFile.volume = clamp01(currentFile.baseVolume * state.volume);
      },
      // Fades out and stops the item sound (called when the result screen closes).
      stopFile() {
        const audio = currentFile;
        currentFile = null;
        if (!audio || audio.paused) return;
        const fade = setInterval(() => {
          audio.volume = Math.max(0, audio.volume - 0.15);
          if (audio.volume <= 0) { clearInterval(fade); audio.pause(); }
        }, 25);
      },
      click() { tone({ f: 700, dur: 0.07, type: "square", g: 0.02 }); },
    };
  })();

  /* ---------------------------------------------------------------
     Pull animation
     --------------------------------------------------------------- */
  const overlay = $("#pullOverlay");
  let ovStage = "closed";          // closed | anim | reveal | ready
  let dismiss = null;
  let skipping = false;
  const skipWaiters = new Set();

  // A delay that ends early when the player skips.
  function wait(ms) {
    if (skipping) return Promise.resolve();
    return new Promise(res => {
      const done = () => { clearTimeout(id); skipWaiters.delete(done); res(); };
      const id = setTimeout(done, ms);
      skipWaiters.add(done);
    });
  }
  function skip() {
    skipping = true;
    [...skipWaiters].forEach(done => done());
  }

  function fillParticles(rarity) {
    const count = { C: 18, R: 24, SR: 32, SSR: 44 }[rarity];
    $("#ovParticles").innerHTML = Array.from({ length: count }, () => {
      const style = [
        `--a:${(Math.random() * 360).toFixed(0)}deg`,
        `--r:${(120 + Math.random() * 260).toFixed(0)}px`,
        `--s:${(2 + Math.random() * 4).toFixed(1)}px`,
        `--dur:${(0.7 + Math.random() * 0.8).toFixed(2)}s`,
        `--delay:${(Math.random() * 1.2).toFixed(2)}s`,
      ].join(";");
      return `<span style="${style}"></span>`;
    }).join("");

    const sparkles = { C: 0, R: 6, SR: 16, SSR: 34 }[rarity];
    $("#revealSparkles").innerHTML = Array.from({ length: sparkles }, () => {
      const style = [
        `--x:${(5 + Math.random() * 55).toFixed(1)}%`,
        `--y:${(10 + Math.random() * 80).toFixed(1)}%`,
        `--s:${(4 + Math.random() * 9).toFixed(1)}px`,
        `--dur:${(1.6 + Math.random() * 2).toFixed(2)}s`,
        `--delay:${(0.6 + Math.random() * 2).toFixed(2)}s`,
      ].join(";");
      return `<span style="${style}"></span>`;
    }).join("");
  }

  function bumpPortal() {
    overlay.classList.remove("bump");
    void overlay.offsetWidth;
    overlay.classList.add("bump");
    overlayPortal.burst();
  }

  // An item's sound: one file, or a folder ("sounds/name/") whose clips are listed in
  // SOUND_FOLDERS (js/sounds.js). Folders play a random clip, never the same one twice in a row.
  const lastClip = {};
  function pickSound(item) {
    if (!item.sound) return null;
    const scale = item.soundVolume ?? 1;
    if (!item.sound.endsWith("/")) return { src: item.sound, volume: scale };
    const name = item.sound.replace(/\/+$/, "").split("/").pop();
    const clips = (typeof SOUND_FOLDERS === "object" && SOUND_FOLDERS[name]) || [];
    if (!clips.length) return null;
    let i = Math.floor(Math.random() * clips.length);
    if (clips.length > 1 && i === lastClip[item.id]) i = (i + 1 + Math.floor(Math.random() * (clips.length - 1))) % clips.length;
    lastClip[item.id] = i;
    const [file, volume = 1] = clips[i];
    return { src: item.sound + encodeURIComponent(file), volume: volume * scale };
  }

  // Charge → (rarity escalates) → weapon falls out of portal → impact → reveal.
  async function playReveal(item, meta) {
    const r = item.rarity;
    const chargeMs = { C: 1300, R: 1600, SR: 2100, SSR: 2600 }[r];
    // Like Genshin's meteor: the portal climbs through colors up to the real rarity.
    const steps = { C: ["C"], R: ["R"], SR: ["R", "SR"], SSR: ["R", "SR", "SSR"] }[r];

    skipping = false;
    document.body.classList.add("pulling");
    overlay.className = `overlay open rar-${r}`;
    overlay.dataset.phase = "idle";
    overlay.dataset.tint = "base";
    overlay.setAttribute("aria-hidden", "false");
    $("#ovFaller").innerHTML = artHTML(item);
    $("#revealArt").innerHTML = artHTML(item);
    $("#revealInfo").innerHTML = infoHTML(item, meta);
    $("#revealInfo").scrollTop = 0;
    // Pick the item's clip now and start loading it, so it's ready by the reveal.
    // (The images load now too, since they were just added to the page.)
    const clip = pickSound(item);
    if (clip) Sfx.prepare(clip.src);
    fillParticles(r);
    overlayPortal.reset();
    overlayPortal.setTint("base", true);
    overlayPortal.setIntensity(0.6, true);
    ovStage = "anim";

    void overlay.offsetWidth;
    overlay.dataset.phase = "charge";
    overlayPortal.setIntensity(2.4);
    Sfx.charge(chargeMs / 1000);
    Starfield.warp([255, 200, 150]);

    const seg = chargeMs / (steps.length + 1);
    for (const tint of steps) {
      await wait(seg);
      if (skipping) break;
      overlay.dataset.tint = tint;
      overlayPortal.setTint(tint);
      Starfield.warp(RARITY_RGB[tint]);
      Sfx.blip(tint);
      bumpPortal();
    }
    await wait(seg);

    let impacted = false;
    if (!skipping) {
      overlay.dataset.phase = "fall";
      overlayPortal.burst(450);
      Sfx.fall();
      await wait(650);
    }
    const revealSound = () => {
      Sfx.impact(r);
      if (clip) Sfx.file(clip.src, clip.volume);
    };
    if (!skipping) {
      overlay.dataset.phase = "impact";
      revealSound();
      impacted = true;
      await wait(380);
    }
    if (!impacted) revealSound();

    overlay.dataset.tint = r;
    overlay.dataset.phase = "reveal";
    ovStage = "reveal";
    Starfield.calm();
    await sleep(900);   // not skippable, so a double-click doesn't close the reveal instantly
    ovStage = "ready";
    overlay.classList.add("ready");
    await new Promise(res => { dismiss = res; });

    dismiss = null;
    Sfx.stopFile();
    Tooltip.hide();
    ovStage = "closed";
    document.body.classList.remove("pulling");
    overlay.className = "overlay";
    overlay.dataset.phase = "idle";
    overlay.setAttribute("aria-hidden", "true");
  }

  // Clicks and keys only close a finished reveal; skipping the animation takes the Skip button,
  // so a stray double-click can't cut it short.
  function overlayAdvance() {
    if (ovStage === "ready" && dismiss) dismiss();
  }
  $("#btnSkip").addEventListener("click", e => {
    e.stopPropagation();
    if (ovStage === "anim") skip();
  });
  overlay.addEventListener("click", e => {
    if (e.target.closest(".prop")) return;   // tapping a property shows its definition instead
    overlayAdvance();
  });

  /* ---------------------------------------------------------------
     Property tooltips — one floating element positioned over
     whichever [data-tip] is hovered, focused, or tapped.
     --------------------------------------------------------------- */
  const Tooltip = (() => {
    const tip = document.createElement("div");
    tip.className = "tooltip";
    tip.setAttribute("role", "tooltip");
    document.body.appendChild(tip);
    let current = null;

    function show(el) {
      if (el === current) return;
      current = el;
      tip.innerHTML = `<b>${esc(el.dataset.tipTitle)}</b>${multiline(el.dataset.tip)}`;
      tip.classList.add("show");
      const r = el.getBoundingClientRect();
      const w = tip.offsetWidth, h = tip.offsetHeight;
      const x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
      const y = r.top - h - 8 >= 8 ? r.top - h - 8 : r.bottom + 8;
      tip.style.left = `${x}px`;
      tip.style.top = `${y}px`;
    }
    function hide() {
      current = null;
      tip.classList.remove("show");
    }
    const find = e => e.target.closest && e.target.closest("[data-tip]");
    document.addEventListener("mouseover", e => { const el = find(e); el ? show(el) : hide(); });
    document.addEventListener("focusin", e => { const el = find(e); el ? show(el) : hide(); });
    document.addEventListener("click", e => { const el = find(e); if (el) { current = null; show(el); } else hide(); }, true);
    addEventListener("scroll", hide, true);
    return { hide };
  })();

  /* ---------------------------------------------------------------
     Game actions
     --------------------------------------------------------------- */
  let busy = false;

  function newInventoryEntry(item, duration, pullN = null) {
    return {
      uid: state.nextUid++,
      itemId: item.id,
      snap: snap(item),
      turnsLeft: isPermanent(duration) ? null : Math.max(1, Number(duration) || 1),
      pullN,
    };
  }

  // Starts a new turn: single-turn items fade, multi-turn items count down.
  function advanceTurn() {
    state.turn++;
    const expired = [];
    state.inventory = state.inventory.filter(entry => {
      if (entry.turnsLeft == null) return true;
      entry.turnsLeft--;
      if (entry.turnsLeft > 0) return true;
      expired.push(entry);
      return false;
    });
    return expired;
  }

  async function doPull(startNewTurn) {
    if (busy) return;
    const before = snapshotState();
    let result;
    try {
      result = Gacha.pull(state, Math.random, state.forceNext, state.forceItem);
    } catch (err) {
      toast(err.message);
      return;
    }
    busy = true;
    setBusy(true);
    state.forceNext = null;
    state.forceItem = null;

    const expired = startNewTurn ? advanceTurn() : [];
    if (state.turn === 0) state.turn = 1;
    const { item } = result;
    // One rarity per filled pity pip. A reset clears it; an unchanged count (C/R forced while pity
    // is due) adds nothing.
    const newPity = result.state.pity;
    if (newPity === 0) state.pityPulls = [];
    else if (newPity !== state.pity) state.pityPulls = [...state.pityPulls, item.rarity].slice(-newPity);
    state.pity = newPity;
    state.guaranteed = result.state.guaranteed;
    state.pullCount++;
    state.history.push({
      n: state.pullCount, itemId: item.id, snap: snap(item), rarity: item.rarity,
      limited: result.limited, isPity: result.isPity, outcome: result.outcome,
      turn: state.turn, banner: result.bannerKey, time: Date.now(),
    });
    state.inventory.push(newInventoryEntry(item, item.duration ?? 1, state.pullCount));
    state.undo = before;
    state.undoLabel = `pull (${item.name})`;
    saveState();

    await playReveal(item, result);

    busy = false;
    setBusy(false);
    renderAll();
    if (expired.length) toast(`${plural(expired.length, "item")} expired.`);
  }

  // Swaps an inventory entry for its next tier. Returns [from, to] names, or null if it can't upgrade.
  function upgradeEntry(entry) {
    const item = getItem(entry.itemId, entry.snap);
    const next = item.upgradesTo && Gacha.findItem(item.upgradesTo);
    if (!next) return null;
    entry.itemId = next.id;
    entry.snap = snap(next);
    if (item.upgradeSound) Sfx.file(item.upgradeSound, item.upgradeSoundVolume ?? 1);
    return [item.name, next.name];
  }

  // Starts the next turn without pulling. Giving up the pull also upgrades `entry`, or by
  // default the first upgradeable item in the inventory (e.g. the Stone Sword).
  function passTurn(entry) {
    if (busy) return;
    const before = snapshotState();
    const expired = advanceTurn();
    const target = entry || state.inventory.find(e => {
      const item = getItem(e.itemId, e.snap);
      return item.upgradesTo && Gacha.findItem(item.upgradesTo);
    });
    const upgraded = target && upgradeEntry(target);
    state.undo = before;
    state.undoLabel = upgraded ? `pass turn (${upgraded[0]} → ${upgraded[1]})` : "pass turn";
    saveState();
    renderAll();
    toast(`Turn ${state.turn}.${upgraded ? ` ${upgraded[0]} upgraded to ${upgraded[1]}.` : ""}${expired.length ? ` ${plural(expired.length, "item")} expired.` : ""}`);
  }

  function endEncounter() {
    if (busy) return;
    if (!confirm("End the encounter? The turn counter, pity and 50/50 guarantee reset, and the whole inventory is cleared, including items marked ∞.")) return;
    const before = snapshotState();
    state.turn = 0;
    state.pity = 0;
    state.pityPulls = [];
    state.guaranteed = false;
    state.inventory = [];
    state.undo = before;
    state.undoLabel = "end encounter";
    saveState();
    renderAll();
    toast("Encounter ended.");
  }

  function undoLast() {
    if (busy || !state.undo) return;
    const label = state.undoLabel || "pull";
    if (!confirm(`Undo the last ${label}? Pity, turn and inventory go back to how they were.`)) return;
    const muted = state.muted;
    state = Object.assign(freshState(), JSON.parse(state.undo));
    state.muted = muted;
    state.undo = null;
    saveState();
    renderAll();
    toast(`Undid the last ${label}.`);
  }

  function resetEverything() {
    if (!confirm("Reset EVERYTHING? This clears history, inventory, turn and pity.")) return;
    const muted = state.muted;
    state = freshState();
    state.muted = muted;
    saveState();
    closeModal();
    renderAll();
    toast("All data reset.");
  }

  function setBusy(on) {
    ["#btnPull", "#btnExtra", "#btnPass", "#btnEnd", "#btnUndo"].forEach(sel => { $(sel).disabled = on; });
    if (!on) {
      altarPortal.setIntensity(1);
      renderStatus();
    }
  }

  /* ---------------------------------------------------------------
     Modal
     --------------------------------------------------------------- */
  // opts.onBack shows a back arrow that calls it.
  let modalBack = null;
  function openModal(html, opts = {}) {
    modalBack = opts.onBack || null;
    $("#modalBack").hidden = !modalBack;
    $(".modal-box").classList.toggle("has-back", !!modalBack);
    $("#modalBody").innerHTML = html;
    $("#modal").classList.add("open");
    $("#modal").setAttribute("aria-hidden", "false");
    $(".modal-box").scrollTop = 0;
  }
  $("#modalBack").addEventListener("click", () => { Tooltip.hide(); if (modalBack) modalBack(); });
  function closeModal() {
    Tooltip.hide();
    $("#modal").classList.remove("open");
    $("#modal").setAttribute("aria-hidden", "true");
  }
  $("#modalClose").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });

  function metaForPull(n) {
    const h = state.history.find(x => x.n === n);
    return h ? { limited: h.limited, isPity: h.isPity, outcome: h.outcome } : {};
  }

  // opts: { histN } adds "Add to inventory"; { onBack } adds a back arrow.
  function showItem(item, meta = {}, opts = {}) {
    const actions = [`<button class="btn-small primary" data-act="preview">▶ Replay reveal</button>`];
    if (opts.histN != null) actions.push(`<button class="btn-small" data-act="keep">+ Add to inventory</button>`);
    openModal(`
      <div class="detail rar-${item.rarity}">
        <div class="detail-art">${artHTML(item)}</div>
        <div class="item-info">
          ${infoHTML(item, meta)}
          <div class="detail-actions">${actions.join("")}</div>
        </div>
      </div>`, { onBack: opts.onBack });
    const body = $("#modalBody");
    body.querySelector('[data-act="preview"]').addEventListener("click", () => {
      closeModal();
      if (!busy) playReveal(item, meta);
    });
    const keep = body.querySelector('[data-act="keep"]');
    if (keep) keep.addEventListener("click", () => {
      addToInventory(item, opts.histN);
      closeModal();
    });
  }

  function addToInventory(item, histN) {
    state.inventory.push(newInventoryEntry(item, 1, histN));
    saveState();
    renderAll();
    toast(`${item.name} added to inventory.`);
  }

  function pct(weight, weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    const v = total ? (weight / total) * 100 : 0;
    return `${Number(v.toFixed(1))}%`;
  }

  function showRules() {
    const cfg = GACHA_CONFIG;
    const banner = Gacha.activeBanner();
    const rows = Gacha.RARITIES.map(r => `
      <tr class="rar-${r}">
        <td><span class="rtag">${r}</span> ${RARITY_NAMES[r]}</td>
        <td>${pct(cfg.rates[r] || 0, cfg.rates)}</td>
        <td>${pct(cfg.pityRates[r] || 0, cfg.pityRates)}</td>
      </tr>`).join("");

    const catalog = Gacha.allItems()
      .filter(({ item, bannerKey }) => item.pullable !== false && (bannerKey === null || bannerKey === Gacha.activeKey()))
      .sort((a, b) => RANK[b.item.rarity] - RANK[a.item.rarity]);

    const inactive = Object.entries(LIMITED_BANNERS).filter(([key]) => key !== Gacha.activeKey());

    openModal(`
      <h2>Rates &amp; Rules</h2>
      <table class="rules-table">
        <thead><tr><th>Rarity</th><th>Normal pull</th><th>Pity pull</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <h3>How pity works</h3>
      <ul class="rules-list">
        <li>Every <b>${ordinal(cfg.pityEvery)} pull</b> is a guaranteed <b>SR or SSR</b>.</li>
        ${(cfg.pityResetsOn || []).length ? `<li>Pulling ${cfg.pityResetsOn.map(r => `<b>${r}</b>`).join(" or ")} before pity resets the count.</li>` : ""}
        <li>Ending an encounter resets the pity count and the 50/50 guarantee.</li>
        ${banner ? Object.entries(cfg.limitedRateUp || {})
          .filter(([r]) => banner.items.some(i => i.rarity === r && i.pullable !== false))
          .map(([r, share]) => `<li>Rate-up: <b>${Math.round(share * 100)}%</b> of ${RARITY_NAMES[r]} pulls give the limited ${r} item.</li>`)
          .join("") : ""}
        <li>A pity pull has a <b>${Math.round(cfg.limitedChance * 100)}/${Math.round((1 - cfg.limitedChance) * 100)}</b> chance to be <b>limited</b> or <b>standard</b>.</li>
        <li>Lose the 50/50 (get standard) → your <b>next pity pull is guaranteed limited</b>, then it goes back to 50/50.</li>
        <li>Win the 50/50 → nothing carries over; the next pity is still 50/50.</li>
        <li>${cfg.fiftyFiftyOnEveryHighPull
          ? "Natural SR/SSR pulls also use the 50/50."
          : "A natural SR/SSR (not on pity) is drawn from the whole pool and doesn't affect the 50/50."}</li>
        <li>Right now: <b>${state.guaranteed ? "next pity pull is guaranteed limited" : "next pity pull is 50/50"}</b>.</li>
      </ul>

      <h3>Item pool${banner ? ` · Standard + ${esc(banner.name)}` : " · Standard only"}</h3>
      <div class="card-grid small" id="catalogGrid">
        ${catalog.map(({ item, bannerKey }) => `
          <div class="item-card rar-${item.rarity}" data-id="${esc(item.id)}">
            ${bannerKey ? `<span class="lim-ribbon">Limited</span>` : ""}
            <div class="thumb">${artHTML(item)}</div>
            <span class="rtag">${item.rarity}</span>
            <div class="card-name">${esc(item.name)}</div>
          </div>`).join("")}
      </div>
      ${inactive.length ? `<p class="muted" style="margin-top:1rem;font-size:.85rem">Inactive rotations: ${inactive.map(([key, b]) => `${esc(b.name)} (<span class="code">${esc(key)}</span>)`).join(", ")}.
        Change <span class="code">ACTIVE_LIMITED_BANNER</span> in <span class="code">js/items.js</span> to swap.</p>` : ""}

      <h3>Data</h3>
      <button class="btn-small danger" id="btnReset">Reset all data</button>`);

    $("#catalogGrid").addEventListener("click", e => {
      const card = e.target.closest(".item-card");
      if (!card) return;
      const scroll = $(".modal-box").scrollTop;
      showItem(Gacha.findItem(card.dataset.id), { preview: true }, {
        onBack: () => { showRules(); $(".modal-box").scrollTop = scroll; },
      });
    });
    $("#btnReset").addEventListener("click", resetEverything);
  }

  /* ---------------------------------------------------------------
     Admin panel (hidden). Open it by clicking the title 5 times
     quickly, or by typing "admin" anywhere on the page.
     --------------------------------------------------------------- */
  function showAdmin() {
    const every = GACHA_CONFIG.pityEvery;
    const chips = (group, options, current) => options.map(([value, label]) =>
      `<button class="chip ${value === current ? "active" : ""}" data-group="${group}" data-value="${value}">${label}</button>`).join("");

    // Every item that can drop, best rarity first. Limited items from other rotations are included.
    const groups = [...Gacha.RARITIES].reverse().map(r => {
      const options = Gacha.allItems()
        .filter(({ item }) => item.rarity === r && item.pullable !== false)
        .map(({ item, bannerKey }) => {
          const banner = bannerKey && LIMITED_BANNERS[bannerKey];
          const note = banner ? ` (limited: ${banner.name}${bannerKey === Gacha.activeKey() ? "" : ", inactive"})` : "";
          return `<option value="${esc(item.id)}" ${item.id === state.forceItem ? "selected" : ""}>${esc(item.name)}${esc(note)}</option>`;
        }).join("");
      return options ? `<optgroup label="${r}">${options}</optgroup>` : "";
    }).join("");
    const forcedItem = state.forceItem && Gacha.findItem(state.forceItem);

    openModal(`<div id="adminPanel">
      <h2>Admin</h2>
      <p class="muted" style="margin-top:-.5rem">Nothing here is shown on the main screen.</p>

      <h3>Next pull rarity</h3>
      <div class="filters">${chips("force", [["", "Random"], ...Gacha.RARITIES.map(r => [r, r])], forcedItem ? null : state.forceNext || "")}</div>

      <h3>Next pull item</h3>
      <select id="admItem" class="admin-select">
        <option value="">Random item</option>
        ${groups}
      </select>
      <p class="muted" style="font-size:.85rem;margin:.6rem 0 0">These apply to the next pull only, then go back to random.
        Choosing an item overrides the rarity. Pity and the 50/50 respond as if it dropped naturally,
        and forcing C or R when pity is due doesn't use up the pity.</p>

      <h3>Pity count</h3>
      <div class="filters">${chips("pity", Array.from({ length: every }, (_, n) =>
        [String(n), n === every - 1 ? `${n} (next pull is pity)` : String(n)]), String(state.pity))}</div>

      <h3>Next pity pull</h3>
      <div class="filters">${chips("guar", [["0", "50/50"], ["1", "Limited guaranteed"]], state.guaranteed ? "1" : "0")}</div>

      <h3>Limited rotation</h3>
      <div class="filters">${chips("rot", [
        ["default", `Default from items.js${LIMITED_BANNERS[ACTIVE_LIMITED_BANNER] ? ` (${esc(LIMITED_BANNERS[ACTIVE_LIMITED_BANNER].name)})` : " (none)"}`],
        ...Object.entries(LIMITED_BANNERS).map(([key, b]) => [key, esc(b.name)]),
        ["none", "No rotation"],
      ], state.rotation || "default")}</div>
      <p class="muted" style="font-size:.85rem;margin:.6rem 0 0">Saved in this browser until you change it.
        The pool, featured items and limited odds update right away.</p>
    </div>`);
  }

  // Applies the admin panel's rotation choice ("default", "none", or a LIMITED_BANNERS key).
  function syncRotation() {
    const r = state.rotation || "default";
    Gacha.setActiveKey(r === "default" ? undefined : r === "none" ? null : LIMITED_BANNERS[r] ? r : undefined);
  }

  $("#modalBody").addEventListener("click", e => {
    const btn = e.target.closest("#adminPanel [data-group]");
    if (!btn) return;
    const { group, value } = btn.dataset;
    if (group === "force") { state.forceNext = value || null; state.forceItem = null; }
    if (group === "pity") {
      // Keep the most recent colors; any extra pips set by hand stay uncolored.
      const n = Number(value);
      const kept = state.pityPulls.slice(-n);
      state.pityPulls = n ? [...Array(n - kept.length).fill(null), ...kept] : [];
      state.pity = n;
    }
    if (group === "guar") state.guaranteed = value === "1";
    if (group === "rot") { state.rotation = value; renderAll(); }
    saveState();
    renderStatus();
    showAdmin();
  });
  $("#modalBody").addEventListener("change", e => {
    if (e.target.id !== "admItem") return;
    state.forceItem = e.target.value || null;
    if (state.forceItem) state.forceNext = null;
    saveState();
    showAdmin();
  });

  (() => {
    let clicks = [];
    $(".brand").addEventListener("click", () => {
      const now = Date.now();
      clicks = clicks.filter(t => now - t < 2000).concat(now);
      if (clicks.length >= 5) { clicks = []; showAdmin(); }
    });
    let typed = "";
    document.addEventListener("keydown", e => {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      typed = (typed + e.key.toLowerCase()).slice(-5);
      if (typed === "admin" && ovStage === "closed") { typed = ""; showAdmin(); }
    });
  })();

  /* ---------------------------------------------------------------
     Rendering
     --------------------------------------------------------------- */
  function renderBanner() {
    const banner = Gacha.activeBanner();
    const el = $("#bannerCard");
    if (!banner) {
      el.innerHTML = `<div><div class="bc-label">Standard pool</div><h2 class="bc-title">No limited rotation</h2>
        <p class="bc-desc">Only standard items are in the pool.</p></div>`;
      return;
    }
    const featured = banner.items
      .filter(i => RANK[i.rarity] >= RANK.R)
      .sort((a, b) => RANK[b.rarity] - RANK[a.rarity]);
    el.innerHTML = `
      <div>
        <div class="bc-label">Limited rotation</div>
        <h2 class="bc-title">${esc(banner.name)}</h2>
        ${banner.description ? `<p class="bc-desc">${esc(banner.description)}</p>` : ""}
      </div>
      <div class="featured">
        ${featured.map(i => `<button class="feat rar-${i.rarity}" data-id="${esc(i.id)}">${artHTML(i)}<span class="rtag">${i.rarity}</span>${esc(i.name)}</button>`).join("")}
      </div>`;
    $$(".feat", el).forEach(btn => btn.addEventListener("click", () => showItem(Gacha.findItem(btn.dataset.id), { preview: true, limited: true })));
  }

  function renderStatus() {
    const every = GACHA_CONFIG.pityEvery;
    const untilPity = every - state.pity;
    $("#turnNum").textContent = state.turn;
    $("#pityPips").innerHTML = Array.from({ length: every }, (_, i) => {
      const goal = i === every - 1;
      const filled = i < state.pity;
      const rarity = filled && state.pityPulls[i];
      const cls = ["pip", filled ? "filled" : "", rarity ? `rar-${rarity}` : "", goal ? "goal" : "", goal && untilPity === 1 ? "ready" : ""];
      return `<span class="${cls.join(" ")}"${rarity ? ` title="${rarity}"` : ""}></span>`;
    }).join("");
    const pityText = $("#pityText");
    pityText.textContent = untilPity <= 1 ? "Next pull: SR+ guaranteed!" : `SR+ guaranteed in ${untilPity} pulls`;
    pityText.classList.toggle("hot", untilPity <= 1);

    const fifty = $("#fiftyText"), sub = $("#fiftySub");
    if (!Gacha.activeBanner()) {
      fifty.textContent = "—"; fifty.classList.remove("gold");
      sub.textContent = "No limited rotation";
    } else if (state.guaranteed) {
      fifty.textContent = "Limited guaranteed"; fifty.classList.add("gold");
      sub.textContent = "Lost the last 50/50";
    } else {
      fifty.textContent = "50/50"; fifty.classList.remove("gold");
      sub.textContent = "Limited or standard";
    }
    $("#btnUndo").disabled = busy || !state.undo;
  }

  function invCardHTML(entry, controls) {
    const item = getItem(entry.itemId, entry.snap);
    const perm = entry.turnsLeft == null;
    const next = item.upgradesTo && Gacha.findItem(item.upgradesTo);
    const badge = perm ? `<span class="turns-badge perm">∞ Kept</span>`
      : entry.turnsLeft <= 1 ? `<span class="turns-badge last">This turn</span>`
      : `<span class="turns-badge">${entry.turnsLeft} turns</span>`;
    return `
      <div class="item-card rar-${item.rarity}" data-uid="${entry.uid}">
        ${badge}
        <div class="thumb">${artHTML(item)}</div>
        <span class="rtag">${item.rarity}</span>
        <div class="card-name">${esc(item.name)}</div>
        ${controls ? `<div class="card-controls">
          <button data-act="minus" title="One fewer turn" ${perm || entry.turnsLeft <= 1 ? "disabled" : ""}>−</button>
          <button data-act="plus" title="One more turn" ${perm ? "disabled" : ""}>+</button>
          <button data-act="perm" class="${perm ? "on" : ""}" title="${perm ? "Make temporary (this turn only)" : "Keep for the rest of the encounter"}">∞</button>
          <button data-act="discard" class="danger" title="Discard">✕</button>
        </div>
        ${next ? `<button class="btn-small upgrade-btn" data-act="upgrade" title="Upgrade to ${esc(next.name)} (uses your pull for the next turn)">⬆ Upgrade</button>` : ""}` : ""}
      </div>`;
  }

  function renderInventory() {
    const inv = [...state.inventory].sort((a, b) =>
      RANK[getItem(b.itemId, b.snap).rarity] - RANK[getItem(a.itemId, a.snap).rarity] || b.uid - a.uid);
    const empty = `<div class="empty">Nothing in hand.</div>`;
    $("#loadoutGrid").innerHTML = inv.length ? inv.map(e => invCardHTML(e, false)).join("") : empty;
    $("#invGrid").innerHTML = inv.length ? inv.map(e => invCardHTML(e, true)).join("") : empty;
    $("#invCount").textContent = inv.length || "";
  }

  function onInventoryClick(e) {
    const card = e.target.closest(".item-card");
    if (!card) return;
    const entry = state.inventory.find(x => x.uid === Number(card.dataset.uid));
    if (!entry) return;
    const btn = e.target.closest("button[data-act]");
    if (!btn) {
      showItem(getItem(entry.itemId, entry.snap), metaForPull(entry.pullN));
      return;
    }
    const act = btn.dataset.act;
    if (act === "upgrade") return passTurn(entry);
    if (act === "minus") entry.turnsLeft = Math.max(1, entry.turnsLeft - 1);
    if (act === "plus") entry.turnsLeft += 1;
    if (act === "perm") entry.turnsLeft = entry.turnsLeft == null ? 1 : null;
    if (act === "discard") state.inventory = state.inventory.filter(x => x !== entry);
    saveState();
    renderInventory();
  }
  $("#invGrid").addEventListener("click", onInventoryClick);
  $("#loadoutGrid").addEventListener("click", onInventoryClick);

  let histFilter = "all";

  function renderHistory() {
    const h = state.history;
    const counts = { C: 0, R: 0, SR: 0, SSR: 0 };
    let limited = 0, won = 0, lost = 0;
    for (const x of h) {
      counts[x.rarity] = (counts[x.rarity] || 0) + 1;
      if (x.limited) limited++;
      if (x.outcome === "won") won++;
      if (x.outcome === "lost") lost++;
    }
    const share = n => (h.length ? ` · ${Math.round((n / h.length) * 100)}%` : "");
    $("#histSummary").innerHTML = `
      <div class="hs"><b>${h.length}</b><span>Pulls</span></div>
      ${Gacha.RARITIES.slice().reverse().map(r => `<div class="hs rar-${r}"><b>${counts[r]}</b><span>${r}${share(counts[r])}</span></div>`).join("")}
      <div class="hs"><b>${limited}</b><span>Limited</span></div>
      <div class="hs"><b>${won}–${lost}</b><span>50/50 W–L</span></div>`;

    const filters = [["all", "All"], ["SSR", "SSR"], ["SR", "SR"], ["R", "R"], ["C", "C"], ["limited", "Limited"], ["pity", "Pity"]];
    $("#histFilters").innerHTML = filters.map(([key, label]) =>
      `<button class="chip ${histFilter === key ? "active" : ""}" data-filter="${key}">${label}</button>`).join("");

    const shown = h.filter(x =>
      histFilter === "all" ? true
      : histFilter === "limited" ? x.limited
      : histFilter === "pity" ? x.isPity
      : x.rarity === histFilter).reverse();

    $("#histList").innerHTML = shown.length ? shown.map(x => {
      const item = getItem(x.itemId, x.snap);
      return `
        <div class="hist-row rar-${item.rarity}" data-n="${x.n}">
          <span class="hist-num">#${x.n}<small>Turn ${x.turn}</small></span>
          <div class="hist-thumb">${artHTML(item)}</div>
          <div>
            <div class="hist-name">${esc(item.name)}</div>
            <div class="hist-tags"><span class="rtag">${item.rarity}</span>${tagsHTML(x)}</div>
          </div>
          <button class="btn-small" data-act="keep" title="Add to inventory">+ Keep</button>
        </div>`;
    }).join("") : `<div class="empty">${h.length ? "No pulls match this filter." : "No pulls yet."}</div>`;
  }

  $("#histFilters").addEventListener("click", e => {
    const chip = e.target.closest("[data-filter]");
    if (!chip) return;
    histFilter = chip.dataset.filter;
    renderHistory();
  });
  $("#histList").addEventListener("click", e => {
    const row = e.target.closest(".hist-row");
    if (!row) return;
    const rec = state.history.find(x => x.n === Number(row.dataset.n));
    if (!rec) return;
    const item = getItem(rec.itemId, rec.snap);
    if (e.target.closest('[data-act="keep"]')) addToInventory(item, rec.n);
    else showItem(item, rec, { histN: rec.n });
  });

  function renderMute() {
    const speaker = `<path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>`;
    const waves = state.muted
      ? `<path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`
      : `<path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    $("#btnMute").innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${speaker}${waves}</svg>`;
    $("#btnMute").title = state.muted ? "Sound off" : "Sound on";
    const slider = $("#volSlider");
    slider.value = state.volume ?? 1;
    slider.classList.toggle("off", state.muted);
    slider.title = `Volume ${Math.round((state.volume ?? 1) * 100)}%`;
  }

  function renderAll() {
    syncRotation();
    renderBanner();
    renderStatus();
    renderInventory();
    renderHistory();
    renderMute();
  }

  /* ---------------------------------------------------------------
     Wiring
     --------------------------------------------------------------- */
  $$(".tab").forEach(tab => tab.addEventListener("click", () => {
    $$(".tab").forEach(t => t.classList.toggle("active", t === tab));
    $$(".view").forEach(v => v.classList.toggle("active", v.id === `view-${tab.dataset.view}`));
  }));

  $("#btnPull").addEventListener("click", () => doPull(true));
  $("#btnPull").addEventListener("mouseenter", () => altarPortal.setIntensity(1.8));
  $("#btnPull").addEventListener("mouseleave", () => altarPortal.setIntensity(1));
  $("#btnExtra").addEventListener("click", () => doPull(false));
  $("#btnPass").addEventListener("click", () => passTurn());
  $("#btnEnd").addEventListener("click", endEncounter);
  $("#btnUndo").addEventListener("click", undoLast);
  $("#btnRules").addEventListener("click", showRules);
  // Volume slider: moving it while muted turns sound back on.
  $("#volSlider").addEventListener("input", e => {
    Sfx.setVolume(e.target.value);
    if (state.muted && state.volume > 0) state.muted = false;
    renderMute();
  });
  $("#volSlider").addEventListener("change", () => { saveState(); Sfx.click(); });
  $("#btnMute").addEventListener("click", () => {
    state.muted = !state.muted;
    saveState();
    renderMute();
    Sfx.click();
  });

  document.addEventListener("keydown", e => {
    if (ovStage !== "closed") {
      if ([" ", "Enter", "Escape"].includes(e.key)) { e.preventDefault(); if (!e.repeat) overlayAdvance(); }
      return;
    }
    const modalOpen = $("#modal").classList.contains("open");
    if (e.key === "Escape" && modalOpen) closeModal();
    // Space pulls from the summon screen. Held-down repeats are ignored, so holding Space
    // can't chain pull → dismiss → pull. Typing in a form field is left alone.
    if (e.key === " " && !modalOpen && $("#view-summon").classList.contains("active")
        && !(e.target instanceof Element && e.target.closest("input, select, textarea"))) {
      e.preventDefault();
      if (!e.repeat) doPull(true);
    }
  });

  const problems = Gacha.validate();
  if (problems.length) {
    problems.forEach(p => console.warn("[items.js]", p));
    toast(`items.js has ${plural(problems.length, "problem")}. Open the browser console (F12) for details.`);
  }

  renderAll();

  // index.html?preview=<item-id> plays that item's reveal without touching your save.
  const previewId = new URLSearchParams(location.search).get("preview");
  if (previewId) {
    const item = Gacha.findItem(previewId);
    if (item) setTimeout(() => playReveal(item, { preview: true }), 300);
    else toast(`No item with id "${previewId}".`);
  }
})();
