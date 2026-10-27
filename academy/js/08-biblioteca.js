/* =====================================================================
   PC BUILDER ACADEMY · 08 · BIBLIOTECA Y PRÁCTICA
   ---------------------------------------------------------------------
   · Biblioteca: catálogo (CATALOG), teoría (THEORY, CYCLE, MEM) y glosario.
     Todo viene de tu proyecto original; el glosario es nuevo.
   · Práctica: autoevaluación con el banco POOL del proyecto original
     (opción múltiple, verdadero/falso, ordenar y relacionar).
   ===================================================================== */

let bibTab = "comp", glosFiltro = "";

const VIS_ICONO = { case: "case", psu: "psu", mobo: "mobo", cpu: "cpu", ram: "ram", ssd: "ssd", gpu: "gpu", cooler: "cooler" };

function renderLib() {
  const tabs = [["comp", "Componentes"], ["teo", "Teoría"], ["glos", "Glosario"]];
  $("#app").innerHTML = `<div class="page">
    <h1>Biblioteca</h1>
    <div class="tabs" role="tablist">${tabs.map(t => `<button role="tab" class="tab ${bibTab === t[0] ? "on" : ""}" data-tab="${t[0]}">${t[1]}</button>`).join("")}</div>
    <div id="bibBody"></div></div>`;
  $$("[data-tab]").forEach(b => b.addEventListener("click", () => { bibTab = b.dataset.tab; renderLib(); }));
  const body = $("#bibBody");
  if (bibTab === "comp") bibComponentes(body); else if (bibTab === "teo") bibTeoria(body); else bibGlosario(body);
}
PANTALLAS.lib = renderLib;

function bibComponentes(body) {
  body.innerHTML = `<p class="lead small">Toca un componente para ver qué es, cómo se comunica, errores comunes y cómo elegirlo.</p>
    <div class="cards">${CATALOG.map((c, i) => `<button class="libcard" data-i="${i}">
      <span class="lc-ico">${Arte.foto(c.vis && Arte.tiene(c.vis) ? c.vis : "keyboard")}</span>
      <b>${esc(c.name)}</b><small>${esc(c.resumen)}</small></button>`).join("")}</div>`;
  $$(".libcard", body).forEach(b => b.addEventListener("click", () => abrirFichaCatalogo(CATALOG[+b.dataset.i])));
}

function bibTeoria(body) {
  const colores = ["#52ffb8", "#7ed7ff", "#6bbdff", "#b98cff", "#ff9b9b"];
  body.innerHTML = `
    <section class="sec"><h2>Los componentes</h2>
      <div class="cards">${THEORY.map(t => `<article class="theory" style="--c:${t.col}">
        <div class="t-ico">${t.ico}</div><h3>${esc(t.t)}</h3><p class="tag">${esc(t.tag)}</p><p>${esc(t.def)}</p>
        <div class="chips">${t.points.map(p => `<span class="pill">${esc(p)}</span>`).join("")}</div>
        <p class="clave-s"><b>Clave:</b> ${esc(t.clave)}</p></article>`).join("")}</div></section>
    <section class="sec"><h2>El ciclo de instrucción</h2><p class="muted">El CPU repite estos cuatro pasos, muy rápido y en orden.</p>
      <ol class="cycle">${CYCLE.map(c => `<li><b>${esc(c.t.replace(/^\d+\s*·\s*/, ""))}</b><span>${esc(c.d)}</span></li>`).join("")}</ol></section>
    <section class="sec"><h2>Jerarquía de memoria</h2><p class="muted">Más arriba es más rápida, más cara y más pequeña.</p>
      <div class="mem">${MEM.map((m, i) => `<div class="memrow" style="--c:${colores[i % colores.length]}"><div class="m-top"><b>${esc(m.t)}</b><span>${esc(m.v)}</span></div><p>${esc(m.r)}</p><small>Capacidad típica: ${esc(m.s)}</small></div>`).join("")}</div></section>`;
}

function bibGlosario(body) {
  body.innerHTML = `<label class="field search">Buscar término<input id="glosIn" type="search" placeholder="Por ejemplo: socket" value="${esc(glosFiltro)}"></label><dl class="glos" id="glosList"></dl>`;
  const pintar = () => {
    const f = glosFiltro.toLowerCase().trim();
    const l = GLOSARIO.filter(g => !f || g.t.toLowerCase().includes(f) || g.d.toLowerCase().includes(f)).sort((a, b) => a.t.localeCompare(b.t, "es"));
    $("#glosList").innerHTML = l.length ? l.map(g => `<div><dt>${esc(g.t)}</dt><dd>${esc(g.d)}</dd></div>`).join("") : `<p class="muted">No hay términos con esa búsqueda.</p>`;
  };
  $("#glosIn").addEventListener("input", e => { glosFiltro = e.target.value; pintar(); });
  pintar();
}

/* ---------- Práctica (autoevaluación) ---------- */
const N_QUIZ = 10;
let Q = { items: [], i: 0, score: 0, hecho: false };

function renderQuiz() {
  if (!Q.items.length) {
    $("#app").innerHTML = `<div class="page narrow"><h1>Práctica</h1>
      <p class="lead small">${N_QUIZ} preguntas al azar de un banco de ${POOL.length}: opción múltiple, verdadero/falso, ordenar y relacionar. Cada acierto te da 3 XP.</p>
      <button class="btn primary big" id="qStart">Empezar</button></div>`;
    $("#qStart").addEventListener("click", () => { Q = { items: shuffle(POOL).slice(0, N_QUIZ), i: 0, score: 0, hecho: false }; renderQuiz(); });
    return;
  }
  if (Q.i >= Q.items.length) return resultadoQuiz();
  const it = Q.items[Q.i]; Q.hecho = false;
  const nombre = { mc: "Opción múltiple", tf: "Verdadero o falso", order: "Ordena los pasos", match: "Relaciona las columnas" }[it.type];
  let cuerpo = "";
  if (it.type === "mc") {
    it._o = shuffle(it.opts.map((t, i) => ({ t, ok: i === it.correct })));
    cuerpo = `<div class="opts-col">${it._o.map((o, i) => `<button class="optbtn" data-i="${i}">${esc(o.t)}</button>`).join("")}</div>`;
  } else if (it.type === "tf") {
    cuerpo = `<div class="opts-col"><button class="optbtn" data-v="1">Verdadero</button><button class="optbtn" data-v="0">Falso</button></div>`;
  } else if (it.type === "order") {
    let idx = shuffle(it.items.map((_, i) => i));
    if (idx.every((v, k) => v === it.correct[k])) [idx[0], idx[1]] = [idx[1], idx[0]];
    cuerpo = `<p class="muted small">Usa ▲ y ▼ para acomodar.</p><div id="ordList">${idx.map(i => `<div class="ordrow" data-i="${i}"><span>${esc(it.items[i])}</span><span><button class="mini" data-d="-1" aria-label="Subir">▲</button><button class="mini" data-d="1" aria-label="Bajar">▼</button></span></div>`).join("")}</div>`;
  } else {
    const ops = shuffle(it.answers.map((a, j) => ({ a, j })));
    cuerpo = it.terms.map((t, i) => `<div class="matchrow"><span>${esc(t)}</span><select data-i="${i}"><option value="-1">— elige —</option>${ops.map(o => `<option value="${o.j}">${esc(o.a)}</option>`).join("")}</select></div>`).join("");
  }
  $("#app").innerHTML = `<div class="page narrow">
    <p class="eyebrow">Pregunta ${Q.i + 1} de ${Q.items.length} · Aciertos: ${Q.score}</p>
    <div class="meter"><i style="width:${Q.i / Q.items.length * 100}%"></i></div>
    <div class="card q"><span class="pill">${nombre}</span><h2>${esc(it.q)}</h2>${cuerpo}<div id="qfb"></div>
      <div class="row end"><button class="btn primary" id="qCheck" ${it.type === "mc" || it.type === "tf" ? "disabled" : ""}>Comprobar</button><button class="btn primary" id="qNext" hidden>Siguiente</button></div></div></div>`;

  const fin = ok => {
    Q.hecho = true; if (ok) Q.score++; ok ? SFX.ok() : SFX.error();
    const fb = $("#qfb"); fb.className = "fb " + (ok ? "ok" : "bad"); fb.innerHTML = `<p>${ok ? "Correcto." : "Revisa:"} ${esc(it.fb)}</p>`;
    $("#qCheck").hidden = true; $("#qNext").hidden = false; $("#qNext").focus();
  };
  if (it.type === "mc" || it.type === "tf") {
    let elegido = null;
    $$(".optbtn").forEach(b => b.addEventListener("click", () => {
      if (Q.hecho) return; $$(".optbtn").forEach(x => x.classList.remove("picked")); b.classList.add("picked"); elegido = b; $("#qCheck").disabled = false;
    }));
    $("#qCheck").addEventListener("click", () => {
      if (!elegido || Q.hecho) return;
      $$(".optbtn").forEach(x => x.disabled = true);
      let ok;
      if (it.type === "mc") { ok = it._o[+elegido.dataset.i].ok; $$(".optbtn").forEach((x, i) => { if (it._o[i].ok) x.classList.add("correct"); }); }
      else { const v = elegido.dataset.v === "1"; ok = v === it.correct; $$(".optbtn").forEach(x => { if ((x.dataset.v === "1") === it.correct) x.classList.add("correct"); }); }
      if (!ok) elegido.classList.add("wrong");
      fin(ok);
    });
  } else if (it.type === "order") {
    $$(".ordrow .mini").forEach(b => b.addEventListener("click", () => {
      if (Q.hecho) return; const l = $("#ordList"), r = b.closest(".ordrow"), d = +b.dataset.d;
      if (d === -1 && r.previousElementSibling) l.insertBefore(r, r.previousElementSibling);
      if (d === 1 && r.nextElementSibling) l.insertBefore(r.nextElementSibling, r);
    }));
    $("#qCheck").addEventListener("click", () => { const o = $$(".ordrow").map(r => +r.dataset.i); fin(o.every((v, k) => v === it.correct[k])); });
  } else {
    $("#qCheck").addEventListener("click", () => {
      const sel = $$(".matchrow select"); if (sel.some(s => s.value === "-1")) { toast("Relaciona todas las filas.", "bad"); return; }
      sel.forEach((s, i) => s.classList.add(+s.value === i ? "okk" : "noo")); fin(sel.every((s, i) => +s.value === i));
    });
  }
  $("#qNext").addEventListener("click", () => { Q.i++; renderQuiz(); });
}
PANTALLAS.quiz = renderQuiz;

function resultadoQuiz() {
  const pct = Math.round(Q.score / Q.items.length * 100);
  S.stats.quiz += Q.items.length; S.stats.quizOk += Q.score;
  const lv = ganarXP(Q.score * 3); guardar(); renderBarra();
  $("#app").innerHTML = `<div class="page narrow center"><h1>${Q.score} / ${Q.items.length}</h1><p class="lead small">${pct} % de aciertos · +${Q.score * 3} XP</p>
    <p>${pct >= 80 ? "Excelente: dominas la arquitectura de la PC." : pct >= 50 ? "Bien. Repasa la Biblioteca y vuelve a intentarlo." : "Conviene repasar la teoría y los pedidos con lecciones."}</p>
    <div class="row center"><button class="btn primary" id="qRe">Nuevas preguntas</button><button class="btn" id="qLib">Ir a la biblioteca</button></div></div>`;
  Q = { items: [], i: 0, score: 0, hecho: false };
  $("#qRe").addEventListener("click", renderQuiz); $("#qLib").addEventListener("click", () => go("lib"));
  if (lv) mostrarSubidaNivel(lv);
}
