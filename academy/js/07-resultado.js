/* =====================================================================
   PC BUILDER ACADEMY · 07 · ENTREGA Y RESULTADOS
   ---------------------------------------------------------------------
   Reseña del cliente (1 a 5 estrellas), pago, experiencia y repaso.
   Cada penalización se muestra con su motivo: el error también enseña.
   ===================================================================== */

function calcularResultado() {
  const o = run.order, b = run.build, arm = o.tipo === "armado";
  const noCumple = arm && !run.libre ? reqStatus(o, b).filter(r => !r.ok) : [];
  const penal = [];
  let est = 5;
  const resta = (v, tope, texto) => { const q = Math.min(tope, v); if (q > 0) { est -= q; penal.push({ t: texto, v: q }); } };
  resta(run.mistakes * 0.25, 2, `${run.mistakes} pieza(s) soltada(s) en un lugar equivocado`);
  resta(run.fitFails * 0.5, 2, `${run.fitFails} pieza(s) que no encajaron (error de compra)`);
  resta(run.wrongDiag * 0.5, 1.5, `${run.wrongDiag} respuesta(s) incorrecta(s) en el diagnóstico`);
  resta(run.hints * 0.25, 1, `${run.hints} pista(s) usada(s)`);
  if (arm) resta(run.postFails * 0.5, 1.5, `${run.postFails} falla(s) al encender`);
  if (noCumple.length && est > 2) { penal.push({ t: `El cliente pidió ${noCumple.length} cosa(s) que no cumpliste`, v: est - 2 }); est = 2; }
  est = clamp(Math.round(est * 2) / 2, 1, 5);

  let mano = o.mano * (0.5 + 0.1 * est);
  if (noCumple.length) mano *= 0.5;
  const pro = S.mejoras.pro ? mano * 0.1 : 0;
  const gasto = arm ? precioBuild(b) : 0;
  const finito = isFinite(o.presupuesto);
  const propina = arm && finito && !noCumple.length ? Math.max(0, o.presupuesto - gasto) * 0.1 : 0;
  const garantia = arm && finito ? Math.max(0, gasto - o.presupuesto) : 0;
  const total = run.libre ? 0 : Math.round(mano + pro + propina - garantia);
  const xp = run.libre ? 0 : Math.round(o.xp * (est / 5) * AYUDAS[S.ayuda].mult);
  return { est, mano: Math.round(mano), pro: Math.round(pro), propina: Math.round(propina), garantia: Math.round(garantia), total, xp, gasto, noCumple, penal };
}

function liquidar() {
  const r = run.res, o = run.order; if (run.libre) return null;
  S.dinero = Math.max(0, S.dinero + r.total);
  S.ratings.push(r.est);
  S.hechos[o.id] = (S.hechos[o.id] || 0) + 1;
  if (o.tipo === "armado") S.stats.armados++; else S.stats.reparados++;

  if (run.item) {
    S.tablero = S.tablero.filter(it => it !== run.item);
    const nuevos = generarTablero().filter(n => !S.tablero.some(x => x.tid === n.tid));
    while (S.tablero.length < 3 && nuevos.length) S.tablero.push(nuevos.shift());
  }
  const lv = ganarXP(r.xp);
  guardar();
  return lv;
}

const estrellasHTML = est => [1, 2, 3, 4, 5].map(i => `<span class="star ${est >= i ? "full" : est >= i - 0.5 ? "half" : ""}">★</span>`).join("");

function renderResult() {
  const o = run.order, arm = o.tipo === "armado", b = run.build;
  if (!run.res) { run.res = calcularResultado(); run.lvUp = liquidar(); }
  const r = run.res, c = CONCEPTOS[o.concepto];
  renderBarra();
  const filas = [];
  if (!run.libre) {
    filas.push([`Mano de obra (${r.est} ★)`, money(r.mano)]);
    if (r.pro) filas.push(["Banco profesional (+10 %)", "+" + money(r.pro)]);
    if (r.propina) filas.push(["Propina por ahorrar presupuesto", "+" + money(r.propina)]);
    if (r.garantia) filas.push(["Gasto fuera de presupuesto (garantía)", "−" + money(r.garantia)]);
  }
  const bn = arm ? bench(b) : null;
  const barra = (n, v) => `<div class="bar-row"><span>${n}</span><div class="meter"><i style="width:${v}%"></i></div><b>${v}</b></div>`;

  $("#app").innerHTML = `
    <div class="result">
      <header class="result-head">
        <p class="eyebrow">${run.libre ? "Modo libre" : esc(o.cliente) + " · " + esc(o.titulo)}</p>
        <h1>${run.libre ? "¡La PC arrancó!" : (r.est >= 4 ? "¡Cliente feliz!" : r.est >= 3 ? "Pedido entregado" : "El cliente quedó a medias")}</h1>
        ${run.libre ? "" : `<div class="stars big" aria-label="${r.est} de 5 estrellas">${estrellasHTML(r.est)}</div>`}
      </header>
      <div class="result-grid">
        <section class="col">
          ${run.libre ? "" : `<div class="card"><h3>Factura</h3>
            <table class="tbl"><tbody>${filas.map(f => `<tr><td>${esc(f[0])}</td><td class="num">${esc(f[1])}</td></tr>`).join("")}
            <tr class="tot"><td>Ganancia del pedido</td><td class="num ${r.total < 0 ? "neg" : ""}">${r.total < 0 ? "−" : ""}${money(Math.abs(r.total))}</td></tr></tbody></table>
            <p class="muted small">+${r.xp} XP${AYUDAS[S.ayuda].mult > 1 ? ` (incluye ×${AYUDAS[S.ayuda].mult} por nivel ${AYUDAS[S.ayuda].n})` : ""}.</p></div>`}
          ${arm && !run.libre ? `<div class="card"><h3>Lo que pidió el cliente</h3><ul class="reqlist">${reqStatus(o, b).map(q => `<li class="${q.ok ? "ok" : "no"}"><b>${q.ok ? "✓" : "✕"}</b>${esc(q.t)}</li>`).join("")}</ul>
            <p class="muted small">Gastaste ${money(r.gasto)} de ${money(o.presupuesto)}.</p></div>` : ""}
          ${bn ? `<div class="card"><h3>Prueba de rendimiento</h3>
            ${barra("Productividad", bn.productividad)}${barra("Juegos 1080p", bn.juegos)}${barra("Edición y render", bn.edicion)}
            <p class="muted small">Cada tarea depende de piezas distintas: oficina pide CPU y SSD; juegos piden GPU; edición pide RAM y CPU.</p></div>` : ""}
          ${r.penal.length ? `<div class="card"><h3>Qué restó estrellas</h3><ul class="penal">${r.penal.map(p => `<li><span>${esc(p.t)}</span><b>−${p.v % 1 ? p.v.toFixed(1) : p.v}</b></li>`).join("")}</ul></div>`
            : (run.libre ? "" : `<div class="card good"><h3>Trabajo impecable</h3><p>Sin errores ni pistas. Así se hace.</p></div>`)}
        </section>
        <aside class="col">
          ${mentorHTML(r.est >= 4.5 ? "Excelente trabajo. Ese equipo quedó como de fábrica." : r.est >= 3 ? "Buen trabajo. Revisa qué te restó estrellas y lo mejoras la próxima." : "No pasa nada: aquí es donde más se aprende. Repasa la lección y vuelve a intentarlo.")}
          ${c ? `<div class="card"><h3>Lo que practicaste</h3><p><b>${esc(c.titulo)}</b></p><ol class="rules">${c.reglas.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div>` : ""}
          ${c && !run.libre ? `<div class="card" id="quizCard"><h3>Pregunta de repaso</h3><p>${esc(c.q.q)}</p>
            <div class="opts-col" id="qOpts">${shuffle(c.q.opts.map((t, i) => ({ t, ok: i === c.q.correct }))).map((x, i) => `<button class="optbtn" data-ok="${x.ok ? 1 : 0}">${esc(x.t)}</button>`).join("")}</div>
            <div id="qfb"></div><p class="muted small">Acierta y ganas 20 XP y $200.</p></div>` : ""}
          <div class="row end">
            ${run.libre ? `<button class="btn" id="btnOtra">Armar otra PC</button><button class="btn primary" id="btnMenu">Volver al menú</button>` : `<button class="btn primary big" id="btnTaller">Volver al taller</button>`}
          </div>
        </aside>
      </div>
    </div>`;

  if ($("#btnTaller")) $("#btnTaller").addEventListener("click", () => { run = null; go("hub"); });
  if ($("#btnMenu")) $("#btnMenu").addEventListener("click", () => { run = null; go("menu"); });
  if ($("#btnOtra")) $("#btnOtra").addEventListener("click", () => { run = null; iniciarLibre(); });
  $$("#qOpts .optbtn").forEach(bt => bt.addEventListener("click", () => {
    if (run.quizHecho) return; run.quizHecho = true;
    const ok = bt.dataset.ok === "1";
    $$("#qOpts .optbtn").forEach(x => { x.disabled = true; if (x.dataset.ok === "1") x.classList.add("correct"); });
    if (!ok) bt.classList.add("wrong");
    S.stats.quiz++;
    let lv = null;
    if (ok) { S.stats.quizOk++; S.dinero += 200; lv = ganarXP(20); SFX.ok(); } else SFX.error();
    guardar(); renderBarra();
    $("#qfb").className = "fb " + (ok ? "ok" : "bad");
    $("#qfb").innerHTML = `<p>${ok ? "Correcto." : "No exactamente."} ${esc(c.q.fb)}</p>`;
    if (lv) mostrarSubidaNivel(lv);
  }));
  if (run.lvUp) { const lv = run.lvUp; run.lvUp = null; mostrarSubidaNivel(lv); }
}
PANTALLAS.result = renderResult;
