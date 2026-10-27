/* =====================================================================
   PC BUILDER ACADEMY · 04 · TIENDA
   ---------------------------------------------------------------------
   El jugador elige UNA pieza por categoría con el dinero del cliente.
   · Tarjetas con características y precio (los datos están en PRODUCTOS).
   · Verificador de compatibilidad con la explicación de cada regla
     (según el nivel de ayuda: en vivo, bajo demanda o desactivado).
   · Requisitos del cliente con ✓ en vivo.
   · Modo "fix": cuando una pieza falla al instalar o al encender, se
     vuelve aquí SOLO a cambiar esa categoría (el extra lo pagas tú).
   ===================================================================== */

function chipsDe(cat, p) {
  if (p.none) return [];
  const tipoS = { nvme: "NVMe (PCIe)", ssd: "SSD SATA", hdd: "Disco duro" };
  switch (cat) {
    case "case":   return [`Placas ${p.supports.join("/")}`, `GPU ≤ ${p.maxGpu} mm`, `Disipador ≤ ${p.maxCooler} mm`, (p.maxRad ? `Radiador ≤ ${p.maxRad} mm` : "Sin radiador")];
    case "mobo":   return [p.chip, p.ff, `Socket ${p.socket}`, `${p.slots}× ${p.ram} · máx. ${p.ramMax} GB`, p.oc ? "Overclock" : "Sin overclock"];
    case "cpu":    return [`Socket ${p.socket}`, `${p.cores} núcleos/hilos`, `TDP ${p.tdp} W`, p.igpu ? "Con iGPU" : "SIN iGPU", `Nivel ${p.tier}`];
    case "ram":    return [p.type, p.mods === 2 ? "2 módulos · dual channel" : "1 módulo", `${p.mhz} MHz`];
    case "cooler": return [p.aio ? "Líquida AIO" : "Aire", `Disipa ${p.tdp} W`, p.aio ? `Radiador ${p.rad} mm` : `Alto ${p.h} mm`];
    case "gpu":    return [`${p.vram} GB VRAM`, `${p.tdp} W`, `${p.len} mm`, p.conn ? `${p.conn}×8 pines` : "Sin cable PCIe", `Nivel ${p.tier}`];
    case "sto1": case "sto2": return [tipoS[p.type], p.gb >= 1000 ? (p.gb / 1000) + " TB" : p.gb + " GB", `~${p.mbs} MB/s`];
    case "psu":    return [`${p.w} W`, `${p.pcie}× PCIe 8 pines`, p.cert];
  }
  return [];
}

function listaDeCategoria(cat) {
  let l = productosDe(cat).slice().sort((a, b) => a.p - b.p);
  if (cat === "gpu") l = [SIN_GPU].concat(l);
  if (cat === "sto2") l = [SIN_EXTRA].concat(l);
  return l;
}
function seleccionDe(cat) {          // pieza elegida en la categoría (o 'none' para los "sin")
  const v = run.build[cat];
  if (cat === "gpu") return v === null ? SIN_GPU : v;
  if (cat === "sto2") return v === null ? SIN_EXTRA : v;
  return v;
}
function bloqueada(p) { return !run.libre && p.lvl > nivel().n; }
function categoriaPermitida(cat) { return !run.fix || run.fix.cats.includes(cat); }

function renderChecker(ev) {
  const lineas = g => g.checks.map(c => {
    const ic = c.s === "ok" ? "✓" : c.s === "bad" ? "✕" : "!";
    return `<li class="chk ${c.s}"><b>${ic}</b><span>${esc(c.t)}<em>${esc(c.w)}</em></span></li>`;
  }).join("");
  return `<div class="verdict ${ev.hayBad ? "bad" : "ok"}">${ev.hayBad ? "Hay problemas que corregir" : "Sin problemas de compatibilidad"}</div>` +
    ev.groups.map(g => `<h4>${esc(g.title)}</h4><ul class="chks">${lineas(g)}</ul>`).join("");
}

function renderShop() {
  const b = run.build, o = run.order, fix = run.fix;
  if (!ui.shopCat || !categoriaPermitida(ui.shopCat)) ui.shopCat = fix ? fix.cats[0] : (ui.shopCat || "case");
  const cat = ui.shopCat, ci = catInfo(cat);
  const gasto = precioBuild(b), pres = o.presupuesto, ilim = !isFinite(pres);
  const ev = evaluate(b), ayuda = S.ayuda;
  const malCats = new Set(); if (ayuda === "live") ev.todos.filter(c => c.s === "bad").forEach(c => c.cats.forEach(k => malCats.add(k)));
  const falta = faltantes(b);
  const pct = ilim ? 0 : clamp(gasto / pres * 100, 0, 100);

  /* ----- navegación de categorías ----- */
  const nav = CATS.map(c => {
    const sel = seleccionDe(c.k), ok = !!sel;
    const bloq = !categoriaPermitida(c.k);
    return `<button class="catbtn ${c.k === cat ? "on" : ""} ${bloq ? "lockedcat" : ""}" data-cat="${c.k}" ${bloq ? "disabled" : ""}>
      <span class="cb-ico">${icon(c.ico, 24)}</span>
      <span class="cb-tx"><b>${esc(c.n)}${c.opt ? " <i>(opcional)</i>" : ""}</b>
        <small>${sel ? esc(sel.n) : "sin elegir"}</small></span>
      <span class="cb-st">${malCats.has(c.k) ? '<i class="dot bad" title="Hay un problema"></i>' : (ok ? '<i class="dot ok"></i>' : "")}</span>
    </button>`;
  }).join("");

  /* ----- productos ----- */
  let nOcultas = 0;
  const prods = listaDeCategoria(cat).map(p => {
    const sel = seleccionDe(cat) && seleccionDe(cat).id === p.id;
    const lock = bloqueada(p);
    const conf = (ayuda === "live" && !lock && !p.none) ? conflictoDe(cat, p, b) : (ayuda === "live" && p.none && cat === "gpu" ? conflictoDe(cat, p, b) : null);
    if (ayuda === "live" && ui.soloCompat && conf && !sel) { nOcultas++; return ""; }   // filtro "solo compatibles"
    const nuevo = (b[cat] ? b[cat].p : 0);
    const sobra = !fix && !ilim && !sel && (gasto - nuevo + p.p > pres);
    return `<button class="prod ${sel ? "sel" : ""} ${lock ? "lock" : ""} ${sobra ? "over" : ""}" data-prod="${p.id}" ${lock ? "disabled" : ""}>
      <span class="prod-ico">${p.none ? icon("lock", 30) : Arte.foto(Arte.tipoDe(cat, p), p)}</span>
      <span class="prod-main"><b>${esc(p.n)}</b>
        <span class="chips">${chipsDe(cat, p).map(c => `<span class="pill">${esc(c)}</span>`).join("")}</span>
        ${conf ? `<span class="conf">✕ ${esc(conf)}</span>` : ""}
        ${lock ? `<span class="conf lockmsg">Se desbloquea en el nivel ${p.lvl}</span>` : ""}
        ${sobra ? `<span class="conf lockmsg">Se pasa del presupuesto</span>` : ""}
      </span>
      <span class="prod-price">${p.p ? money(p.p) : "Gratis"}</span>
      ${sel ? '<span class="chosen">Elegida</span>' : ""}
    </button>`;
  }).join("");

  /* ----- panel derecho ----- */
  const reqs = reqStatus(o, b);
  const reqHTML = reqs.length ? `<div class="card"><h3>Requisitos del cliente</h3><ul class="reqlist">${reqs.map(r => `<li class="${r.ok ? "ok" : ""}"><b>${r.ok ? "✓" : "○"}</b>${esc(r.t)}</li>`).join("")}</ul></div>` : "";
  let checker = "";
  if (ayuda === "live") checker = `<div class="card"><h3>Verificador de compatibilidad</h3><div id="chkBody">${ev.groups.length ? renderChecker(ev) : '<p class="muted">Elige piezas y verás aquí si son compatibles y por qué.</p>'}</div></div>`;
  else if (ayuda === "demand") checker = `<div class="card"><h3>Verificador de compatibilidad</h3>
      <button class="btn" id="verifBtn" ${falta.length ? "disabled" : ""}>Verificar ${S.mejoras.meter ? "(gratis)" : "($100)"}</button>
      <div id="chkBody">${run.verif ? renderChecker(run.verif) : '<p class="muted">Completa tu selección y pulsa «Verificar».</p>'}</div></div>`;
  else checker = `<div class="card"><h3>Modo experto</h3><p class="muted">Sin verificador. Revisa las fichas con cuidado: lo que no encaje lo descubrirás al instalar o al encender.</p></div>`;

  const entrada = (CATALOG.find(c => c.name === ci.lib) || {});
  const consejo = entrada.elegir ? `<div class="card"><h3>Cómo elegir: ${esc(ci.n)}</h3><ul class="tips">${entrada.elegir.map(t => `<li>${esc(t)}</li>`).join("")}</ul>
      <button class="btn small" id="verFicha">Ver ficha completa</button></div>` : "";

  const pie = fix
    ? `<button class="btn primary big" id="btnFix" ${falta.length ? "disabled" : ""}>${fix.volver === "post" ? "Listo, volver a encender" : "Listo, volver al armado"}</button>`
    : `<button class="btn primary big" id="btnSeguir" ${falta.length ? "disabled" : ""}>Continuar al ensamblaje</button>`;

  $("#app").innerHTML = `
    <div class="shop">
      <header class="shop-head">
        <div><p class="eyebrow">${run.libre ? "Modo libre" : esc(o.cliente)}</p><h1>${fix ? "Cambio de pieza" : "Tienda de componentes"}</h1></div>
        <div class="budget ${ilim ? "free" : ""}">
          ${ilim ? `<span class="b-n">${money(gasto)}</span><small>sin límite de presupuesto</small>` : `
          <div class="b-top"><span class="b-n ${gasto > pres ? "over" : ""}">${money(gasto)}</span><small>de ${money(pres)}</small></div>
          <div class="meter"><i style="width:${pct}%" class="${gasto > pres ? "over" : pct > 85 ? "warn" : ""}"></i></div>
          <small>${gasto <= pres ? `Quedan ${money(pres - gasto)}` : `Te pasaste por ${money(gasto - pres)} (sale de tu ganancia)`}</small>`}
        </div>
      </header>
      ${fix ? `<div class="banner">🔧 <b>${esc(fix.motivo)}</b> Cambia la pieza señalada. Lo que gastes por encima del presupuesto sale de tu mano de obra.</div>` : ""}
      <div class="shop-grid">
        <nav class="catnav" aria-label="Categorías">${nav}</nav>
        <section class="prodlist" aria-label="${esc(ci.n)}">
          <div class="prodhead"><h2>${esc(ci.n)}</h2>
            ${ayuda === "live" ? `<button class="filtro ${ui.soloCompat ? "on" : ""}" id="soloCompat" aria-pressed="${!!ui.soloCompat}">${ui.soloCompat ? `Mostrando solo compatibles (${nOcultas} ocultas)` : "Mostrar solo compatibles"}</button>` : ""}</div>
          <div class="prods">${prods}</div>
        </section>
        <aside class="shop-side">
          ${mentorHTML(textoMentorTienda(cat, ev))}
          ${reqHTML}${checker}${consejo}
        </aside>
      </div>
      <footer class="shop-foot">
        <button class="btn ghost" id="cancelar">${fix ? "" : "Cancelar pedido"}</button>
        <span class="muted small">${falta.length ? "Faltan: " + falta.map(k => catInfo(k).n).join(", ") : "Selección completa"}</span>
        ${pie}
      </footer>
    </div>`;

  $$("[data-cat]").forEach(x => x.addEventListener("click", () => { ui.shopCat = x.dataset.cat; renderShop(); }));
  $$("[data-prod]").forEach(x => x.addEventListener("click", () => elegirProducto(cat, x.dataset.prod)));
  if ($("#soloCompat")) $("#soloCompat").addEventListener("click", () => { ui.soloCompat = !ui.soloCompat; renderShop(); });
  if ($("#verifBtn")) $("#verifBtn").addEventListener("click", verificarBajoDemanda);
  if ($("#verFicha")) $("#verFicha").addEventListener("click", () => abrirFichaCatalogo(entrada));
  if ($("#btnSeguir")) $("#btnSeguir").addEventListener("click", continuarAArmado);
  if ($("#btnFix")) $("#btnFix").addEventListener("click", terminarFix);
  if (!fix && $("#cancelar")) $("#cancelar").addEventListener("click", () => navegar("hub")); else if ($("#cancelar")) $("#cancelar").hidden = true;
}
PANTALLAS.shop = renderShop;

function textoMentorTienda(cat, ev) {
  if (run.fix) return `Algo no salió bien con esa pieza. Piensa por qué falló, elige una que sí funcione y vuelve.`;
  const tips = {
    case: "Empieza por el gabinete: define el tamaño máximo de la placa, de la GPU y del disipador.",
    mobo: "La placa decide el socket del procesador y el tipo de RAM (DDR4 o DDR5). Revisa también su tamaño.",
    cpu: "El procesador debe tener el mismo socket que la placa. Fíjate si trae gráficos integrados (iGPU).",
    ram: "La RAM debe ser del mismo tipo que la placa. Dos módulos activan el dual channel.",
    cooler: "Compara lo que disipa el enfriamiento con el TDP del procesador, y revisa que quepa en el gabinete.",
    gpu: "Sin tarjeta gráfica solo hay imagen si el procesador trae iGPU. Revisa largo y cables PCIe.",
    sto1: "El sistema operativo va en esta unidad: un SSD arranca mucho más rápido que un HDD.",
    sto2: "Opcional. Un HDD grande es una buena forma barata de ganar espacio.",
    psu: "Suma CPU + GPU + ~150 W y deja ~25 % de margen. Revisa cuántos cables PCIe trae."
  };
  return tips[cat] || "Elige con cuidado.";
}

function elegirProducto(cat, id) {
  const lista = listaDeCategoria(cat), p = lista.find(x => x.id === id); if (!p || bloqueada(p) || !categoriaPermitida(cat)) return;
  const b = run.build, actual = seleccionDe(cat);
  const quitar = actual && actual.id === p.id && !p.none && !(catInfo(cat).opt);   // volver a tocar = quitar
  const nuevo = quitar ? undefined : (p.none ? null : p);
  const antes = b[cat] ? b[cat].p : 0, despues = nuevo ? nuevo.p : 0;
  if (!run.fix && !run.libre && precioBuild(b) - antes + despues > run.order.presupuesto) { SFX.error(); toast("Presupuesto insuficiente para esa pieza", "bad"); return; }
  if (quitar) { delete b[cat]; if (cat === "gpu") b.gpu = undefined; } else b[cat] = nuevo;
  if (cat === "sto2" && nuevo === undefined) b.sto2 = null;
  run.verif = null; SFX.buy();
  const sc = $(".prodlist"); const y = sc ? sc.scrollTop : 0;
  renderShop(); const sc2 = $(".prodlist"); if (sc2) sc2.scrollTop = y;
  if (nuevo !== undefined && nuevo) decir(`Elegiste <b>${esc(nuevo.n)}</b>. ${comentarioDe(cat, nuevo)}`);
}
function comentarioDe(cat, p) {
  switch (cat) {
    case "cpu": return p.igpu ? "Trae gráficos integrados, así que podría dar imagen sin tarjeta gráfica." : "No trae gráficos integrados: necesitarás tarjeta gráfica.";
    case "ram": return p.mods === 2 ? "Dos módulos: se instalan en A2 y B2 para dual channel." : "Un solo módulo: funciona en single channel.";
    case "gpu": return p.none ? "Usarás los gráficos integrados del CPU (si los tiene)." : (p.conn ? `Pide ${p.conn} cable(s) PCIe de 8 pines.` : "Se alimenta desde la ranura PCIe.");
    case "psu": return `Entrega hasta ${p.w} W con ${p.pcie} cable(s) PCIe.`;
    case "cooler": return `Puede disipar hasta ${p.tdp} W.`;
    case "case": return `Admite placas ${p.supports.join(", ")}.`;
    case "mobo": return `Socket ${p.socket} y memoria ${p.ram}.`;
    default: return "";
  }
}

function verificarBajoDemanda() {
  const falta = faltantes(run.build); if (falta.length) return;
  const gratis = !!S.mejoras.meter;
  if (!gratis) { if (S.dinero < 100) { toast("No te alcanza para verificar ($100)", "bad"); return; } S.dinero -= 100; guardar(); renderBarra(); }
  run.verificaciones++; run.verif = evaluate(run.build); SFX.ok(); renderShop();
}

function abrirFichaCatalogo(c) {
  const q = c.qa;
  const html = `<h3>${c.emoji} ${esc(c.name)}</h3><p class="muted">${esc(c.resumen)}</p>
    <div class="qa-block">
      ${[["¿Qué es?", q.quees], ["¿Qué función cumple?", q.funcion], ["¿Cómo se comunica?", q.comunicacion], ["¿Qué características revisar?", q.carac],
         ["Errores comunes", q.errores], ["¿Qué pasa si no es compatible?", q.incompat], ["Impacto en el rendimiento", q.rend]]
        .map(x => `<div class="qa"><span class="q">${x[0]}</span><span class="a">${esc(x[1])}</span></div>`).join("")}
    </div>
    ${c.tabla ? `<h4>Tipos y comparativa</h4><div class="scroll-x"><table class="tbl"><thead><tr>${c.tabla.cols.map(x => `<th>${esc(x)}</th>`).join("")}</tr></thead><tbody>
      ${c.tabla.rows.map(r => `<tr>${r.map(x => `<td>${esc(x)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>` : ""}
    ${c.elegir ? `<h4>¿Cómo elegirlo?</h4><ul class="tips">${c.elegir.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}
    <div class="row end"><button class="btn primary" data-cerrar>Cerrar</button></div>`;
  abrirModal(html, { ancho: true });
}

/* ---------- Pasar al ensamble ---------- */
function continuarAArmado() {
  if (faltantes(run.build).length) return;
  const noCumple = reqStatus(run.order, run.build).filter(r => !r.ok);
  const seguir = () => { cerrarModal(); iniciarEnsamble(); };
  if (noCumple.length && !run.libre) {
    abrirModal(`<h3>Tu configuración no cumple todo</h3><p>El cliente pidió cosas que esta selección no cubre:</p>
      <ul class="reqlist">${noCumple.map(r => `<li><b>✕</b>${esc(r.t)}</li>`).join("")}</ul>
      <p class="muted">Si continúas, la reseña y el pago bajarán. Puedes volver y cambiar piezas.</p>
      <div class="row end"><button class="btn" data-cerrar>Volver a la tienda</button><button class="btn danger" id="seguirIgual">Continuar de todos modos</button></div>`);
    $("#seguirIgual").addEventListener("click", seguir);
  } else seguir();
}
function iniciarEnsamble() {
  run.steps = makeSteps(run.build); run.placed = new Set(); run.placedAt = {}; run.sel = null;
  go("build");
}

/* ---------- Modo "fix": cambiar una pieza tras una falla ---------- */
function abrirTiendaFix(fix) {
  run.fix = fix; run.verif = null; ui.shopCat = fix.cats[0]; go("shop");
}
function terminarFix() {
  const fx = run.fix; run.fix = null;
  (fx.unplace || []).forEach(id => { run.placed.delete(id); delete run.placedAt[id]; });
  run.steps = makeSteps(run.build);
  run.placed = new Set([...run.placed].filter(id => run.steps.some(s => s.id === id)));
  /* Una pieza nueva puede no encajar con lo ya instalado: se revisa y, si no encaja, se vuelve a instalar. */
  run.steps.forEach(s => { if (run.placed.has(s.id) && fitCheck(s, run.build)) run.placed.delete(s.id); });
  Object.keys(run.placedAt).forEach(id => { if (!run.placed.has(id)) delete run.placedAt[id]; });
  if (fx.volver === "post" && run.steps.every(s => run.placed.has(s.id))) go("post", { reintento: true });
  else go("build");
}
