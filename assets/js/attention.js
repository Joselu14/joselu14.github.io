/* =========================================================
   attention.js — the interactive attention model (attention.html).
   Two agents update by conditionalization; an attention policy decides
   which evidence they update on. Model: Joselu Cabrera Guillermo,
   "The Bayesian and the Immunologist" and the talk "Selective Conditionalization: Belief Perseverance from a Bayesian Framework" (RatioLog, 2025).
   ========================================================= */
(function () {
  "use strict";
  var box = document.getElementById("att");
  if (!box) return;
  var root = document.documentElement;
  function es() { return root.getAttribute("data-lang") === "es"; }
  function t(en, sp) { return es() ? sp : en; }
  function fmt(x) { return (Math.round(x * 100) / 100).toFixed(2); }
  function bi(en, sp) { return '<span lang="en">' + en + '</span><span lang="es">' + sp + "</span>"; }

  /* ---------- Probability on a 16-row stochastic truth table ----------
     Row r encodes truth values: P = bit 8, S = bit 4, H = bit 2, V = bit 1. */
  var BIT = { P: 8, S: 4, H: 2, V: 1 };
  function holds(r, lit) {
    var neg = lit.charAt(0) === "-";
    return ((r & BIT[neg ? lit.slice(1) : lit]) !== 0) !== neg;
  }
  function all(r, lits) { for (var i = 0; i < lits.length; i++) if (!holds(r, lits[i])) return false; return true; }
  function pr(p, lits) { var s = 0; for (var r = 0; r < 16; r++) if (all(r, lits)) s += p[r]; return s; }
  function cond(p, x, y) { var d = pr(p, y); return d > 0 ? pr(p, x.concat(y)) / d : NaN; }
  function conditionalize(p, lits) {
    var d = pr(p, lits);
    if (!(d > 1e-12)) return null;
    return p.map(function (v, r) { return all(r, lits) ? v / d : 0; });
  }
  /* A coherent edit: set cr(x | given) to val and keep every other conditional
     structure inside "given" (rows with x scaled one way, rows without x the other). */
  function setCond(p, x, given, val) {
    var q = p.slice(), cur = cond(p, [x], given), b = BIT[x];
    if (isNaN(cur)) return q;
    for (var r = 0; r < 16; r++) {
      if (!all(r, given)) continue;
      var isX = (r & b) !== 0;
      if (cur > 1e-9 && cur < 1 - 1e-9) q[r] = p[r] * (isX ? val / cur : (1 - val) / (1 - cur));
      else if (cur <= 1e-9) q[r] = isX ? val * p[r ^ b] : (1 - val) * p[r];   // x had no mass: mirror the rows without x
      else q[r] = isX ? val * p[r] : (1 - val) * p[r ^ b];
    }
    return q;
  }

  /* ---------- Attention policies ----------
     Both policies work on the agent's core beliefs C (what the agent cares about):
     P, and/or the agent's side on S (S if cr(S) ≥ 0.5, not-S otherwise).
     Dogmatic:     Sal(E) = 1 − (1/c) Σ max(cr(Pi) − cr(Pi | E), 0)   (average drop in core credences)
     Enthusiastic: Sal(E) = (1/c) Σ |R(Pi, E)|,  R(X, E) = (cr(E|X) − cr(E|¬X)) / (cr(E|X) + cr(E|¬X)) */
  function neg(l) { return l.charAt(0) === "-" ? l.slice(1) : "-" + l; }
  function core(p) {
    var C = [];
    if (state.core.P) C.push("P");
    if (state.core.S) C.push(pr(p, ["S"]) >= 0.5 ? "S" : "-S");
    return C;
  }
  function relevance(p, x, e) {
    var a = cond(p, [e], [x]), b = cond(p, [e], [neg(x)]);
    if (!(a + b > 0)) return 0;
    return (a - b) / (a + b);
  }
  function salience(p, e, policy) {
    if (!(pr(p, [e]) > 1e-12)) return 0;
    var C = core(p), sum = 0;
    if (!C.length) return policy === "dogmatic" ? 1 : 0;
    C.forEach(function (x) {
      sum += policy === "dogmatic" ? Math.max(pr(p, [x]) - cond(p, [x], [e]), 0) : Math.abs(relevance(p, x, e));
    });
    return policy === "dogmatic" ? 1 - sum / C.length : sum / C.length;
  }
  // E is attended iff Sal(E) ≥ Sal(E′) for every E′ on the table and Sal(E) > a.
  function attend(p, ev, policy, a) {
    var sal = {}, max = -1;
    ev.forEach(function (e) { sal[e] = salience(p, e, policy); if (sal[e] > max) max = sal[e]; });
    var att = ev.filter(function (e) { return sal[e] >= max - 1e-9 && sal[e] - a > 1e-9; });
    var post = att.length ? conditionalize(p, att) : null;
    return { sal: sal, att: att, post: post || p, updated: !!post, zero: att.length > 0 && !post };
  }

  /* ---------- Scenarios ---------- */
  var TABLES = {"clash-dogmatic":{"A":[0.044975,0.000249,0.00831,0.001918,0.006418,0.009358,0.014297,0.004475,0.104145,0.018631,0.00257,0.019202,0.014862,0.701362,0.004423,0.044805],"B":[0.023604,0.056536,0.0,0.0,0.022396,0.047464,0.0,0.0,0.058503,0.003257,0.637893,0.070207,0.055506,0.002734,0.002098,0.019802]},"clash-enthusiastic":{"A":[0.013591,0.000159,0.123909,0.027341,0.003736,0.020014,0.008764,0.002486,0.01112,0.00013,0.10138,0.02237,0.070976,0.380274,0.166524,0.047226],"B":[0.003736,0.008764,0.020014,0.002486,0.013591,0.123909,0.000159,0.027341,0.070976,0.166524,0.380274,0.047226,0.01112,0.10138,0.00013,0.02237]},"same-beliefs":{"A":[0.007718,0.001577,0.011335,0.002316,0.040137,0.020568,0.01081,0.00554,0.045066,0.03564,0.025882,0.020468,0.234369,0.464926,0.024684,0.048966],"B":[0.003138,0.000699,0.020075,0.004469,0.013826,0.007338,0.032962,0.017494,0.055554,0.04561,0.011233,0.009223,0.244768,0.479068,0.018444,0.0361]}};
  var SCEN = {
    "clash-dogmatic": {
      policy: "dogmatic", a: 0.65, l: 0.75, ev: { H: true, V: true }, core: { P: true, S: false },
      agents: [{ name: "Anaí", key: "A" }, { name: "Dai", key: "B" }]
    },
    "clash-enthusiastic": {
      policy: "enthusiastic", a: 0.30, l: 0.75, ev: { H: true, V: true }, core: { P: false, S: true },
      agents: [{ name: "Anaí", key: "A" }, { name: "Dai", key: "B" }]
    },
    "same-beliefs": {
      policy: "dogmatic", a: 0.65, l: 0.75, ev: { H: true, V: false }, core: { P: true, S: false },
      agents: [{ name: "Anaí", key: "A" }, { name: "Claudio", key: "B" }]
    }
  };
  var state = {};
  function load(name) {
    var s = SCEN[name];
    state = {
      scen: name, policy: s.policy, a: s.a, l: s.l, ev: { H: s.ev.H, V: s.ev.V }, core: { P: s.core.P, S: s.core.S },
      agents: s.agents.map(function (g) { return { name: g.name, p: TABLES[name][g.key].slice() }; })
    };
  }

  /* ---------- DOM ---------- */
  var $ = function (sel, el) { return (el || box).querySelector(sel); };
  var $$ = function (sel, el) { return Array.prototype.slice.call((el || box).querySelectorAll(sel)); };
  var SLIDERS = [
    { id: "S", x: "S", given: [], label: "cr(S)" },
    { id: "HS", x: "H", given: ["S"], label: "cr(H | S)" },
    { id: "Hn", x: "H", given: ["-S"], label: "cr(H | ¬S)" },
    { id: "VS", x: "V", given: ["S"], label: "cr(V | S)" },
    { id: "Vn", x: "V", given: ["-S"], label: "cr(V | ¬S)" },
    { id: "PS", x: "P", given: ["S"], label: "cr(P | S)" },
    { id: "Pn", x: "P", given: ["-S"], label: "cr(P | ¬S)" }
  ];
  var GROUPS = [
    { ids: ["S"], en: "How confident the agent is that S", es: "Qué tan confiado está el agente en que S" },
    { ids: ["HS", "Hn"], en: "How likely H is if S, and if not", es: "Qué tan probable es H si S, y si no" },
    { ids: ["VS", "Vn"], en: "How likely V is if S, and if not", es: "Qué tan probable es V si S, y si no" },
    { ids: ["PS", "Pn"], en: "How the core attitude P depends on S", es: "Cómo depende de S la actitud nuclear P" }
  ];

  function buildAgent(i) {
    var col = $$(".att-agent")[i];
    var h = '';
    GROUPS.forEach(function (g) {
      h += '<fieldset class="att-group"><legend>' + bi(g.en, g.es) + '</legend>';
      g.ids.forEach(function (id) {
        var sl = SLIDERS.filter(function (s) { return s.id === id; })[0];
        var fid = "att-" + i + "-" + id;
        h += '<div class="att-slider"><label for="' + fid + '">' + sl.label + '</label>' +
             '<input type="range" id="' + fid + '" min="0.01" max="0.99" step="0.01" data-s="' + id + '">' +
             '<output for="' + fid + '"></output></div>';
      });
      h += '</fieldset>';
    });
    h += '<p class="att-derived"></p>';
    $(".att-adjust .att-body", col).innerHTML = h;
    $$("input[type=range]", col).forEach(function (inp) {
      inp.addEventListener("input", function () {
        var sl = SLIDERS.filter(function (s) { return s.id === inp.getAttribute("data-s"); })[0];
        var ag = state.agents[i];
        ag.p = setCond(ag.p, sl.x, sl.given, parseFloat(inp.value));
        render(inp);
      });
    });
  }

  function syncControls(active) {
    $$("[data-scen]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-scen") === state.scen)); });
    $$("[data-policy]").forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-policy") === state.policy)); });
    $$("[data-policy-note]").forEach(function (n) { n.hidden = n.getAttribute("data-policy-note") !== state.policy; });
    $$("[data-scen-note]").forEach(function (n) { n.hidden = n.getAttribute("data-scen-note") !== state.scen; });
    $("#att-a").value = state.a; $("#att-l").value = state.l;
    $("#att-a-out").textContent = fmt(state.a); $("#att-l-out").textContent = fmt(state.l);
    $("#att-ev-H").checked = state.ev.H; $("#att-ev-V").checked = state.ev.V;
    $("#att-core-P").checked = state.core.P; $("#att-core-S").checked = state.core.S;
    state.agents.forEach(function (ag, i) {
      var col = $$(".att-agent")[i];
      SLIDERS.forEach(function (sl) {
        var inp = $('input[data-s="' + sl.id + '"]', col);
        var v = sl.given.length ? cond(ag.p, [sl.x], sl.given) : pr(ag.p, [sl.x]);
        if (inp !== active) inp.value = v;
        inp.nextElementSibling.textContent = fmt(v);
      });
    });
  }

  function status(x, l) { return x >= l - 1e-9 ? 1 : (1 - x >= l - 1e-9 ? -1 : 0); }
  function statusText(s, would, plural) {
    if (!would) {
      if (plural) return s === 1 ? t("believe S", "creen que S") : s === -1 ? t("believe not-S", "creen que no-S") : t("suspend judgement", "suspenden el juicio");
      return s === 1 ? t("believes S", "cree que S") : s === -1 ? t("believes not-S", "cree que no-S") : t("suspends judgement", "suspende el juicio");
    }
    if (plural) return s === 1 ? t("would believe S", "creerían que S") : s === -1 ? t("would believe not-S", "creerían que no-S") : t("would suspend judgement", "suspenderían el juicio");
    return s === 1 ? t("would believe S", "creería que S") : s === -1 ? t("would believe not-S", "creería que no-S") : t("would suspend judgement", "suspendería el juicio");
  }
  function list(items) {
    if (items.length === 1) return items[0];
    return items.slice(0, -1).join(", ") + t(" and ", " y ") + items[items.length - 1];
  }

  function agentSentence(ag, res, ev) {
    var n = ag.name;
    if (!ev.length) return t("There is no evidence on the table.", "No hay evidencia sobre la mesa.");
    var ign = ev.filter(function (e) { return res.att.indexOf(e) < 0; });
    if (!res.att.length) {
      return ev.length === 1
        ? t(n + " ignores " + ev[0] + ": its salience is not above a.", n + " ignora " + ev[0] + ": su saliencia no supera a.")
        : t(n + " ignores both H and V: neither has salience above a.", n + " ignora tanto H como V: ninguna tiene saliencia mayor que a.");
    }
    var s = t(n + " attends to ", n + " atiende a ") + list(res.att);
    if (ign.length) s += t(" and ignores ", " e ignora ") + list(ign);
    s += ".";
    if (res.zero) s += t(" But it gives that evidence credence 0, so there is nothing to update on.", " Pero le da credence 0 a esa evidencia, así que no hay nada sobre qué actualizar.");
    return s;
  }

  function moveVerdict(x, y) {
    var mA = Math.abs(y[0] - x[0]) > 5e-4, mB = Math.abs(y[1] - x[1]) > 5e-4;
    if (!mA && !mB) return "none";
    var lean = x.map(function (v) { return v > 0.5 + 1e-9 ? 1 : v < 0.5 - 1e-9 ? -1 : 0; });
    if (lean[0] * lean[1] === -1 && (y[0] - x[0]) * lean[0] > 5e-4 && (y[1] - x[1]) * lean[1] > 5e-4) return "polarize";
    var g0 = Math.abs(x[0] - x[1]), g1 = Math.abs(y[0] - y[1]);
    if (g1 < 5e-3 && g0 >= 5e-3) return "agree";
    if (g1 < g0 - 5e-4) return "closer";
    if (g1 > g0 + 5e-4) return "apart";
    return "same";
  }


  // What happened to their full beliefs about S (Lockean threshold l)
  function beliefClause(x, y, names, would) {
    var b0 = x.map(function (v) { return status(v, state.l); }), b1 = y.map(function (v) { return status(v, state.l); });
    var now = names[0] + " " + statusText(b1[0]) + t(" and ", " y ") + names[1] + " " + statusText(b1[1]);
    if (would) now = names[0] + " " + statusText(b1[0], true) + t(" and ", " y ") + names[1] + " " + statusText(b1[1], true);
    if (b0[0] === b0[1] && b1[0] !== b1[1])
      return would ? t(" They would no longer take the same attitude to S: ", " Ya no tendrían la misma actitud hacia S: ") + now + "."
                   : t(" Before, they took the same attitude to S; now ", " Antes tenían la misma actitud hacia S; ahora ") + now + ".";
    if (b0[0] !== b0[1] && b1[0] === b1[1])
      return would ? t(" They would take the same attitude to S: both ", " Tendrían la misma actitud hacia S: " + names[0] + " y " + names[1] + " ") + statusText(b1[0], true, true) + "."
                   : t(" Now they take the same attitude to S: both ", " Ahora tienen la misma actitud hacia S: " + names[0] + " y " + names[1] + " ") + statusText(b1[0], false, true) + ".";
    if (b0[0] === b0[1] && b1[0] === b1[1] && b1[0] !== b0[0])
      return " " + (would ? t("Both ", names[0] + " y " + names[1] + " ") : t("Both now ", "Ahora " + names[0] + " y " + names[1] + " ")) +
        statusText(b1[0], would, true) + (b1[0] === 0 ? t(" about S", " sobre S") : "") + ".";
    if (b1[0] * b1[1] === -1 && b0[0] * b0[1] !== -1)
      return (would ? t(" They would end up with opposite beliefs: ", " Terminarían con creencias opuestas: ") : t(" Now they hold opposite beliefs: ", " Ahora tienen creencias opuestas: ")) + now + ".";
    return "";
  }

  function render(active) {
    syncControls(active);
    var ev = ["H", "V"].filter(function (e) { return state.ev[e]; });
    var res = state.agents.map(function (ag) { return attend(ag.p, ev, state.policy, state.a); });
    var allp = state.agents.map(function (ag) { return ev.length ? (conditionalize(ag.p, ev) || ag.p) : ag.p; });
    var x = state.agents.map(function (ag) { return pr(ag.p, ["S"]); });
    var y = res.map(function (r) { return pr(r.post, ["S"]); });
    var z = allp.map(function (p) { return pr(p, ["S"]); });

    box.style.setProperty("--a", state.a);
    box.style.setProperty("--l", state.l);

    state.agents.forEach(function (ag, i) {
      var col = $$(".att-agent")[i], r = res[i];
      $$(".att-name", col).forEach(function (el) { el.textContent = ag.name; });
      // saliences
      var sh = "";
      ev.forEach(function (e) {
        var on = r.att.indexOf(e) >= 0;
        var above = ev.filter(function (o) { return o !== e && r.sal[o] > r.sal[e] + 1e-9; });
        var why = on ? t("attends", "atiende")
          : r.sal[e] - state.a <= 1e-9 ? t("ignores: not above a", "ignora: no supera a")
          : t("ignores: " + above.join(", ") + " is more salient", "ignora: " + above.join(", ") + " es más saliente");
        sh += '<div class="att-sal' + (on ? " on" : "") + '"><span class="att-ev">' + e + '</span>' +
              '<span class="att-bar" aria-hidden="true"><span style="width:' + (r.sal[e] * 100).toFixed(1) + '%"></span></span>' +
              '<span class="att-num">' + fmt(r.sal[e]) + '</span><span class="att-why">' + why + '</span></div>';
      });
      $(".att-sals", col).innerHTML = sh || '<p class="muted">' + t("No evidence on the table.", "No hay evidencia sobre la mesa.") + "</p>";
      $(".att-says", col).textContent = agentSentence(ag, r, ev);
      var s0 = status(x[i], state.l), s1 = status(y[i], state.l);
      $(".att-cr", col).innerHTML =
        '<div><dt>cr(S)</dt><dd>' + fmt(x[i]) + ' → <b>' + fmt(y[i]) + '</b></dd></div>' +
        '<div><dt>cr(P)</dt><dd>' + fmt(pr(ag.p, ["P"])) + ' → <b>' + fmt(pr(r.post, ["P"])) + '</b></dd></div>' +
        '<div><dt>' + t("Belief", "Creencia") + '</dt><dd>' + statusText(s0) + ' → <b>' + statusText(s1) + '</b></dd></div>';
      var d = $(".att-derived", col);
      d.textContent = t("So: ", "Entonces: ") + "cr(S | H) = " + fmt(cond(ag.p, ["S"], ["H"])) + ", cr(S | V) = " + fmt(cond(ag.p, ["S"], ["V"])) +
        ", cr(P | H) = " + fmt(cond(ag.p, ["P"], ["H"])) + ", cr(P | V) = " + fmt(cond(ag.p, ["P"], ["V"])) + ".";
      // the stochastic truth table
      var T = t("T", "V"), F = "F";
      var rows = "";
      for (var rr = 15; rr >= 0; rr--) {
        var out = r.updated && r.post[rr] === 0 && ag.p[rr] > 0;
        rows += "<tr" + (out ? ' class="out"' : "") + ">" +
          ["P", "S", "H", "V"].map(function (k) { return "<td>" + (rr & BIT[k] ? T : F) + "</td>"; }).join("") +
          "<td>" + ag.p[rr].toFixed(3) + "</td><td>" + r.post[rr].toFixed(3) + "</td></tr>";
      }
      $(".att-table tbody", col).innerHTML = rows;
      $(".att-table thead", col).innerHTML = "<tr><th>P</th><th>S</th><th>H</th><th>V</th><th>cr<sub>t</sub></th><th>cr<sub>t+1</sub></th></tr>";
    });

    // the shared scale
    state.agents.forEach(function (ag, i) {
      var row = $$(".att-row")[i];
      $(".att-row-name", row).textContent = ag.name;
      var lo = Math.min(x[i], y[i]), hi = Math.max(x[i], y[i]);
      $(".mk.before", row).style.left = (x[i] * 100) + "%";
      $(".mk.after", row).style.left = (y[i] * 100) + "%";
      $(".mk.all", row).style.left = (z[i] * 100) + "%";
      $(".mk.all", row).hidden = !ev.length;
      var arr = $(".att-arrow", row);
      arr.style.left = (lo * 100) + "%"; arr.style.width = ((hi - lo) * 100) + "%";
      $(".att-row-num", row).innerHTML = fmt(x[i]) + " → <b>" + fmt(y[i]) + "</b>";
    });

    // verdict
    var nA = state.agents[0].name, nB = state.agents[1].name;
    var v = moveVerdict(x, y);
    var V1 = {
      polarize: t("They polarize: each moves further in the direction they already leaned.", "Se polarizan: cada quien se mueve más hacia donde ya se inclinaba."),
      closer: t("They move closer together.", "Se acercan."),
      agree: t("They end up with the same credence in S.", "Terminan con el mismo grado de creencia en S."),
      apart: t("They move further apart.", "Se alejan."),
      same: t("The gap between them stays the same.", "La distancia entre sus grados de creencia no cambia.")
    };
    var s = V1[v] || t("Neither " + nA + " nor " + nB + " changes their mind.", "Ni " + nA + " ni " + nB + " cambian de opinión.");
    s += beliefClause(x, y, [nA, nB], false);
    $("#att-verdict").textContent = s;

    var sameAsAll = res.every(function (r) { return r.att.length === ev.length && r.updated; });
    var s2 = "";
    if (!ev.length) s2 = "";
    else if (sameAsAll) s2 = t("Both attended to all the evidence on the table.", nA + " y " + nB + " atendieron a toda la evidencia sobre la mesa.");
    else {
      var w = moveVerdict(x, z);
      var V2 = {
        polarize: t("they would polarize", "se polarizarían"),
        closer: t("they would move closer together", "se acercarían"),
        agree: t("they would end up with the same credence", "terminarían con el mismo grado de creencia"),
        apart: t("they would move further apart", "se alejarían"),
        same: t("the gap between them would stay the same", "la distancia entre sus grados de creencia no cambiaría")
      };
      s2 = t("Had they attended to all the evidence on the table, ", "Si hubieran atendido a toda la evidencia sobre la mesa, ") +
        nA + t(" would be at ", " quedaría en ") + fmt(z[0]) + t(" and ", " y ") + nB + t(" at ", " en ") + fmt(z[1]) + ": " +
        (V2[w] || t("neither would change their mind", "ni " + nA + " ni " + nB + " cambiarían de opinión")) + "." + beliefClause(x, z, [nA, nB], true);
    }
    $("#att-all").textContent = s2;
  }

  /* ---------- Wire up ---------- */
  [0, 1].forEach(buildAgent);
  $$("[data-scen]").forEach(function (b) {
    b.addEventListener("click", function () { load(b.getAttribute("data-scen")); render(); });
  });
  $$("[data-policy]").forEach(function (b) {
    b.addEventListener("click", function () { state.policy = b.getAttribute("data-policy"); render(); });
  });
  $("#att-a").addEventListener("input", function () { state.a = parseFloat(this.value); render(); });
  $("#att-l").addEventListener("input", function () { state.l = parseFloat(this.value); render(); });
  ["H", "V"].forEach(function (e) {
    $("#att-ev-" + e).addEventListener("change", function () { state.ev[e] = this.checked; render(); });
  });
  ["P", "S"].forEach(function (k) {
    $("#att-core-" + k).addEventListener("change", function () {
      state.core[k] = this.checked;
      if (!state.core.P && !state.core.S) { state.core[k === "P" ? "S" : "P"] = true; }   // keep at least one core belief
      render();
    });
  });
  $("#att-reset").addEventListener("click", function () { load(state.scen); render(); });
  new MutationObserver(function () { render(); }).observe(root, { attributes: true, attributeFilter: ["data-lang"] });
  load("clash-dogmatic");
  render();
})();
