/* =====================================================================
   PC BUILDER ACADEMY · 03 · MENÚ, TALLER, PEDIDOS Y LECCIONES
   ---------------------------------------------------------------------
   Flujo de un pedido:
     Taller (hub) → Pedido (brief) → Lección previa → Tienda → Ensamble
     → Encendido (POST) → [Diagnóstico] → Entrega (result)
   Los pedidos de reparación saltan la tienda y el ensamble.
   ===================================================================== */

/* Imagen de cada pedido: una pieza representativa del trabajo. */
const FOTO_PEDIDO = {
  oficina: ["monitor"], estudiante: ["keyboard"], gamer: ["gpu", { n: "RTX 4060", len: 240, conn: 1, tier: 3 }], minipc: ["case", { id: "case_itx" }],
  nas: ["hdd", { gb: 4000 }], diseno: ["mobo"], video: ["cpu", { socket: "LGA1700", n: "Core i7-13700K", cores: "16 / 24" }], extremo: ["gpu", { n: "RTX 4090", len: 340, conn: 3, tier: 5 }],
  r_psu: ["psu", { w: 450, cert: "80+ Bronze", pcie: 1 }], r_ram: ["ram", { type: "DDR4", mhz: 3200, gb: 16, mods: 2 }], r_storage: ["hdd"], r_monitor: ["monitor"],
  r_video: ["gpu"], r_cpu: ["cpu"], r_cooling: ["cooler", { id: "f_tower" }], r_eps: ["cable-eps"], r_ok: ["case"]
};
function fotoDePedido(o) { const f = FOTO_PEDIDO[o.id]; return f ? Arte.foto(f[0], f[1]) : o.ico; }

/* ---------- Menú principal ---------- */
function renderMenu() {
  const guardado = hayGuardado();
  $("#app").innerHTML = `
    <section class="menu">
      <div class="hero" aria-hidden="true">
        <span class="hp hp-a">${Arte.foto("gpu", { n: "RTX 4070", len: 300, conn: 1, tier: 4 })}</span>
        <span class="hp hp-b">${Arte.foto("cpu", { socket: "LGA1700", n: "Core i7-13700K", cores: "16 / 24" })}</span>
        <span class="hp hp-c">${Arte.foto("ram", { type: "DDR5", mhz: 6000, gb: 32, mods: 2 })}</span>
        <span class="hp hp-d">${Arte.foto("case", { id: "case_atx" })}</span>
      </div>
      <h1>PC Builder <b>Academy</b></h1>
      <p class="lead">Atiende a tus clientes, elige las piezas con su presupuesto, arma cada equipo paso a paso y diagnostica fallas. Aprendes hardware mientras tu taller crece.</p>
      <div class="menu-btns">
        ${guardado ? `<button class="btn primary big" id="mContinuar">Continuar carrera</button>` : ""}
        <button class="btn ${guardado ? "" : "primary"} big" id="mNueva">${guardado ? "Nueva carrera" : "Empezar carrera"}</button>
        <button class="btn big" id="mLibre">Modo libre</button>
        <button class="btn big" id="mBiblio">Biblioteca</button>
      </div>
      ${EMBEBIDO ? `<div class="menu-btns ext"><button class="btn big" data-ext="modTeoria">🎓 Teoría</button><button class="btn big" data-ext="modQuiz">📝 Autoevaluación</button><button class="btn big" data-ext="home">🏠 Inicio</button></div>` : ""}
      <p class="menu-credit">Basado en el proyecto «PC Builder · Simulador de Ensamblaje» (servicio social). Los pasos, fichas, teoría, catálogo, preguntas y casos de diagnóstico provienen de ese código.</p>
    </section>`;
  if (guardado) $("#mContinuar").addEventListener("click", () => { cargar(); go("hub"); });
  $("#mNueva").addEventListener("click", () => modalNuevaCarrera(guardado));
  $("#mLibre").addEventListener("click", () => { if (guardado) cargar(); iniciarLibre(); });
  $("#mBiblio").addEventListener("click", () => { if (guardado) cargar(); go("lib"); });
  $$("[data-ext]").forEach(x => x.addEventListener("click", () => irAlModulo(x.dataset.ext)));
}
PANTALLAS.menu = renderMenu;

function modalNuevaCarrera(conGuardado) {
  const opts = Object.keys(AYUDAS).map(k => `<label class="opt"><input type="radio" name="ayuda" value="${k}" ${k === "live" ? "checked" : ""}>
      <span><b>${AYUDAS[k].ico} ${AYUDAS[k].n}</b> <em>(×${AYUDAS[k].mult} de experiencia)</em><br><small>${AYUDAS[k].d}</small></span></label>`).join("");
  abrirModal(`<h3>Nueva carrera</h3>
    ${conGuardado ? `<p class="warn">Ya tienes una carrera guardada. Si empiezas otra, se reemplaza.</p>` : ""}
    <label class="field">Nombre de tu taller o de tu persona técnica
      <input id="nomIn" type="text" maxlength="24" value="Mi taller" autocomplete="off"></label>
    <fieldset class="opts"><legend>Nivel de ayuda</legend>${opts}</fieldset>
    <p class="muted small">Puedes cambiarlo después desde el Taller.</p>
    <div class="row end"><button class="btn" data-cerrar>Cancelar</button><button class="btn primary" id="nuevaOk">Abrir el taller</button></div>`);
  $("#nuevaOk").addEventListener("click", () => {
    S = carreraNueva();
    S.nombre = ($("#nomIn").value || "Taller").trim().slice(0, 24) || "Taller";
    S.ayuda = ($("input[name=ayuda]:checked") || { value: "live" }).value;
    S.tablero = generarTablero(); guardar(); cerrarModal(); go("hub");
  });
}

/* ---------- Tablero de pedidos ---------- */
function generarTablero() {
  const L = nivel().n, disp = PEDIDOS.filter(p => p.lvl <= L);
  const ord = a => shuffle(a).sort((x, y) => ((S.hechos[x.id] || 0) - (S.hechos[y.id] || 0)) || (y.lvl - x.lvl));
  const arm = ord(disp.filter(p => p.tipo === "armado")), rep = ord(disp.filter(p => p.tipo === "reparacion"));
  let el = [...arm.slice(0, 2), ...rep.slice(0, 1)];
  shuffle(disp).forEach(p => { if (el.length < 3 && !el.includes(p)) el.push(p); });
  return el.map(p => ({ tid: p.id, k: p.tipo === "armado" ? +(0.9 + Math.random() * 0.25).toFixed(2) : 1 }));
}
function pedidoDeItem(item) {
  const t = PEDIDOS.find(p => p.id === item.tid), o = Object.assign({}, t);
  if (t.tipo === "armado") { o.presupuesto = Math.round(t.presupuesto * item.k / 100) * 100; o.mano = Math.round(t.mano * item.k / 50) * 50; }
  return o;
}

function renderHub() {
  if (!S.tablero.length) { S.tablero = generarTablero(); guardar(); }
  const n = nivel(), sig = siguienteNivel();
  const tarjetas = S.tablero.map((it, i) => {
    const o = pedidoDeItem(it), esArm = o.tipo === "armado", c = CONCEPTOS[o.concepto];
    return `<article class="order">
      <div class="order-ico" aria-hidden="true">${fotoDePedido(o)}</div>
      <div class="order-body">
        <span class="tag ${esArm ? "arm" : "rep"}">${esArm ? "Armado" : "Reparación"}</span>
        <h3>${esc(o.titulo)}</h3>
        <p class="who">${esc(o.cliente)} · ${esc(o.rol)}</p>
        <ul class="facts">
          ${esArm ? `<li>Presupuesto <b>${money(o.presupuesto)}</b></li>` : ""}
          <li>Mano de obra <b>${money(o.mano)}</b></li>
          <li>${esArm ? o.reqs.length + " requisitos" : "Diagnóstico"}</li>
        </ul>
        ${c ? `<p class="learn">Aprenderás: ${esc(c.titulo)}</p>` : ""}
      </div>
      <button class="btn primary" data-pedido="${i}">Ver pedido</button>
    </article>`;
  }).join("");

  const proximos = PEDIDOS.filter(p => p.lvl === n.n + 1);
  const ayudaOpts = Object.keys(AYUDAS).map(k => `<button class="seg ${S.ayuda === k ? "on" : ""}" data-ayuda="${k}" title="${esc(AYUDAS[k].d)}">${AYUDAS[k].ico} ${AYUDAS[k].n}</button>`).join("");
  const faltaXP = sig ? sig.xp - S.xp : 0;

  $("#app").innerHTML = `
    <div class="hub">
      <header class="hub-head">
        <div><p class="eyebrow">Día ${S.dia}</p><h1>${esc(S.nombre)}</h1></div>
        <button class="btn" id="nuevoDia" title="Genera pedidos nuevos">Pasar al siguiente día</button>
      </header>
      <div class="hub-grid">
        <section aria-label="Pedidos disponibles">
          <h2>Pedidos de hoy</h2>
          <div class="orders">${tarjetas}</div>
          ${proximos.length ? `<p class="muted small teaser">${icon("lock", 16)} Con el nivel ${n.n + 1} llegan pedidos como: ${proximos.slice(0, 3).map(p => esc(p.titulo)).join(", ")}${sig ? ` (faltan ${faltaXP} XP)` : ""}.</p>` : ""}
        </section>
        <aside class="hub-side">
          ${mentorHTML(`¡Bienvenido, ${esc(S.nombre)}! Cada pedido trae un cliente con necesidades y un presupuesto. Primero te explico el concepto clave, luego eliges piezas y las armas.`)}
          <div class="card">
            <h3>Nivel de ayuda</h3>
            <div class="segs">${ayudaOpts}</div>
            <p class="muted small" id="ayudaDesc">${AYUDAS[S.ayuda].d} Experiencia ×${AYUDAS[S.ayuda].mult}.</p>
          </div>
          <div class="card">
            <h3>Tu progreso</h3>
            <dl class="kv">
              <dt>Armados</dt><dd>${S.stats.armados}</dd>
              <dt>Reparaciones</dt><dd>${S.stats.reparados}</dd>
              <dt>Práctica acertada</dt><dd>${S.stats.quiz ? Math.round(S.stats.quizOk / S.stats.quiz * 100) + " %" : "—"}</dd>
              <dt>Reputación</dt><dd>${reputacion() ? "★ " + reputacion().toFixed(1) : "—"}</dd>
            </dl>
          </div>
        </aside>
      </div>
    </div>`;
  $$("[data-pedido]").forEach(b => b.addEventListener("click", () => abrirPedido(+b.dataset.pedido)));
  $("#nuevoDia").addEventListener("click", () => { S.dia++; S.tablero = generarTablero(); guardar(); go("hub"); });
  $$("[data-ayuda]").forEach(b => b.addEventListener("click", () => {
    S.ayuda = b.dataset.ayuda; guardar();
    $$("[data-ayuda]").forEach(x => x.classList.toggle("on", x === b));
    $("#ayudaDesc").textContent = `${AYUDAS[S.ayuda].d} Experiencia ×${AYUDAS[S.ayuda].mult}.`;
  }));
}
PANTALLAS.hub = renderHub;

/* ---------- Pedido (briefing) ---------- */
function nuevoRun(order, item) {
  return { order, item: item || null, libre: false, build: {}, placed: new Set(), placedAt: {}, sel: null,
    mistakes: 0, fitFails: 0, wrongDiag: 0, hints: 0, postFails: 0, verificaciones: 0, fix: null, diag: null,
    vistoPOST: false, quizHecho: false, mistakeSet: new Set() };
}
function abrirPedido(i) {
  const item = S.tablero[i]; if (!item) return;
  run = nuevoRun(pedidoDeItem(item), item);
  go("brief");
}
function iniciarLibre() {
  run = nuevoRun({ id: "libre", tipo: "armado", titulo: "Modo libre", presupuesto: Infinity, mano: 0, xp: 0, reqs: [], cliente: "", rol: "" }, null);
  run.libre = true; run.build = { gpu: undefined };
  go("shop");
}

function renderBrief() {
  const o = run.order, esArm = o.tipo === "armado", c = CONCEPTOS[o.concepto];
  $("#app").innerHTML = `
    <div class="brief">
      <button class="btn ghost" id="volver">← Volver al taller</button>
      <div class="brief-grid">
        <section class="paper">
          <p class="eyebrow">${esArm ? "Pedido de armado" : "Pedido de reparación"}</p>
          <h1>${o.ico} ${esc(o.titulo)}</h1>
          <p class="client"><b>${esc(o.cliente)}</b> · ${esc(o.rol)}</p>
          <blockquote>${esc(o.historia)}</blockquote>
          ${esArm ? `<h3>Lo que necesita</h3>
            <ul class="reqs">${o.reqs.map(r => `<li>${esc(r.t)}</li>`).join("")}</ul>` :
            `<h3>Tu misión</h3><p>Enciende el equipo, observa los síntomas del POST, deduce la <b>causa</b> y elige el <b>arreglo</b>. Mientras menos pistas uses, mejor reseña.</p>`}
        </section>
        <aside class="brief-side">
          <div class="card">
            <dl class="kv big">
              ${esArm ? `<dt>Presupuesto para piezas</dt><dd>${money(o.presupuesto)}</dd>` : ""}
              <dt>Mano de obra</dt><dd>${money(o.mano)}</dd>
              <dt>Experiencia</dt><dd>hasta ${Math.round(o.xp * AYUDAS[S.ayuda].mult)} XP</dd>
              <dt>Ayuda</dt><dd>${AYUDAS[S.ayuda].ico} ${AYUDAS[S.ayuda].n}</dd>
            </dl>
            ${esArm ? `<p class="muted small">El cliente pone el dinero para las piezas. Lo que no gastes te deja propina (10 %) si cumples todo lo pedido. Gastar de más te cuesta a ti.</p>` : ""}
          </div>
          ${c ? `<div class="card concept"><h3>Concepto del pedido</h3><p>${esc(c.titulo)}</p></div>` : ""}
          <button class="btn primary big" id="aceptar">Aceptar pedido</button>
        </aside>
      </div>
    </div>`;
  $("#volver").addEventListener("click", () => { run = null; go("hub"); });
  $("#aceptar").addEventListener("click", () => {
    if (c && !S.vistos[o.concepto]) go("lesson");
    else siguienteTrasLeccion();
  });
}
PANTALLAS.brief = renderBrief;

function siguienteTrasLeccion() {
  if (run.order.tipo === "armado") go("shop"); else iniciarReparacion();
}

/* ---------- Lección previa ---------- */
function renderLesson() {
  const o = run.order, key = o.concepto, c = CONCEPTOS[key], t = THEORY[c.theory];
  const yaVista = !!S.vistos[key];
  $("#app").innerHTML = `
    <div class="lesson">
      <p class="eyebrow">Antes de empezar · ${yaVista ? "repaso" : "lección nueva"}</p>
      <h1>${esc(c.titulo)}</h1>
      <div class="lesson-grid">
        <section class="paper">
          <div class="lesson-t"><span class="lt-ico" style="--c:${t.col}">${t.ico}</span><div><h3>${esc(t.t)}</h3><p class="muted">${esc(t.tag)}</p></div></div>
          <p>${esc(t.def)}</p>
          <div class="chips">${t.points.map(p => `<span class="pill">${esc(p)}</span>`).join("")}</div>
          <h3>Reglas que vas a usar en este pedido</h3>
          <ol class="rules">${c.reglas.map(r => `<li>${esc(r)}</li>`).join("")}</ol>
          <p class="example"><b>Ejemplo:</b> ${esc(c.ejemplo)}</p>
          <p class="clave"><b>Clave:</b> ${esc(t.clave)}</p>
        </section>
        <aside>
          ${mentorHTML("Lee las reglas con calma: te van a servir para elegir bien y para entender los avisos del verificador.")}
          <div class="card" id="pregunta">
            <h3>Piénsalo</h3>
            <p>${esc(t.chk.q)}</p>
            <button class="btn" id="verResp">Ver respuesta</button>
            <p class="resp" id="resp" hidden>${esc(t.chk.a)}</p>
          </div>
          <button class="btn primary big" id="entendido">Entendido, continuar</button>
        </aside>
      </div>
    </div>`;
  $("#verResp").addEventListener("click", () => { $("#resp").hidden = false; $("#verResp").hidden = true; });
  $("#entendido").addEventListener("click", () => { S.vistos[key] = true; guardar(); siguienteTrasLeccion(); });
}
PANTALLAS.lesson = renderLesson;

/* ---------- Mejoras del taller ---------- */
function renderMejoras() {
  const cards = MEJORAS.map(m => {
    const tengo = !!S.mejoras[m.id], puedo = S.dinero >= m.p;
    return `<article class="card upg ${tengo ? "owned" : ""}">
      <div class="upg-ico" aria-hidden="true">${m.ico}</div>
      <h3>${esc(m.n)}</h3><p>${esc(m.d)}</p>
      ${tengo ? `<p class="ok-t">Ya la tienes</p>` : `<button class="btn ${puedo ? "primary" : ""}" data-comprar="${m.id}" ${puedo ? "" : "disabled"}>Comprar · ${money(m.p)}</button>`}
    </article>`;
  }).join("");
  $("#app").innerHTML = `<div class="page"><h1>Mejoras del taller</h1>
    <p class="lead small">Se pagan con tus ganancias y te ayudan a trabajar mejor. No cambian lo que aprendes: cambian lo cómodo que te resulta.</p>
    <div class="upg-grid">${cards}</div></div>`;
  $$("[data-comprar]").forEach(b => b.addEventListener("click", () => {
    const m = MEJORAS.find(x => x.id === b.dataset.comprar);
    if (S.dinero < m.p) return; S.dinero -= m.p; S.mejoras[m.id] = true; guardar(); SFX.buy(); renderBarra(); renderMejoras();
    toast(`${m.n} comprada`, "ok");
  }));
}
PANTALLAS.mejoras = renderMejoras;
