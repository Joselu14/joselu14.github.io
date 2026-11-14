/* =========================================================
   main.js — language switch, light/dark switch,
   the arithmetic triangle (home), the random plate (404 page),
   and the gallery (visual work).
   ========================================================= */
(function () {
  "use strict";
  var root = document.documentElement;
  var hooks = [];               // functions to re-run when the language changes

  function store(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode: ignore */ }
  }
  function lang() { return root.getAttribute("data-lang") === "es" ? "es" : "en"; }

  /* ---------- Language ---------- */
  function setLang(l) {
    root.setAttribute("data-lang", l);
    root.lang = l;
    store("lang", l);
    document.querySelectorAll("[data-set-lang]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-set-lang") === l));
    });
    var t = root.getAttribute("data-title-" + l);
    if (t) document.title = t;
    // alt texts and aria-labels can't hold two languages, so swap them
    document.querySelectorAll("[data-alt-en]").forEach(function (el) {
      el.alt = el.getAttribute("data-alt-" + l) || el.alt;
    });
    document.querySelectorAll("[data-label-en]").forEach(function (el) {
      el.setAttribute("aria-label", el.getAttribute("data-label-" + l));
    });
    hooks.forEach(function (fn) { fn(); });
  }
  document.querySelectorAll("[data-set-lang]").forEach(function (b) {
    b.addEventListener("click", function () { setLang(b.getAttribute("data-set-lang")); });
  });

  /* ---------- Light / dark ---------- */
  var themeBtn = document.getElementById("theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      var explicit = root.getAttribute("data-theme");
      var isDark = explicit ? explicit === "dark"
        : window.matchMedia("(prefers-color-scheme: dark)").matches;
      var next = isDark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      store("theme", next);
    });
  }

  /* ---------- The arithmetic triangle (home page) ----------
     Each toss of a coin with an unknown, fixed bias moves one step down the
     arithmetic triangle: heads to the right, tails to the left. The number in a
     cell, C(n, h), counts the sequences of n tosses with h heads. With a uniform
     Beta(1, 1) prior, the chance that the next toss is heads is (h + 1) / (n + 2),
     Laplace's rule of succession. */
  var triBox = document.getElementById("tri");
  if (triBox) {
    var RMIN = 9, RMAX = 12;           // rows shown at rest / at most
    var seq = [];

    var binom = function (n, k) {
      var r = 1;
      for (var i = 1; i <= k; i++) r = r * (n - k + i) / i;
      return Math.round(r);
    };

    // Builds the ASCII triangle as HTML. Visited cells and edges are wrapped in spans.
    var drawTriangle = function (tosses, fresh) {
      var n = tosses.length, shown = Math.min(n, RMAX), R = Math.max(RMIN, shown);
      var W = 4 * R + 7, c0 = 2 * R + 3, h = [0], lines = [], r, k, x;
      for (var i = 0; i < shown; i++) h.push(h[i] + (tosses[i] === "H" ? 1 : 0));
      var blank = function () { var a = []; for (var j = 0; j < W; j++) a.push({ c: " ", k: "" }); return a; };
      for (r = 0; r <= R; r++) {
        var line = blank();
        for (k = 0; k <= r; k++) {
          x = c0 + 4 * k - 2 * r;
          var s = String(binom(r, k)), st = x - Math.floor(s.length / 2), cls = "";
          if (r <= shown && k === h[r]) {
            cls = r === shown ? "cur" : "p";
            if (r === shown) { s = " " + s + " "; st -= 1; if (fresh) cls += " new"; }
          }
          for (var q = 0; q < s.length; q++) line[st + q] = { c: s[q], k: cls };
        }
        lines.push(line);
        if (r < R) {
          var con = blank();
          for (k = 0; k <= r; k++) {
            x = c0 + 4 * k - 2 * r;
            var onPath = r < shown && k === h[r], last = fresh && r === shown - 1;
            con[x - 1] = { c: "/", k: onPath && tosses[r] === "T" ? (last ? "p new" : "p") : "" };
            con[x + 1] = { c: "\\", k: onPath && tosses[r] === "H" ? (last ? "p new" : "p") : "" };
          }
          lines.push(con);
        }
      }
      var html = lines.map(function (line) {
        var out = "", cur = null, buf = "";
        var flush = function () { if (buf) out += cur ? '<span class="' + cur + '">' + buf + "</span>" : buf; buf = ""; };
        line.forEach(function (ch) {
          if (ch.k !== cur) { flush(); cur = ch.k; }
          buf += ch.c === "<" ? "&lt;" : ch.c === "&" ? "&amp;" : ch.c;
        });
        flush();
        return out.replace(/\s+$/, "");
      }).join("\n");
      return { html: html, cols: W };
    };

    var fmt = function (x, l) {
      return new Intl.NumberFormat(l === "es" ? "es-PE" : "en-US", { maximumFractionDigits: 1 }).format(x);
    };

    var updateTriangle = function (fresh) {
      var l = lang(), n = seq.length, heads = 0;
      seq.forEach(function (t) { if (t === "H") heads++; });
      var tails = n - heads, a = heads + 1, b = n + 2, pct = fmt(100 * a / b, l);
      var t = drawTriangle(seq, fresh);
      triBox.innerHTML = t.html;
      triBox.style.setProperty("--cols", t.cols);
      document.getElementById("frac").textContent = a + "/" + b;
      document.getElementById("pct").textContent = "(" + pct + (l === "es" ? " %)" : "%)");
      var letters = seq.map(function (x) { return l === "es" ? (x === "H" ? "C" : "S") : x; });
      document.getElementById("seq").textContent = (n > 12 ? "… " : "") + letters.slice(-12).join(" ");
      document.getElementById("tri-stop").hidden = n <= RMAX;
      var paths = n <= 50 ? binom(n, heads).toLocaleString(l === "es" ? "es-PE" : "en-US") : null;
      var msg;
      if (l === "es") {
        msg = heads + (heads === 1 ? " cara, " : " caras, ") + tails + (tails === 1 ? " sello. " : " sellos. ") +
          (paths ? paths + (paths === "1" ? " secuencia de lanzamientos termina aquí. " : " secuencias de lanzamientos terminan aquí. ") : "") +
          "Probabilidad de que el próximo lanzamiento sea cara: " + a + " de " + b + ", " + pct + " %.";
      } else {
        msg = heads + (heads === 1 ? " head, " : " heads, ") + tails + (tails === 1 ? " tail. " : " tails. ") +
          (paths ? paths + (paths === "1" ? " sequence of tosses ends here. " : " sequences of tosses end here. ") : "") +
          "Chance the next toss is heads: " + a + " in " + b + ", " + pct + "%.";
      }
      document.getElementById("tri-status").textContent = n ? msg : "";
    };

    document.querySelectorAll("[data-toss]").forEach(function (button) {
      button.disabled = false;
      button.addEventListener("click", function () {
        var v = button.getAttribute("data-toss");
        if (v) seq.push(v); else seq = [];
        updateTriangle(Boolean(v));
      });
    });
    hooks.push(function () { updateTriangle(false); });
    updateTriangle(false);
  }

  /* ---------- Plates: public-domain images (404 page) ----------
     Every image here is public domain (or CC0). Full credits: credits.html. */
  var PLATES = [
    { id: "duck-rabbit", tint: "indigo", src: "assets/img/plates/duck-rabbit.png", size: [960, 815],
      title: { en: "Kaninchen und Ente (Rabbit and Duck)", es: "Kaninchen und Ente (Conejo y pato)" },
      who: { en: "Unknown artist, Fliegende Blätter, 23 October 1892", es: "Artista desconocido, Fliegende Blätter, 23 de octubre de 1892" },
      alt: { en: "Ink drawing that can be seen either as a duck or as a rabbit", es: "Dibujo a tinta que puede verse como un pato o como un conejo" } },
    { id: "yang-hui", tint: "ochre", src: "assets/img/plates/yang-hui-triangle.gif", size: [704, 1095],
      title: { en: "The arithmetic triangle (Jia Xian–Yang Hui triangle)", es: "El triángulo aritmético (triángulo de Jia Xian–Yang Hui)" },
      who: { en: "Zhu Shijie, Siyuan yujian (Jade Mirror of the Four Unknowns), 1303", es: "Zhu Shijie, Siyuan yujian (Espejo de jade de las cuatro incógnitas), 1303" },
      alt: { en: "Chinese woodblock diagram of binomial coefficients arranged in a triangle", es: "Diagrama xilográfico chino de coeficientes binomiales dispuestos en triángulo" } },
    { id: "cajal", aged: true, tint: "cochineal", src: "assets/img/plates/cajal-purkinje.jpg", size: [720, 1024],
      title: { en: "A Purkinje neuron from the human cerebellum", es: "Una neurona de Purkinje del cerebelo humano" },
      who: { en: "Santiago Ramón y Cajal, c. 1900. Instituto Cajal (CSIC), Madrid", es: "Santiago Ramón y Cajal, c. 1900. Instituto Cajal (CSIC), Madrid" },
      alt: { en: "Ink drawing of a neuron with a dense, branching dendritic tree", es: "Dibujo a tinta de una neurona con un árbol dendrítico denso y ramificado" } },
    { id: "fludd", aged: true, tint: "verdigris", src: "assets/img/plates/fludd-oculus-imaginationis.jpg", size: [850, 587],
      title: { en: "Oculus imaginationis (The eye of imagination)", es: "Oculus imaginationis (El ojo de la imaginación)" },
      who: { en: "Robert Fludd, Utriusque Cosmi … Historia, Oppenheim, 1617–21", es: "Robert Fludd, Utriusque Cosmi … Historia, Oppenheim, 1617–21" },
      alt: { en: "Engraving of a head in profile with an eye projecting images onto a screen", es: "Grabado de una cabeza de perfil con un ojo que proyecta imágenes sobre una pantalla" } },
    { id: "guaman-poma", tint: "ochre", src: "assets/img/plates/guaman-poma-contador.png", size: [407, 584],
      title: { en: "Contador mayor y tesorero: a khipu keeper with a yupana", es: "Contador mayor y tesorero: un quipucamayoc con su yupana" },
      who: { en: "Felipe Guaman Poma de Ayala, El primer nueva corónica y buen gobierno, c. 1615, p. 360", es: "Felipe Guaman Poma de Ayala, El primer nueva corónica y buen gobierno, c. 1615, p. 360" },
      alt: { en: "Drawing of an Andean accountant holding a knotted-cord khipu, with a counting board below", es: "Dibujo de un contador andino que sostiene un quipu, con un tablero de cálculo abajo" } },
    { id: "cardsharps", src: "assets/img/plates/caravaggio-cardsharps.jpg", size: [1280, 921],
      title: { en: "The Cardsharps", es: "Los tramposos (I bari)" },
      who: { en: "Caravaggio, c. 1594. Kimbell Art Museum, Fort Worth", es: "Caravaggio, c. 1594. Kimbell Art Museum, Fort Worth" },
      alt: { en: "Painting of a card game in which one player is being cheated", es: "Pintura de una partida de cartas en la que se engaña a un jugador" } },
    { id: "astronomer", src: "assets/img/plates/vermeer-astronomer.jpg", size: [960, 1091],
      title: { en: "The Astronomer", es: "El astrónomo" },
      who: { en: "Johannes Vermeer, c. 1668. Musée du Louvre, Paris", es: "Johannes Vermeer, c. 1668. Museo del Louvre, París" },
      alt: { en: "Painting of a scholar at a window reaching toward a celestial globe", es: "Pintura de un estudioso junto a una ventana que extiende la mano hacia un globo celeste" } },
    { id: "nightingale", src: "assets/img/plates/nightingale-rose.jpg", size: [1280, 700],
      title: { en: "Diagram of the causes of mortality in the army in the East", es: "Diagrama de las causas de mortalidad en el ejército de Oriente" },
      who: { en: "Florence Nightingale, 1858", es: "Florence Nightingale, 1858" },
      alt: { en: "Two coloured polar-area 'rose' charts of monthly deaths", es: "Dos diagramas de área polar ('rosas') coloreados con las muertes mensuales" } },
    { id: "melencolia", aged: true, tint: "verdigris", src: "assets/img/plates/durer-melencolia.jpg", size: [960, 1232],
      title: { en: "Melencolia I", es: "Melencolia I" },
      who: { en: "Albrecht Dürer, 1514. The Metropolitan Museum of Art (CC0)", es: "Albrecht Dürer, 1514. The Metropolitan Museum of Art (CC0)" },
      alt: { en: "Engraving of a winged figure in thought, surrounded by instruments and a magic square", es: "Grabado de una figura alada pensativa, rodeada de instrumentos y un cuadrado mágico" } },
    { id: "voltolina", src: "assets/img/plates/voltolina-lecture-bologna.jpg", size: [1280, 1049],
      title: { en: "Henricus de Alemannia lecturing to students in Bologna", es: "Henricus de Alemannia dando lección a sus estudiantes en Bolonia" },
      who: { en: "Laurentius de Voltolina, second half of the 14th century. Kupferstichkabinett, Berlin", es: "Laurentius de Voltolina, segunda mitad del siglo XIV. Kupferstichkabinett, Berlín" },
      alt: { en: "Medieval miniature of a teacher lecturing from a high chair to rows of students with open books", es: "Miniatura medieval de un maestro que da lección desde una cátedra a filas de estudiantes con libros abiertos" } }
  ];
  var ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  var plateBox = document.getElementById("random-plate");
  if (plateBox) {
    var base = document.body.getAttribute("data-root") || "";
    var currentPlate = null;
    var renderPlate = function (i) {
      var p = PLATES[i];
      currentPlate = i;
      plateBox.innerHTML = "";
      var fig = document.createElement("figure");
      fig.className = "plate";
      if (p.tint) fig.setAttribute("data-tint", p.tint);
      if (p.aged) fig.setAttribute("data-aged", "");
      var mat = document.createElement("div");
      mat.className = "mat";
      var img = document.createElement("img");
      img.src = base + p.src;
      img.width = p.size[0]; img.height = p.size[1];
      mat.appendChild(img);
      fig.appendChild(mat);
      fig.appendChild(document.createElement("figcaption"));
      plateBox.appendChild(fig);
      captionPlate();
    };
    var captionPlate = function () {
      if (currentPlate === null) return;
      var p = PLATES[currentPlate], l = lang(), cap = plateBox.querySelector("figcaption");
      plateBox.querySelector("img").alt = p.alt[l];
      cap.innerHTML = '<span class="label">Pl. ' + ROMAN[currentPlate] + '.</span> <em></em>. <span class="who"></span>. ' +
        '<a href="' + base + "credits.html#" + p.id + '">' + (l === "es" ? "Créditos" : "Credits") + "</a>";
      cap.querySelector("em").textContent = p.title[l];
      cap.querySelector(".who").textContent = p.who[l];
    };
    renderPlate(Math.floor(Math.random() * PLATES.length));
    hooks.push(captionPlate);
    var again = document.getElementById("draw-again");
    if (again) {
      again.hidden = false;
      again.addEventListener("click", function () {
        var j;
        do { j = Math.floor(Math.random() * PLATES.length); } while (j === currentPlate);
        renderPlate(j);
      });
    }
  }

  /* ---------- Gallery: filters ---------- */
  var gallery = document.querySelector(".gallery");
  if (gallery) {
    var works = Array.prototype.slice.call(gallery.querySelectorAll(".work"));
    var buttons = document.querySelectorAll(".filters [data-filter]");
    var applyFilter = function (f) {
      if (["all", "photo", "poster"].indexOf(f) < 0) f = "all";
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.filter === f)); });
      works.forEach(function (w) { w.hidden = f !== "all" && w.dataset.kind !== f; });
      document.querySelectorAll("[data-empty-for]").forEach(function (e) {
        e.hidden = !(e.dataset.emptyFor === f && !works.some(function (w) { return !w.hidden; }));
      });
    };
    buttons.forEach(function (b) {
      var f = b.dataset.filter, c = b.querySelector(".count");
      if (c) c.textContent = f === "all" ? works.length : works.filter(function (w) { return w.dataset.kind === f; }).length;
      b.addEventListener("click", function () {
        var target = f === "all" ? "" : "#" + f;
        if (location.hash !== target) {
          try { history.pushState(null, "", location.pathname + location.search + target); }
          catch (e) { /* sandboxed previews may refuse; the filter still works */ }
        }
        applyFilter(f);
      });
    });
    var filterFromURL = function () { applyFilter(location.hash.slice(1)); };
    window.addEventListener("popstate", filterFromURL);
    window.addEventListener("hashchange", filterFromURL);
    filterFromURL();

    /* ---------- Gallery: lightbox ----------
       Works the same on phones and computers: arrows, arrow keys, swipe (touch),
       drag (mouse) or a sideways trackpad gesture move between works; Escape,
       "Close", or a click/tap anywhere outside the image and its caption closes. */
    var dlg = document.getElementById("lightbox");
    var stage = dlg && dlg.querySelector(".stage");
    var caption = dlg && dlg.querySelector(".caption");
    var idx = 0;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
    var visible = function () { return works.filter(function (w) { return !w.hidden; }); };
    var show = function (i, dir) {
      var list = visible();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var w = list[idx];
      var media = w.querySelector("img, .ph").cloneNode(true);
      if (media.tagName === "IMG" && media.getAttribute("data-full")) media.src = media.getAttribute("data-full");
      if (media.tagName === "IMG") { media.loading = "eager"; media.decoding = "async"; media.draggable = false; }
      stage.innerHTML = "";
      stage.appendChild(media);
      caption.innerHTML = w.querySelector("figcaption").innerHTML;
      dlg.querySelector(".viewer-position").textContent = (idx + 1) + (lang() === "es" ? " de " : " of ") + list.length;
      // the new work slides in from the side it came from
      if (dir && media.animate && !reduceMotion.matches) {
        media.animate([{ transform: "translateX(" + (dir * 48) + "px)", opacity: 0 }, { transform: "none", opacity: 1 }],
          { duration: 220, easing: EASE });
      }
    };
    var step = function (d) { show(idx + d, d); };
    if (dlg && dlg.showModal) {
      works.forEach(function (w) {
        w.querySelector("button").addEventListener("click", function () {
          show(visible().indexOf(w), 0);
          dlg.showModal();
        });
      });
      dlg.querySelector("[data-prev]").addEventListener("click", function () { step(-1); });
      dlg.querySelector("[data-next]").addEventListener("click", function () { step(1); });
      dlg.querySelector("[data-close]").addEventListener("click", function () { dlg.close(); });
      dlg.addEventListener("keydown", function (e) {
        if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      });

      // Swipe (touch) or drag (mouse) anywhere in the viewer: the work follows, then moves on or springs back.
      var drag = null, justDragged = false;
      dlg.addEventListener("pointerdown", function (e) {
        if (e.button !== 0 || e.target.closest("button")) return;
        drag = { x: e.clientX, y: e.clientY, t: Date.now(), dx: 0, active: false, id: e.pointerId };
      });
      dlg.addEventListener("pointermove", function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!drag.active) {
          if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
          drag.active = true;
          try { dlg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
        }
        drag.dx = dx;
        var m = stage.firstElementChild;
        if (m) { m.style.transition = "none"; m.style.transform = "translateX(" + dx + "px)"; m.style.opacity = String(Math.max(0.35, 1 - Math.abs(dx) / 600)); }
      });
      var endDrag = function (e) {
        if (!drag || (e && e.pointerId !== drag.id)) return;
        var d = drag; drag = null;
        if (!d.active) return;
        justDragged = true;
        setTimeout(function () { justDragged = false; }, 0);
        var m = stage.firstElementChild;
        var fast = Math.abs(d.dx) / Math.max(1, Date.now() - d.t) > 0.45;
        if (e && e.type === "pointerup" && (Math.abs(d.dx) > 60 || (fast && Math.abs(d.dx) > 20))) {
          step(d.dx < 0 ? 1 : -1);
        } else if (m) {
          m.style.transition = reduceMotion.matches ? "none" : "transform 200ms " + EASE + ", opacity 200ms " + EASE;
          m.style.transform = ""; m.style.opacity = "";
        }
      };
      dlg.addEventListener("pointerup", endDrag);
      dlg.addEventListener("pointercancel", endDrag);

      // Trackpad: a sideways two-finger swipe moves one work per gesture.
      var wheelLock = 0;
      dlg.addEventListener("wheel", function (e) {
        if (Math.abs(e.deltaX) < 30 || Math.abs(e.deltaX) < Math.abs(e.deltaY)) return;
        e.preventDefault();
        var now = Date.now();
        if (now < wheelLock) return;
        wheelLock = now + 600;
        step(e.deltaX > 0 ? 1 : -1);
      }, { passive: false });

      // A click or tap outside the image and its caption closes the viewer.
      dlg.addEventListener("click", function (e) {
        if (justDragged) return;
        if (!e.target.closest(".stage > *, .caption, button")) dlg.close();
      });
    }
  }

  /* ---------- Footer year, CV printing ---------- */
  document.querySelectorAll(".year").forEach(function (el) { el.textContent = new Date().getFullYear(); });
  var printCV = document.querySelector("[data-print-cv]");
  if (printCV) { printCV.hidden = false; printCV.addEventListener("click", function () { window.print(); }); }

  setLang(lang());
})();
