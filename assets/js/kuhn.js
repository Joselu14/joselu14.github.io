/* Normal science and revolutions: the model.
   A port of Joselu Cabrera Guillermo's notebook "Science-Agent-Based-Model" (Model_Spanish.ipynb).
   It keeps the notebook's arithmetic and its order of random draws, and it uses the same random
   number generator as Python (Mersenne Twister, random() and randint()), so a seed gives the same
   run here as in the notebook. */
var KuhnEngine = (function () {
  "use strict";

  /* ---------- Python's random module ---------- */
  function PyRandom(seed) {
    var N = 624, mt = new Uint32Array(N), mti = N + 1;
    function initGenrand(s) {
      mt[0] = s >>> 0;
      for (mti = 1; mti < N; mti++) {
        var prev = mt[mti - 1] ^ (mt[mti - 1] >>> 30);
        mt[mti] = (Math.imul(1812433253, prev) + mti) >>> 0;
      }
    }
    function initByArray(key) {
      initGenrand(19650218);
      var i = 1, j = 0, k = Math.max(N, key.length), prev;
      for (; k; k--) {
        prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
        mt[i] = ((mt[i] ^ Math.imul(prev, 1664525)) + key[j] + j) >>> 0;
        i++; j++;
        if (i >= N) { mt[0] = mt[N - 1]; i = 1; }
        if (j >= key.length) j = 0;
      }
      for (k = N - 1; k; k--) {
        prev = mt[i - 1] ^ (mt[i - 1] >>> 30);
        mt[i] = ((mt[i] ^ Math.imul(prev, 1566083941)) - i) >>> 0;
        i++;
        if (i >= N) { mt[0] = mt[N - 1]; i = 1; }
      }
      mt[0] = 0x80000000;
    }
    function genrand() {
      var y, kk;
      if (mti >= N) {
        for (kk = 0; kk < N - 397; kk++) {
          y = (mt[kk] & 0x80000000) | (mt[kk + 1] & 0x7fffffff);
          mt[kk] = mt[kk + 397] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
        }
        for (; kk < N - 1; kk++) {
          y = (mt[kk] & 0x80000000) | (mt[kk + 1] & 0x7fffffff);
          mt[kk] = mt[kk + (397 - N)] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
        }
        y = (mt[N - 1] & 0x80000000) | (mt[0] & 0x7fffffff);
        mt[N - 1] = mt[396] ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0);
        mti = 0;
      }
      y = mt[mti++];
      y ^= y >>> 11;
      y ^= (y << 7) & 0x9d2c5680;
      y ^= (y << 15) & 0xefc60000;
      y ^= y >>> 18;
      return y >>> 0;
    }
    // random.seed(n) for a whole number n below 2^32 uses the key [n]
    initByArray([Math.abs(Math.floor(seed)) >>> 0]);
    return {
      random: function () {            // 53 random bits, as in Python
        var a = genrand() >>> 5, b = genrand() >>> 6;
        return (a * 67108864 + b) / 9007199254740992;
      },
      randint: function (lo, hi) {     // randrange(lo, hi + 1) via getrandbits, as in Python
        var n = hi - lo + 1, k = 0, r;
        while ((1 << k) <= n && k < 31) k++;   // n.bit_length()
        if (n >= 1 << 30) k = 31;
        do { r = genrand() >>> (32 - k); } while (r >= n);
        return lo + r;
      }
    };
  }

  /* ---------- the community ---------- */
  var ROWS = 30, COLS = 30, NSCI = ROWS * COLS;
  var NEIGH = (function () {          // Moore neighbourhood without wrap-around, row by row
    var out = [];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var list = [];
      for (var rr = Math.max(r - 1, 0); rr < Math.min(r + 2, ROWS); rr++)
        for (var cc = Math.max(c - 1, 0); cc < Math.min(c + 2, COLS); cc++)
          if (rr !== r || cc !== c) list.push(rr * COLS + cc);
      out.push(list);
    }
    return out;
  })();

  var DEFAULTS = { start: "hom", alpha: 5.8, D: 6.5, I: 1.1, p: 0.7, seed: 10, years: 300 };
  var PALETTE_SIZE = 12;

  /* Run the model. Returns the theory each scientist publishes in, every year (as theory ids
     numbered in order of appearance), each theory's colour, and each year's counts. */
  function run(opts) {
    var o = {}, key;
    for (key in DEFAULTS) o[key] = (opts && opts[key] !== undefined) ? opts[key] : DEFAULTS[key];
    var rng = PyRandom(o.seed), n = NSCI, T = o.years, i, j;

    // theory codes as in the notebook; ids are our own, in order of appearance
    var code = new Array(n);
    if (o.start === "hom") for (i = 0; i < n; i++) code[i] = 10;
    else if (o.start === "bif") { var half = Math.round(n / 2); for (i = 0; i < n; i++) code[i] = i < half ? 9 : 132; }
    else for (i = 0; i < n; i++) code[i] = rng.randint(0, n);
    var ch = new Float64Array(n);
    for (i = 0; i < n; i++) ch[i] = rng.random();

    var idOf = new Map(), codes = [], colour = [], born = [];
    var colourLoad = new Float64Array(PALETTE_SIZE);
    function newId(c, year) {
      var best = 0;
      for (var k = 1; k < PALETTE_SIZE; k++) if (colourLoad[k] < colourLoad[best]) best = k;
      colourLoad[best] += 1;            // a newcomer counts, so the next one gets another colour
      idOf.set(c, codes.length); codes.push(c); colour.push(best); born.push(year);
      return codes.length - 1;
    }
    var cur = new Int32Array(n);
    for (i = 0; i < n; i++) cur[i] = idOf.has(code[i]) ? idOf.get(code[i]) : newId(code[i], 0);

    var history = new Int32Array((T + 1) * n);
    history.set(cur, 0);
    var pubs = new Map();             // publications so far, per theory code
    for (i = 0; i < n; i++) pubs.set(code[i], (pubs.get(code[i]) || 0) + 1);
    var ever = new Set(pubs.keys());

    var faith = new Float64Array(n), next = new Array(n), nf = new Float64Array(8), acc = new Float64Array(8);
    var alpha = o.alpha, D = o.D, I = o.I, p = o.p;
    for (var year = 0; year < T; year++) {
      // colour load: how many scientists each colour covers this year
      colourLoad.fill(0);
      for (i = 0; i < n; i++) colourLoad[colour[cur[i]]] += 1;
      // faith of each scientist in their own theory
      for (i = 0; i < n; i++) {
        var nb = NEIGH[i], A = 0;
        for (j = 0; j < nb.length; j++) if (code[nb[j]] === code[i]) A++;
        var P = pubs.get(code[i]);
        faith[i] = ch[i] <= p ? Math.pow(A + 1, alpha) / (P + 1)
                              : Math.pow(A + 1, alpha) / Math.pow(P + 1, ch[i] * 2);
      }
      // each scientist chooses a theory for next year, all from this year's grid
      for (i = 0; i < n; i++) {
        var nbs = NEIGH[i], m = nbs.length, S = 0;
        for (j = 0; j < m; j++) { nf[j] = faith[nbs[j]]; S += nf[j]; }
        var den = S + I * ch[i] / (S + faith[i]) + faith[i] * D;
        var cum = 0;
        for (j = 0; j < m; j++) { cum += nf[j] / den; acc[j] = cum; }
        var stay = cum + faith[i] * D / den;
        var choice = rng.random();
        if (choice < acc[m - 1]) {
          for (j = 0; j < m; j++) if (choice < acc[j]) { next[i] = code[nbs[j]]; break; }
        } else if (choice < stay) {
          next[i] = code[i];
        } else {                        // a new theory, never held before
          var t = rng.randint(0, n * n);
          while (ever.has(t)) t = rng.randint(0, n * n);
          next[i] = t;
        }
      }
      for (i = 0; i < n; i++) {
        code[i] = next[i];
        if (!idOf.has(code[i])) newId(code[i], year + 1);
        cur[i] = idOf.get(code[i]);
        pubs.set(code[i], (pubs.get(code[i]) || 0) + 1);
        ever.add(code[i]);
      }
      history.set(cur, (year + 1) * n);
    }

    // counts per year: arrays of [id, count], oldest theory first
    var counts = [];
    for (var y = 0; y <= T; y++) {
      var cm = new Map();
      for (i = 0; i < n; i++) { var id = history[y * n + i]; cm.set(id, (cm.get(id) || 0) + 1); }
      counts.push(Array.from(cm.entries()).sort(function (a, b) { return a[0] - b[0]; }));
    }
    return { opts: o, years: T, n: n, history: history, counts: counts, colour: colour, born: born, codes: codes };
  }

  /* Kuhn's phases, using only the years up to `upTo`.
     A theory becomes a paradigm when more than half of the scientists hold it for at least
     `minYears` years in a row; it counts as the paradigm from the first of those years. */
  function phases(r, upTo, minYears) {
    minYears = minYears || 10;
    var half = r.n / 2, holder = [], y, k;
    for (y = 0; y <= upTo; y++) {
      var h = -1, c = r.counts[y];
      for (k = 0; k < c.length; k++) if (c[k][1] > half) { h = c[k][0]; break; }
      holder.push(h);
    }
    var paradigms = [], paradigm = -1, runId = -1, runStart = 0;
    for (y = 0; y <= upTo; y++) {
      if (holder[y] !== runId) { runId = holder[y]; runStart = y; }
      // a start in which one theory already has the majority (the one-theory start) begins in normal science
      if (runId >= 0 && runId !== paradigm && (y - runStart + 1 >= minYears || runStart === 0)) {
        paradigms.push({ id: runId, start: runStart, confirmed: y, number: paradigms.length + 1 });
        paradigm = runId;
      }
    }
    var phase = [], which = [];
    for (y = 0, k = -1; y <= upTo; y++) {
      while (k + 1 < paradigms.length && paradigms[k + 1].start <= y) k++;
      which.push(k);
      phase.push(k < 0 ? "pre" : (holder[y] === paradigms[k].id ? "normal" : "crisis"));
    }
    return { holder: holder, paradigms: paradigms, phase: phase, paradigmAt: which };
  }

  return { run: run, phases: phases, PyRandom: PyRandom, DEFAULTS: DEFAULTS, ROWS: ROWS, COLS: COLS, PALETTE_SIZE: PALETTE_SIZE };
})();
if (typeof module !== "undefined" && module.exports) module.exports = KuhnEngine;

/* ---------- the page: grid, history chart, controls ---------- */
(function () {
  "use strict";
  if (typeof document === "undefined") return;
  var root = document.getElementById("kuhn");
  if (!root) return;
  var E = KuhnEngine, DEF = E.DEFAULTS, T = DEF.years;

  var PALETTES = {   // pigments: indigo, ochre, verdigris, celadon, umber, smalt, sap green, madder, slate, vermilion, murex, teal
    light: ["#2d3f8f", "#c9962c", "#3d8b77", "#9bbf9f", "#6e4b2e", "#6082c6", "#7a8c2b", "#c77d8e", "#5a6372", "#d0582c", "#6b2f68", "#2b7186"],
    dark:  ["#6f82d6", "#d8aa47", "#58ab95", "#a6c9a9", "#a07a55", "#8aa5e0", "#9db046", "#dd9bab", "#8a93a3", "#e2774c", "#a462a0", "#4f9cb3"]
  };
  var SPEEDS = { slow: 5, normal: 14, fast: 40 };   // years per second
  var RANGES = { alpha: [0, 8], D: [0, 15], I: [0, 10], p: [0, 1] };

  var q = function (s) { return root.querySelector(s); };
  var qa = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };
  var gridCv = q("#kuhn-grid"), chartCv = q("#kuhn-chart");
  var playBtn = q("#kuhn-play"), stepBtn = q("#kuhn-step"), zeroBtn = q("#kuhn-zero");
  var yearIn = q("#kuhn-year"), yearOut = q("#kuhn-year-out"), statusEl = q("#kuhn-status");
  var seedIn = q("#kuhn-seed");

  var settings = {}, run = null, year = 0, playing = false, speed = "normal", lastT = 0, carry = 0;

  function lang() { return document.documentElement.getAttribute("data-lang") === "es" ? "es" : "en"; }
  function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }
  function isDark() {
    var h = css("--paper").replace("#", "");
    if (h.length !== 6) return false;
    var r = parseInt(h.substr(0, 2), 16), g = parseInt(h.substr(2, 2), 16), b = parseInt(h.substr(4, 2), 16);
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 100;
  }
  function palette() { return PALETTES[isDark() ? "dark" : "light"]; }
  function fmt(x) { return (Math.round(x * 100) / 100).toString(); }

  /* ---------- settings: from the address, to the address ---------- */
  function readSettings() {
    var sp = new URLSearchParams(location.search), s = {};
    s.start = ["hom", "bif", "het"].indexOf(sp.get("start")) >= 0 ? sp.get("start") : DEF.start;
    ["alpha", "D", "I", "p"].forEach(function (k) {
      var v = parseFloat(sp.get(k));
      s[k] = isFinite(v) && v >= RANGES[k][0] && v <= RANGES[k][1] ? v : DEF[k];
    });
    var seed = parseInt(sp.get("seed"), 10);
    s.seed = isFinite(seed) && seed >= 0 && seed <= 4294967295 ? seed : DEF.seed;
    return s;
  }
  function writeSettings() {
    var sp = new URLSearchParams();
    ["start", "seed", "alpha", "D", "I", "p"].forEach(function (k) { if (settings[k] !== DEF[k]) sp.set(k, settings[k]); });
    var qs = sp.toString();
    try { history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash); } catch (e) { /* file:// */ }
  }

  /* ---------- running ---------- */
  var pending = false;
  function recompute() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(function () {
      pending = false;
      run = E.run(settings);
      render();
    });
  }
  function syncControls() {
    qa("[data-start]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-start") === settings.start)); });
    qa("[data-start-note]").forEach(function (n) { n.hidden = n.getAttribute("data-start-note") !== settings.start; });
    ["alpha", "D", "I", "p"].forEach(function (k) {
      var inp = q("#kuhn-" + k); inp.value = settings[k];
      q("#kuhn-" + k + "-out").textContent = fmt(settings[k]);
    });
    seedIn.value = settings.seed;
    qa("[data-speed]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-speed") === speed)); });
    var atDefaults = ["alpha", "D", "I", "p", "seed"].every(function (k) { return settings[k] === DEF[k]; });
    q("#kuhn-defaults").hidden = atDefaults;
  }
  function change(k, v) {
    settings[k] = v;
    syncControls();
    writeSettings();
    recompute();
  }

  /* ---------- the grid ---------- */
  function fitCanvas(cv, h) {
    var dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
    var w = cv.clientWidth; h = h || w;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    }
    cv.style.height = h + "px";
    return { ctx: cv.getContext("2d"), dpr: dpr, w: w, h: h };
  }
  function drawGrid() {
    var f = fitCanvas(gridCv), ctx = f.ctx, W = gridCv.width, pal = palette();
    var R = E.ROWS, C = E.COLS, n = R * C, gap = Math.max(1, Math.round(f.dpr));
    ctx.fillStyle = css("--paper"); ctx.fillRect(0, 0, W, W);
    var base = year * n;
    for (var r = 0; r < R; r++) {
      var y0 = Math.round(r * W / R), y1 = Math.round((r + 1) * W / R);
      for (var c = 0; c < C; c++) {
        var x0 = Math.round(c * W / C), x1 = Math.round((c + 1) * W / C);
        ctx.fillStyle = pal[run.colour[run.history[base + r * C + c]]];
        ctx.fillRect(x0, y0, x1 - x0 - gap, y1 - y0 - gap);
      }
    }
  }

  /* ---------- the history chart ---------- */
  var L = { gutter: 40, label: 20, band: 24, shares: 130, theories: 72, axis: 22, gap: 12 };
  function chartLayout(w) {
    var y = 0, o = {};
    o.bandLabel = y; y += L.label; o.band = [y, y + L.band]; y += L.band + L.gap;
    o.sharesLabel = y; y += L.label; o.shares = [y, y + L.shares]; y += L.shares + L.gap;
    o.theoriesLabel = y; y += L.label; o.theories = [y, y + L.theories]; y += L.theories + 4;
    o.axis = y; y += L.axis;
    o.h = y; o.x0 = L.gutter; o.x1 = w - 2;
    return o;
  }
  var TXT = {
    en: { phase: "Phase", shares: "Share of the community, by theory", theories: "Number of theories (log scale)",
          pre: "Pre-paradigm", crisis: "Crisis", paradigm: "Paradigm", year: "year" },
    es: { phase: "Fase", shares: "Proporción de la comunidad, por teoría", theories: "Número de teorías (escala logarítmica)",
          pre: "Preparadigma", crisis: "Crisis", paradigm: "Paradigma", year: "año" }
  };
  function drawChart() {
    var w = chartCv.clientWidth, lay = chartLayout(w), f = fitCanvas(chartCv, lay.h), ctx = f.ctx, d = f.dpr;
    var tx = TXT[lang()], pal = palette(), n = run.n, ph = E.phases(run, year);
    var ink = css("--ink"), ink2 = css("--ink-2"), paper = css("--paper"), paper2 = css("--paper-2"), rule = css("--rule"), carmine = css("--carmine");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, chartCv.width, chartCv.height);
    ctx.scale(d, d);
    var X = function (yr) { return lay.x0 + (lay.x1 - lay.x0) * yr / (T + 1); };
    var px = function (v) { return Math.round(v * d) / d; };
    var font = function (size, italic) { return (italic ? "italic " : "") + size + "px Alegreya, Georgia, serif"; };

    // labels
    ctx.fillStyle = ink2; ctx.font = font(15, true); ctx.textBaseline = "alphabetic";
    ctx.fillText(tx.phase, lay.x0, lay.bandLabel + 14);
    ctx.fillText(tx.shares, lay.x0, lay.sharesLabel + 14);
    ctx.fillText(tx.theories, lay.x0, lay.theoriesLabel + 14);

    // frames for the empty future
    ctx.strokeStyle = rule; ctx.lineWidth = 1;
    [lay.band, lay.shares, lay.theories].forEach(function (b) {
      ctx.strokeRect(px(lay.x0) + 0.5 / d, px(b[0]) + 0.5 / d, px(lay.x1 - lay.x0) - 1 / d, px(b[1] - b[0]) - 1 / d);
    });

    // shares: one column per year, theories stacked oldest first
    var s0 = lay.shares[0], s1 = lay.shares[1], hS = s1 - s0;
    for (var y = 0; y <= year; y++) {
      var xa = px(X(y)), xb = px(X(y + 1)), cum = 0, cs = run.counts[y];
      for (var k = 0; k < cs.length; k++) {
        var top = px(s1 - (cum + cs[k][1]) / n * hS), bot = px(s1 - cum / n * hS);
        cum += cs[k][1];
        if (bot - top <= 0) continue;
        ctx.fillStyle = pal[run.colour[cs[k][0]]];
        ctx.fillRect(xa, top, xb - xa, bot - top);
      }
    }
    // half-way line
    ctx.strokeStyle = paper; ctx.globalAlpha = 0.7; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(lay.x0, px((s0 + s1) / 2) + 0.5 / d); ctx.lineTo(lay.x1, px((s0 + s1) / 2) + 0.5 / d); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;
    ctx.fillStyle = ink2; ctx.font = font(14, false); ctx.textAlign = "right";
    ctx.fillText("½", lay.x0 - 6, (s0 + s1) / 2 + 4);
    ctx.textAlign = "left";

    // phases
    var b0 = lay.band[0], b1 = lay.band[1], segs = [];
    for (y = 0; y <= year; y++) {
      var key = ph.phase[y] + ":" + ph.paradigmAt[y];
      if (segs.length && segs[segs.length - 1].key === key) segs[segs.length - 1].end = y;
      else segs.push({ key: key, phase: ph.phase[y], k: ph.paradigmAt[y], start: y, end: y });
    }
    segs.forEach(function (s) {
      var xa = px(X(s.start)), xb = px(X(s.end + 1)), wdt = xb - xa, label = "", color = ink;
      ctx.save(); ctx.beginPath(); ctx.rect(xa, b0, wdt, b1 - b0); ctx.clip();
      if (s.phase === "pre") { ctx.fillStyle = paper2; ctx.fillRect(xa, b0, wdt, b1 - b0); label = tx.pre; color = ink2; }
      else if (s.phase === "normal") {
        ctx.fillStyle = pal[run.colour[ph.paradigms[s.k].id]]; ctx.fillRect(xa, b0, wdt, b1 - b0);
        color = isDark() ? "#141826" : "#ffffff";
        ctx.font = font(14, false);
        label = tx.paradigm + " " + (s.k + 1);
        if (ctx.measureText(label).width + 10 > wdt) label = String(s.k + 1);
      } else {
        ctx.fillStyle = paper; ctx.fillRect(xa, b0, wdt, b1 - b0);
        ctx.strokeStyle = ink2; ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
        for (var hx = xa - (b1 - b0); hx < xb; hx += 5) { ctx.beginPath(); ctx.moveTo(hx, b1); ctx.lineTo(hx + (b1 - b0), b0); ctx.stroke(); }
        ctx.globalAlpha = 1; label = tx.crisis;
      }
      ctx.font = font(14, s.phase !== "normal");
      var tw = ctx.measureText(label).width;
      if (tw + 10 <= wdt) {
        if (s.phase === "crisis") { ctx.fillStyle = paper; ctx.fillRect(xa + 3, b0 + 4, tw + 6, b1 - b0 - 8); }
        ctx.fillStyle = color; ctx.fillText(label, xa + 6, b1 - 6);
      }
      ctx.restore();
    });
    // revolutions
    ctx.strokeStyle = carmine; ctx.lineWidth = 2;
    ph.paradigms.forEach(function (p, i) {
      if (i === 0) return;
      var x = px(X(p.start)) + 1;
      ctx.beginPath(); ctx.moveTo(x, b0 - 3); ctx.lineTo(x, s1); ctx.stroke();
    });

    // number of theories, log scale from 1 to 1000
    var t0 = lay.theories[0], t1 = lay.theories[1], hT = t1 - t0;
    var Y = function (v) { return t1 - Math.log10(Math.max(1, v)) / 3 * hT; };
    ctx.fillStyle = ink2; ctx.font = font(13, false); ctx.textAlign = "right";
    [1, 10, 100, 1000].forEach(function (v) {
      var yy = Y(v);
      ctx.fillText(String(v), lay.x0 - 6, Math.min(t1, Math.max(t0 + 8, yy + 4)));
      ctx.strokeStyle = rule; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lay.x0, px(yy) + 0.5 / d); ctx.lineTo(lay.x1, px(yy) + 0.5 / d); ctx.stroke();
    });
    ctx.textAlign = "left";
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5; ctx.lineJoin = "round"; ctx.beginPath();
    for (y = 0; y <= year; y++) {
      var xm = (X(y) + X(y + 1)) / 2, ym = Y(run.counts[y].length);
      if (y === 0) ctx.moveTo(xm, ym); else ctx.lineTo(xm, ym);
    }
    ctx.stroke();

    // years
    ctx.fillStyle = ink2; ctx.font = font(14, false); ctx.textAlign = "center";
    for (var t = 0; t <= T; t += 50) ctx.fillText(String(t), Math.min(lay.x1 - 10, Math.max(lay.x0 + 6, X(t + 0.5))), lay.axis + 15);
    ctx.textAlign = "left";
  }

  /* ---------- what is happening, in words ---------- */
  function pct(x, l) { return Math.round(x * 100) + (l === "es" ? " %" : "%"); }
  function statusText(l) {
    var ph = E.phases(run, year), phase = ph.phase[year], k = ph.paradigmAt[year], cs = run.counts[year], n = run.n;
    var nT = cs.length, topShare = 0, shareOf = {}, i;
    for (i = 0; i < cs.length; i++) { shareOf[cs[i][0]] = cs[i][1] / n; if (cs[i][1] / n > topShare) topShare = cs[i][1] / n; }
    var holder = ph.holder[year], runLen = 0;
    if (holder >= 0) for (i = year; i >= 0 && ph.holder[i] === holder; i--) runLen++;
    var revs = Math.max(0, ph.paradigms.length - 1);
    var head, body;
    if (l === "es") {
      head = "Año " + year + ": " + { pre: "preparadigma", normal: "ciencia normal", crisis: "crisis" }[phase];
      if (phase === "pre") {
        body = "Ninguna teoría ha tenido aún la mayoría durante diez años. La mayor reúne al " + pct(topShare, l) + " de la comunidad.";
        if (holder >= 0) body += " Una teoría tiene la mayoría desde hace " + runLen + (runLen === 1 ? " año" : " años") + "; a los diez se convierte en el primer paradigma.";
      } else if (phase === "normal") {
        var p = ph.paradigms[k];
        body = "El paradigma " + p.number + (p.number > 1 ? ", que se impuso en el año " + p.start + "," : "") + " reúne al " + pct(shareOf[p.id] || 0, l) + " de la comunidad.";
      } else {
        var pc = ph.paradigms[k], s = shareOf[pc.id] || 0;
        body = s > 0 ? "El paradigma " + pc.number + " perdió la mayoría: reúne al " + pct(s, l) + " de la comunidad."
                     : "El paradigma " + pc.number + " perdió la mayoría y ya nadie lo sostiene.";
        if (holder >= 0) body += " Otra teoría tiene la mayoría desde hace " + runLen + (runLen === 1 ? " año" : " años") + "; a los diez se convierte en el nuevo paradigma.";
      }
      body += " " + nT + (nT === 1 ? " teoría en juego." : " teorías en juego.") + " Revoluciones hasta ahora: " + revs + ".";
    } else {
      head = "Year " + year + ": " + { pre: "pre-paradigm", normal: "normal science", crisis: "crisis" }[phase];
      if (phase === "pre") {
        body = "No theory has yet held a majority for ten years. The largest has " + pct(topShare, l) + " of the scientists.";
        if (holder >= 0) body += " One theory has held the majority for " + runLen + (runLen === 1 ? " year" : " years") + "; at ten it becomes the first paradigm.";
      } else if (phase === "normal") {
        var p2 = ph.paradigms[k];
        body = "Paradigm " + p2.number + (p2.number > 1 ? ", which took over in year " + p2.start + "," : "") + " holds " + pct(shareOf[p2.id] || 0, l) + " of the scientists.";
      } else {
        var pc2 = ph.paradigms[k], s2 = shareOf[pc2.id] || 0;
        body = s2 > 0 ? "Paradigm " + pc2.number + " has lost its majority: it holds " + pct(s2, l) + " of the scientists."
                      : "Paradigm " + pc2.number + " has lost its majority and no scientist holds it any more.";
        if (holder >= 0) body += " Another theory has held the majority for " + runLen + (runLen === 1 ? " year" : " years") + "; at ten it becomes the new paradigm.";
      }
      body += " " + nT + (nT === 1 ? " theory in play." : " theories in play.") + " Revolutions so far: " + revs + ".";
    }
    return { head: head, body: body };
  }

  function render() {
    if (!run) return;
    if (year > T) year = T;
    yearIn.value = year; yearOut.textContent = year;
    drawGrid(); drawChart();
    var st = statusText(lang());
    q("#kuhn-status-head").textContent = st.head;
    q("#kuhn-status-body").textContent = st.body;
  }

  /* ---------- playing ---------- */
  function setPlaying(on) {
    playing = on;
    playBtn.setAttribute("aria-pressed", String(on));
    qa("#kuhn-play [data-when]").forEach(function (s) { s.hidden = (s.getAttribute("data-when") === "playing") !== on; });
    statusEl.setAttribute("aria-live", on ? "off" : "polite");
    if (on) { lastT = 0; carry = 0; requestAnimationFrame(tick); }
  }
  function tick(t) {
    if (!playing) return;
    if (!lastT) lastT = t;
    carry += (t - lastT) / 1000 * SPEEDS[speed]; lastT = t;
    var steps = Math.floor(carry);
    if (steps > 0) {
      carry -= steps;
      year = Math.min(T, year + steps);
      render();
      if (year >= T) { setPlaying(false); return; }
    }
    requestAnimationFrame(tick);
  }

  /* ---------- wiring ---------- */
  playBtn.addEventListener("click", function () {
    if (playing) { setPlaying(false); return; }
    if (year >= T) { year = 0; render(); }
    setPlaying(true);
  });
  stepBtn.addEventListener("click", function () { setPlaying(false); if (year < T) { year++; render(); } });
  zeroBtn.addEventListener("click", function () { setPlaying(false); year = 0; render(); });
  yearIn.addEventListener("input", function () { setPlaying(false); year = parseInt(yearIn.value, 10) || 0; render(); });
  qa("[data-speed]").forEach(function (b) { b.addEventListener("click", function () { speed = b.getAttribute("data-speed"); syncControls(); }); });
  qa("[data-start]").forEach(function (b) {
    b.addEventListener("click", function () { if (settings.start !== b.getAttribute("data-start")) { setPlaying(false); year = 0; change("start", b.getAttribute("data-start")); } });
  });
  ["alpha", "D", "I", "p"].forEach(function (k) {
    q("#kuhn-" + k).addEventListener("input", function (e) { change(k, parseFloat(e.target.value)); });
  });
  seedIn.addEventListener("change", function () {
    var v = parseInt(seedIn.value, 10);
    if (isFinite(v) && v >= 0 && v <= 4294967295) change("seed", v); else seedIn.value = settings.seed;
  });
  q("#kuhn-newseed").addEventListener("click", function () { change("seed", 1 + Math.floor(Math.random() * 99999)); });
  q("#kuhn-defaults").addEventListener("click", function () {
    ["alpha", "D", "I", "p", "seed"].forEach(function (k) { settings[k] = DEF[k]; });
    change("seed", DEF.seed);
  });
  // tap or drag on the chart to go to a year
  var dragging = false;
  function yearAt(ev) {
    var r = chartCv.getBoundingClientRect(), lay = chartLayout(chartCv.clientWidth);
    var yr = Math.floor((ev.clientX - r.left - lay.x0) / (lay.x1 - lay.x0) * (T + 1));
    return Math.max(0, Math.min(T, yr));
  }
  chartCv.addEventListener("pointerdown", function (ev) { dragging = true; setPlaying(false); year = yearAt(ev); render(); try { chartCv.setPointerCapture(ev.pointerId); } catch (e) {} });
  chartCv.addEventListener("pointermove", function (ev) { if (dragging) { var y = yearAt(ev); if (y !== year) { year = y; render(); } } });
  ["pointerup", "pointercancel"].forEach(function (t) { chartCv.addEventListener(t, function () { dragging = false; }); });

  // redraw when the language, the theme or the size changes
  new MutationObserver(render).observe(document.documentElement, { attributes: true, attributeFilter: ["data-lang", "data-theme"] });
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", render);
  }
  if (window.ResizeObserver) new ResizeObserver(function () { render(); }).observe(root);
  else window.addEventListener("resize", render);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(render);

  settings = readSettings();
  syncControls();
  run = E.run(settings);
  render();
  root.classList.add("ready");
  window.KuhnPage = { get year() { return year; }, setYear: function (y) { setPlaying(false); year = Math.max(0, Math.min(T, y)); render(); }, get run() { return run; }, get settings() { return settings; } };
})();
