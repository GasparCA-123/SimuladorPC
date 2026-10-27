/* =====================================================================
   PC BUILDER ACADEMY · 06 · ENCENDIDO (POST) Y DIAGNÓSTICO
   ---------------------------------------------------------------------
   Al encender, la PC puede arrancar bien o mostrar una falla. Si falla:
     1. Se observan los síntomas (pantalla, pitidos, LED de la placa).
     2. El jugador deduce la CAUSA (opción múltiple).
     3. Elige el ARREGLO (opción múltiple).
     4. Se aplica: cambiar una pieza (vuelve a la tienda) o reconectar.
   Las reparaciones de clientes usan los casos del repo (CASES) y solo
   hacen los pasos 1-3. Es el mismo laboratorio de diagnóstico, integrado
   al juego.
   ===================================================================== */

function iniciarReparacion() {
  run.caso = CASES.find(c => c.id === run.order.caso);
  go("post");
}

function ledsDe(texto) {
  const t = String(texto || "").toUpperCase();
  const on = k => t.includes(k);
  return { cpu: on("CPU"), dram: on("DRAM"), vga: on("VGA"), boot: on("BOOT") };
}
function beepsDe(texto) {
  const t = String(texto || "").toLowerCase();
  if (t.includes("largo")) return [{ l: 1 }];
  const m = t.match(/(\d+)\s*(pitido|corto)/);
  if (t.includes("repetid")) return [{ l: 0 }, { l: 0 }, { l: 0 }];
  if (m) return Array.from({ length: Math.min(+m[1], 4) }, () => ({ l: 0 }));
  return [];
}
function sonarBeeps(texto) {
  beepsDe(texto).forEach((b, i) => setTimeout(() => (b.l ? SFX.longbeep() : SFX.beep()), i * 260));
}

function renderPost() {
  const rep = run.order.tipo === "reparacion";
  $("#app").innerHTML = `
    <div class="post">
      <header class="build-head">
        <div><p class="eyebrow">${run.libre ? "Modo libre" : esc(run.order.cliente) + " · " + esc(run.order.titulo)}</p><h1>${rep ? "Equipo en el banco de pruebas" : "Encendido y POST"}</h1></div>
      </header>
      <div class="post-grid">
        <section>
          <div class="monitor-wrap"><div class="monitor">
            <div class="screen" id="screen"><div class="pl dim">${rep ? "Equipo del cliente listo." : "PC ensamblada."} Pulsa «Encender» para ejecutar el POST.</div></div>
            <div class="leds" id="leds" aria-label="LEDs de diagnóstico de la placa">
              <span class="led" data-l="cpu"><i></i>CPU</span><span class="led" data-l="dram"><i></i>DRAM</span>
              <span class="led" data-l="vga"><i></i>VGA</span><span class="led" data-l="boot"><i></i>BOOT</span>
            </div>
          </div><div class="stand"><i class="neck"></i><i class="foot"></i></div></div>
          <div class="row">
            <button class="btn primary big" id="btnOn">⏻ Encender</button>
            ${!rep && !run.libre ? "" : ""}
          </div>
          <ul class="signals" id="signals" hidden></ul>
        </section>
        <aside id="diagBox">${mentorHTML(rep ? "Observa con calma los síntomas antes de decidir. Un pitido, un LED o un mensaje te dicen dónde buscar." : "El POST es el autodiagnóstico de la placa. Si algo está mal, lo verás en pantalla, en los LEDs o con pitidos.")}</aside>
      </div>
    </div>`;
  $("#btnOn").addEventListener("click", ejecutarPost);
}
PANTALLAS.post = renderPost;

function ejecutarPost() {
  const btn = $("#btnOn"); btn.disabled = true; btn.textContent = "Ejecutando POST…";
  SFX.power();
  const scr = $("#screen"); scr.className = "screen on"; scr.innerHTML = `<div class="pl bios">ACADEMY BIOS · Ver. 2.4.1 · ${run.build && run.build.cpu ? esc(run.build.cpu.n) : "CPU"}</div><div class="pl">Iniciando POST…</div>`;
  const lineas = ["Comprobando fuente de poder…", "Detectando CPU…", "Contando memoria RAM…", "Inicializando video…", "Buscando dispositivo de arranque…"];
  let i = 0;
  const t = setInterval(() => {
    scr.insertAdjacentHTML("beforeend", `<div class="pl">${lineas[i]}</div>`); i++;
    if (i >= lineas.length) { clearInterval(t); setTimeout(terminarPost, 450); }
  }, 380);
}

function casoComoDiag(c) {
  return { id: c.id, falla: c.falla, post: c.post, causa: c.causa, opcionesCausa: c.opcionesCausa, fix: c.fix, opcionesFix: c.opcionesFix, teoria: c.teoria, pista: PISTAS[c.id] || "" };
}

function terminarPost() {
  const rep = run.order.tipo === "reparacion";
  let d = null, sano = false;
  if (rep) { d = casoComoDiag(run.caso); sano = run.caso.id === "ok"; }
  else {
    const fallas = detectFaults(run.build, run.placedAt);
    if (!fallas.length) sano = true;
    else { const f = fallas[0]; d = FALLAS[f](run.build); d.id = f; run.postFails++; }
  }
  pintarPantallaPost(d, sano);
  if (sano && !rep) return postExitoso();
  iniciarDiagnostico(d);
}

function pintarPantallaPost(d, sano) {
  const scr = $("#screen"), p = d ? d.post : { pantalla: "arranque", beeps: "1 pitido corto", led: "ninguno" };
  const pant = String(p.pantalla).toLowerCase();
  let cont;
  if (sano) cont = `<div class="pl ok">POST correcto</div><div class="pl">Cargando sistema operativo…</div><div class="boot"><i></i></div>`;
  else if (pant.includes("sin señal")) cont = `<div class="nosig">SIN SEÑAL</div>`;
  else if (pant.includes("no bootable")) cont = `<div class="pl bad">No bootable device.</div><div class="pl">Insert boot disk and press any key…</div>`;
  else cont = `<div class="pl dim">▌</div>`;
  scr.className = "screen on" + (pant.includes("negra") || pant.includes("sin señal") ? " dark" : "");
  scr.innerHTML = cont;
  const l = ledsDe(p.led);
  $$("#leds .led").forEach(e => e.classList.toggle("on", !!l[e.dataset.l]));
  sonarBeeps(p.beeps);
  const s = $("#signals"); s.hidden = false;
  s.innerHTML = `<li><b>Pantalla</b>${esc(p.pantalla)}</li><li><b>Pitidos</b>${esc(p.beeps)}</li><li><b>LED de la placa</b>${esc(p.led)}</li>`;
  if (sano) { const led = $("#leds .led[data-l=boot]"); if (led) led.classList.add("good"); }
}

/* ---------- PC armada correctamente ---------- */
function postExitoso() {
  SFX.ok();
  $("#diagBox").innerHTML = `${mentorHTML("¡Arrancó! Un pitido corto: el POST fue correcto. Ahora mide el rendimiento y entrégasela al cliente.")}
    <div class="card good"><h3>POST correcto</h3><p>La fuente, el CPU, la RAM, el video y el almacenamiento respondieron. El sistema carga con normalidad.</p>
    <button class="btn primary big" id="btnEntregar">${run.libre ? "Ver el resultado" : "Entregar la PC"}</button></div>`;
  $("#btnEntregar").addEventListener("click", () => go("result"));
}

/* ---------- Diagnóstico ---------- */
function iniciarDiagnostico(d) {
  const box = $("#diagBox");
  box.innerHTML = `${mentorHTML(run.order.tipo === "reparacion" ? "Con estos síntomas, ¿qué pudo pasar? Piensa en qué revisa el POST y en qué orden." : "Algo falló. Tú armaste este equipo: piensa qué decisión pudo causarlo.")}
    <div class="card"><h3>${esc(d.falla)}</h3>
      <p class="muted small">Observa pantalla, pitidos y LED. Cuando estés listo, responde.</p>
      <div class="row"><button class="btn" id="btnPista">Inspeccionar (pista)</button></div>
      <p class="hint" id="pistaTx" hidden></p></div>
    <div class="card" id="qBox"></div>`;
  $("#btnPista").addEventListener("click", () => {
    const gratis = !!S.mejoras.lamp, usada = !$("#pistaTx").hidden;
    if (!usada && !gratis) { run.hints++; toast("Pista usada: resta un poco a tu reseña.", "bad"); }
    $("#pistaTx").hidden = false; $("#pistaTx").textContent = d.pista || "Sin pista disponible.";
  });
  preguntaDiag(d, "causa");
}

function preguntaDiag(d, paso) {
  const q = $("#qBox"), esCausa = paso === "causa";
  const ops = shuffle((esCausa ? d.opcionesCausa : d.opcionesFix).map((t, i) => ({ t, ok: i === 0 })));
  q.innerHTML = `<h3>${esCausa ? "Paso 1 · ¿Cuál es la causa?" : "Paso 2 · ¿Cómo se arregla?"}</h3>
    <p class="muted small">${esCausa ? "Según los síntomas, elige la explicación más probable." : "Ya conoces la causa. Elige la acción correcta."}</p>
    <div class="opts-col">${ops.map((o, i) => `<button class="optbtn" data-i="${i}">${esc(o.t)}</button>`).join("")}</div><div id="fb"></div>`;
  $$(".optbtn", q).forEach(b => b.addEventListener("click", () => {
    const o = ops[+b.dataset.i];
    $$(".optbtn", q).forEach((x, i) => { x.disabled = true; if (ops[i].ok) x.classList.add("correct"); });
    if (!o.ok) { b.classList.add("wrong"); run.wrongDiag++; SFX.error(); } else SFX.ok();
    const fb = $("#fb", q);
    fb.className = "fb " + (o.ok ? "ok" : "bad");
    fb.innerHTML = `<p>${o.ok ? "Correcto." : "No es lo más probable."} ${esc(esCausa ? d.causa : d.fix)}</p><button class="btn primary" id="sigDiag">Continuar</button>`;
    $("#sigDiag").addEventListener("click", () => { if (esCausa) preguntaDiag(d, "fix"); else cerrarDiagnostico(d); });
  }));
}

function cerrarDiagnostico(d) {
  const q = $("#qBox"), rep = run.order.tipo === "reparacion";
  q.innerHTML = `<h3>¿Por qué ocurre?</h3><p class="clave-box">${esc(d.teoria)}</p>
    <p><b>Causa:</b> ${esc(d.causa)}<br><b>Solución:</b> ${esc(d.fix)}</p>
    <button class="btn primary big" id="btnAplicar">${rep ? "Entregar el equipo" : (d.accion && d.accion.replug ? "Reconectar el monitor" : "Ir a cambiar la pieza")}</button>`;
  $("#btnAplicar").addEventListener("click", () => {
    if (rep) { go("result"); return; }
    aplicarArreglo(d);
  });
}

function aplicarArreglo(d) {
  const a = d.accion;
  if (a.replug) {
    run.placedAt.monitor = "video-gpu"; SFX.plug(); toast("Reconectas el monitor a la salida de la GPU.", "ok");
    go("post", { reintento: true }); return;
  }
  abrirTiendaFix({ cats: [a.cat], motivo: d.falla + ".", volver: "post", unplace: a.unplace || [] });
}
