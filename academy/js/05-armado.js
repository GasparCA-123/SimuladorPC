/* =====================================================================
   PC BUILDER ACADEMY · 05 · ENSAMBLE
   ---------------------------------------------------------------------
   Se arrastra (o se toca y luego se toca la ranura) cada pieza hasta su
   lugar en el gabinete. Reglas, igual que en el proyecto original:
     · Una pieza solo se puede instalar si sus 'deps' ya están puestas.
     · Si se suelta en el lugar equivocado, se explica dónde va.
     · NUEVO: al instalar se comprueba que la pieza ENCAJE físicamente
       (socket, tipo de RAM, largo de GPU...). Si no, hay que cambiarla.
   Datos de ranuras: SLOTS (datos-juego.js). Pasos: makeSteps (02-compat.js).
   ===================================================================== */

const ESC_W = 760, ESC_H = 600;           // tamaño de diseño del lienzo
const pasoPorId = id => run.steps.find(s => s.id === id);
const pasoListo = s => s.deps.every(d => run.placed.has(d));
function pasoActual() { return run.steps.find(s => !run.placed.has(s.id) && pasoListo(s)) || null; }
function etiquetaSlot(id) {
  const d = SLOTS.find(s => s.id === id); if (d && d.label) return d.label;
  return SLOT_LABELS[id] || id;
}
function pendientesTexto(s) {
  const f = s.deps.filter(d => !run.placed.has(d)).map(d => pasoPorId(d) ? pasoPorId(d).name : d);
  return f.length ? "Primero instala: " + f.join(", ") + "." : "Ya puedes instalarla.";
}

/* ---------- Pantalla ---------- */
function renderBuild() {
  const total = run.steps.length;
  const sceneSlots = SLOTS.map(d => {
    const usado = run.steps.some(s => s.targets.includes(d.id));
    const cls = ["slot", d.decoy ? "decoy" : "", usado || d.decoy ? "" : "unused", `s-${d.id}`].join(" ");
    return `<div class="${cls}" data-id="${d.id}" style="left:${d.x}px;top:${d.y}px;width:${d.w}px;height:${d.h}px"><span class="lbl">${esc(etiquetaSlot(d.id))}</span></div>`;
  }).join("");

  $("#app").innerHTML = `
    <div class="build">
      <header class="build-head">
        <div><p class="eyebrow">${run.libre ? "Modo libre" : esc(run.order.cliente) + " · " + esc(run.order.titulo)}</p><h1>Ensamblaje</h1></div>
        <div class="prog"><div class="prog-top"><span id="progLbl"></span></div><div class="meter"><i id="progBar"></i></div></div>
        <div class="head-btns">
          <button class="btn" id="btnHint" title="Resalta dónde va la siguiente pieza">Resaltar siguiente paso</button>
          <button class="btn ghost" id="btnDesmontar">Volver a la tienda</button>
          <button class="btn primary power" id="btnPower" hidden>⏻ Encender PC</button>
        </div>
      </header>
      <div class="build-grid">
        <aside class="tray" aria-label="Piezas por instalar"><h2>Piezas</h2><p class="muted small">Arrastra cada pieza a su lugar. En pantalla táctil: toca la pieza y luego la ranura.</p><div id="trayList"></div></aside>
        <section class="stage">
          <div class="scene-wrap" id="sceneWrap">
            <div class="scene ${S.ayuda === "off" ? "no-labels" : ""}" id="scene" style="width:${ESC_W}px;height:${ESC_H}px">
              <div class="casoart" id="casoArt">${Arte.casoSVG(run.build.case)}</div>
              <div class="mobo-board" id="moboBoard"></div>
              ${sceneSlots}
              <div class="glass" id="glass"></div>
            </div>
          </div>
        </section>
        <aside class="info" id="infoPanel"></aside>
      </div>
    </div>`;

  run.trayOrder = shuffle(run.steps.map(s => s.id));
  $("#btnHint").addEventListener("click", resaltarSiguiente);
  $("#btnDesmontar").addEventListener("click", desmontarTodo);
  $("#btnPower").addEventListener("click", () => go("post"));
  const sc = $("#scene");
  sc.addEventListener("click", clicEnEscena);
  ajustarEscena();
  window.addEventListener("resize", ajustarEscena);
  pintarTodo();
  decirPasoActual(true);
}
PANTALLAS.build = renderBuild;

function ajustarEscena() {
  const w = $("#sceneWrap"), sc = $("#scene"); if (!w || !sc) return;
  const s = Math.min(1, w.clientWidth / ESC_W);
  sc.style.transform = `scale(${s})`; sc.style.transformOrigin = "top left";
  w.style.height = Math.round(ESC_H * s) + "px";
}
const escala = () => { const sc = $("#scene"); return sc ? sc.getBoundingClientRect().width / ESC_W : 1; };

/* ---------- Pintar ---------- */
function pintarTodo() { pintarBandeja(); pintarEscena(); pintarProgreso(); pintarInfo(); }

function pintarProgreso() {
  const n = run.steps.filter(s => run.placed.has(s.id)).length, t = run.steps.length;
  $("#progLbl").textContent = `${n} de ${t} pasos`;
  $("#progBar").style.width = (n / t * 100) + "%";
  $("#btnPower").hidden = n < t;
  $("#btnHint").hidden = n >= t;
}

function pintarBandeja() {
  const list = $("#trayList"), live = S.ayuda === "live";
  const ids = (run.trayOrder || []).filter(id => run.steps.some(s => s.id === id));
  run.steps.forEach(s => { if (!ids.includes(s.id)) ids.push(s.id); });
  const pend = ids.map(pasoPorId).filter(s => !run.placed.has(s.id));
  if (!pend.length) { list.innerHTML = `<p class="ok-t">¡Todas las piezas están instaladas!</p>`; return; }
  list.innerHTML = pend.map(s => {
    const listo = pasoListo(s), p = productoDePaso(s.id, run.build);
    return `<div class="part ${listo ? "" : "locked"} ${run.sel === s.id ? "sel" : ""}" data-paso="${s.id}" tabindex="0" role="button" aria-label="${esc(s.name)}${listo ? "" : " (bloqueada)"}">
      <span class="part-ico">${Arte.tiene(s.type) ? Arte.foto(s.type, p) : icon(iconoDeTipo(s.type), 30)}${listo ? "" : `<i class="cand">${icon("lock", 14)}</i>`}</span>
      <span class="part-tx"><b>${esc(s.name)}</b><small>${p && p.n ? esc(p.n) : esc(s.short)}</small></span>
      ${live ? `<span class="part-n">${s.n}</span>` : ""}
    </div>`;
  }).join("");
  $$(".part", list).forEach(c => {
    c.addEventListener("pointerdown", e => iniciarArrastre(e, c.dataset.paso, c));
    c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); seleccionarPaso(c.dataset.paso); } });
  });
}

function pintarEscena() {
  const sc = $("#scene"); if (!sc) return;
  $$(".slot", sc).forEach(el => { el.classList.remove("occupied", "hit", "next"); if (!el.classList.contains("decoy")) el.querySelectorAll(".inst").forEach(n => n.remove()); delete el.dataset.paso; });
  run.steps.forEach(s => {
    if (!run.placed.has(s.id)) return;
    const t = run.placedAt[s.id], el = $(`.slot[data-id="${t}"]`, sc); if (!el) return;
    el.classList.add("occupied"); el.dataset.paso = s.id;
    if (s.id === "mobo") return;                      // la placa se dibuja aparte (#moboBoard)
    const d = SLOTS.find(x => x.id === t);
    const nodo = document.createElement("span");
    nodo.className = `inst t-${s.type}`;
    nodo.innerHTML = Arte.tiene(s.type) ? Arte.escena(s.type, d.w, d.h, productoDePaso(s.id, run.build)) : icon(iconoDeTipo(s.type), Math.min(34, d.h - 8));
    el.appendChild(nodo);
  });
  sc.classList.toggle("has-mobo", run.placed.has("mobo"));
  sc.classList.toggle("has-standoffs", run.placed.has("standoffs"));
  sc.classList.toggle("closed", run.placed.has("sidePanel"));
  const mb = $("#moboBoard"), m = run.build.mobo;
  if (mb && mb.dataset.id !== (m ? m.id : "")) { mb.dataset.id = m ? m.id : ""; mb.innerHTML = m ? Arte.placa(m) : ""; }
}

function pintarInfo() {
  const p = $("#infoPanel"); if (!p) return;
  const sel = run.sel ? pasoPorId(run.sel) : null, act = pasoActual();
  const s = sel || act, live = S.ayuda === "live", demand = S.ayuda === "demand";
  if (!s) {
    p.innerHTML = mentorHTML("¡Todo está instalado! Enciende la PC para ver si arranca. El POST revisará fuente, CPU, RAM y video.");
    return;
  }
  const instalado = run.placed.has(s.id), esAct = act && act.id === s.id;
  const ficha = fichaDePaso(s, run.build);
  const instr = INSTRUCCIONES[s.id];
  const encab = instalado ? "Instalado" : (esAct ? (live || demand ? `Paso actual · ${s.n}` : "Pieza seleccionada") : (pasoListo(s) ? "Consulta" : "Aún no toca"));
  const tipoDest = s.targets.map(t => etiquetaSlot(t)).join(" o ");
  p.innerHTML = `
    ${mentorHTML("")}
    <div class="card step">
      ${Arte.tiene(s.type) ? `<div class="step-foto">${Arte.foto(s.type, productoDePaso(s.id, run.build))}</div>` : ""}
      <p class="eyebrow">${encab}</p>
      <h3>${esc(s.name)}</h3>
      <p>${esc(s.info)}</p>
      ${!instalado && (live || demand) && instr ? `<p class="instr">${icon("bolt", 16)} ${esc(instr)}</p>` : ""}
      ${!instalado && S.ayuda !== "off" ? `<p class="where">Va en: <b>${esc(tipoDest)}</b></p>` : ""}
      ${!pasoListo(s) && !instalado ? `<p class="locked-msg">${icon("lock", 16)} ${esc(pendientesTexto(s))}</p>` : ""}
      ${ficha ? `<table class="tbl spec"><tbody>${ficha.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table>` : ""}
    </div>`;
  const dec = $("#mentorTx");
  if (dec) dec.innerHTML = instalado ? `Muy bien. Ahora sigue con la siguiente pieza.` : (live && esAct ? "Lee la teoría de este paso y arrastra la pieza a su lugar." : "Tú decides el siguiente paso. Si dudas, consulta las fichas.");
}
function decirPasoActual() { /* el texto lo pone pintarInfo */ }

function seleccionarPaso(id) {
  run.sel = run.sel === id ? null : id;
  pintarBandeja(); pintarInfo();
}

function clicEnEscena(e) {
  const x = e.clientX, y = e.clientY;
  if (run.sel) {
    const s = pasoPorId(run.sel);
    if (s && !run.placed.has(s.id)) { soltar(s, x, y); return; }
  }
  const ocupados = slotsEn(x, y).filter(el => el.dataset.paso);
  if (ocupados.length) { run.sel = ocupados[ocupados.length - 1].dataset.paso; pintarBandeja(); pintarInfo(); }
}

/* ---------- Arrastrar ---------- */
function iniciarArrastre(e, id, card) {
  if (e.button !== undefined && e.button !== 0) return;
  const s = pasoPorId(id), x0 = e.clientX, y0 = e.clientY;
  let movido = false, ghost = null;
  if (e.pointerType !== "touch") e.preventDefault();
  const mover = ev => {
    if (!movido && Math.hypot(ev.clientX - x0, ev.clientY - y0) > 6) {
      if (!pasoListo(s)) return;
      movido = true; card.classList.add("dragging");
      ghost = document.createElement("div"); ghost.className = "dragghost"; ghost.innerHTML = Arte.tiene(s.type) ? Arte.foto(s.type, productoDePaso(s.id, run.build)) : icon(iconoDeTipo(s.type), 44); document.body.appendChild(ghost);
    }
    if (movido) { ghost.style.left = ev.clientX + "px"; ghost.style.top = ev.clientY + "px"; vistaPrevia(s, ev.clientX, ev.clientY); }
  };
  const fin = ev => {
    document.removeEventListener("pointermove", mover); document.removeEventListener("pointerup", fin); document.removeEventListener("pointercancel", fin);
    if (ghost) ghost.remove(); card.classList.remove("dragging"); limpiarPrevia();
    if (ev.type === "pointercancel") return;
    if (movido) soltar(s, ev.clientX, ev.clientY);
    else { if (!pasoListo(s)) { SFX.error(); toast("Aún no toca. " + pendientesTexto(s), "bad"); } seleccionarPaso(s.id); }
  };
  document.addEventListener("pointermove", mover); document.addEventListener("pointerup", fin); document.addEventListener("pointercancel", fin);
}

const slotEl = id => $(`.slot[data-id="${id}"]`, $("#scene"));
function dentro(el, x, y, tol) { const r = el.getBoundingClientRect(); return x >= r.left - tol && x <= r.right + tol && y >= r.top - tol && y <= r.bottom + tol; }
function slotsEn(x, y) {
  const tol = 2 * escala();
  return $$(".slot", $("#scene")).filter(el => !el.classList.contains("unused") && dentro(el, x, y, tol))
    .sort((a, b) => (b.offsetWidth * b.offsetHeight) - (a.offsetWidth * a.offsetHeight));   // los chicos al final
}
function masCercano(x, y, maxd) {
  let best = null, bd = Infinity;
  $$(".slot", $("#scene")).forEach(el => {
    if (el.classList.contains("unused")) return;
    const r = el.getBoundingClientRect(), d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    if (d < bd) { bd = d; best = el; }
  });
  return bd <= maxd ? best : null;
}
function tolerancia(s) { return (s.type === "monitor" || s.type === "keyboard" || s.type === "mouse" ? 8 : s.type === "fp-pin" ? 10 : 18) * escala(); }

function vistaPrevia(s, x, y) {
  limpiarPrevia();
  const tol = tolerancia(s);
  const ok = s.targets.map(slotEl).find(el => el && dentro(el, x, y, tol));
  if (S.ayuda === "live") {
    if (ok) { ok.classList.add("drop-ok"); return; }
    const cerca = slotsEn(x, y).pop() || masCercano(x, y, 60 * escala()); if (cerca) cerca.classList.add("drop-bad");
  } else { const cerca = slotsEn(x, y).pop(); if (cerca) cerca.classList.add("drop-hover"); }
}
function limpiarPrevia() { $$(".slot", $("#scene")).forEach(el => el.classList.remove("drop-ok", "drop-bad", "drop-hover")); }

/* ---------- Soltar ---------- */
function soltar(s, x, y) {
  if (!pasoListo(s)) { SFX.error(); abrirModal(`<h3>Falta un paso previo</h3><p>${esc(pendientesTexto(s))}</p><div class="row end"><button class="btn primary" data-cerrar>Entendido</button></div>`); return; }
  const tol = tolerancia(s);
  const destino = s.targets.find(t => { const el = slotEl(t); return el && dentro(el, x, y, tol); });
  if (destino) { colocar(s, destino); return; }

  const aqui = slotsEn(x, y).pop() || masCercano(x, y, 110 * escala());
  if (!aqui) { toast("Suelta la pieza sobre una ranura del gabinete.", "bad"); return; }
  SFX.error(); aqui.classList.add("flash-bad"); setTimeout(() => aqui.classList.remove("flash-bad"), 650);
  const def = SLOTS.find(d => d.id === aqui.dataset.id);
  let extra = "";
  if (def && def.decoy) extra = " " + def.decoy;
  else {
    const duenio = run.steps.find(z => z.targets.includes(aqui.dataset.id));
    if (duenio && duenio.id !== s.id) extra = ` Ese lugar (${etiquetaSlot(aqui.dataset.id)}) es para: ${duenio.name}.`;
  }
  const llave = s.id + "|" + aqui.dataset.id;
  if (!run.mistakeSet.has(llave)) { run.mistakeSet.add(llave); run.mistakes = run.mistakeSet.size; }
  abrirModal(`<h3>Esa pieza no va ahí</h3><p>${esc(s.wrong)}${esc(extra)}</p><div class="row end"><button class="btn primary" data-cerrar>Entendido</button></div>`);
}

function colocar(s, destino) {
  const fit = fitCheck(s, run.build);
  if (fit) { run.fitFails++; SFX.error(); mostrarFalloEncaje(s, fit); return; }
  run.placed.add(s.id); run.placedAt[s.id] = destino; run.sel = null;
  sfxDeInstalacion(s);
  pintarTodo();
  const el = slotEl(destino); if (el) { el.classList.add("pop"); setTimeout(() => el.classList.remove("pop"), 600); }
  toast(`${s.name} instalado`, "ok");
  if (run.steps.every(z => run.placed.has(z.id))) {
    SFX.ok(); toast("Todo instalado. Ya puedes encender la PC.", "ok");
  }
}

const PASOS_DE_CAT = { case: ["mobo"], mobo: ["mobo"], cpu: ["cpu"], ram: ["ram1", "ram2"], cooler: ["cooler", "aio"], gpu: ["gpu"], sto1: ["m2", "ssd", "hdd"], sto2: ["m2", "ssd", "hdd"], psu: [] };
function mostrarFalloEncaje(s, fit) {
  const cambiables = fit.cats.filter(k => !PASOS_DE_CAT[k].some(id => run.placed.has(id)));
  const btns = cambiables.map(k => `<button class="btn primary" data-cambiar="${k}">Cambiar ${esc(catInfo(k).n.toLowerCase())}</button>`).join("");
  abrirModal(`<h3>${esc(fit.title)}</h3><p>${esc(fit.body)}</p>
    <p class="muted">Esto pasa cuando una pieza no encaja con las demás. Se devuelve la pieza y se elige otra compatible (resta una estrella de error de compra).</p>
    <div class="row wrap end"><button class="btn" data-cerrar>Cerrar</button><button class="btn" id="btnTodo">Desmontar todo y rehacer la selección</button>${btns}</div>`);
  $$("[data-cambiar]").forEach(b => b.addEventListener("click", () => {
    cerrarModal(); abrirTiendaFix({ cats: cambiables, motivo: fit.title + ".", volver: "build", unplace: [] });
    ui.shopCat = b.dataset.cambiar; renderShop();
  }));
  $("#btnTodo").addEventListener("click", () => { cerrarModal(); desmontarTodo(true); });
}

function desmontarTodo(sinPreguntar) {
  const hacer = () => { cerrarModal(); run.placed = new Set(); run.placedAt = {}; run.sel = null; run.fix = null; go("shop"); };
  if (sinPreguntar === true || !run.placed.size) { hacer(); return; }
  abrirModal(`<h3>¿Volver a la tienda?</h3><p>Se desmontan todas las piezas instaladas. No pierdes dinero: las piezas siguen siendo tuyas.</p>
    <div class="row end"><button class="btn" data-cerrar>Seguir armando</button><button class="btn danger" id="okDesm">Desmontar</button></div>`);
  $("#okDesm").addEventListener("click", hacer);
}

function resaltarSiguiente() {
  const s = pasoActual(); if (!s) return;
  const gratis = S.ayuda === "live" || S.mejoras.manual;
  if (!gratis) { run.hints++; toast("Pista usada: resta un poco a tu reseña.", "bad"); }
  s.targets.forEach(t => { const el = slotEl(t); if (el) { el.classList.add("next"); setTimeout(() => el.classList.remove("next"), 3500); } });
  run.sel = s.id; pintarBandeja(); pintarInfo();
}
