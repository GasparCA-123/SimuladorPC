/* =====================================================================
   PC BUILDER ACADEMY · 01 · NÚCLEO
   ---------------------------------------------------------------------
   Estado global, guardado, utilidades, iconos, sonido, modales,
   navegación entre pantallas y economía (dinero, experiencia, niveles).

   IDEAS CLAVE
   · S   = la carrera guardada (dinero, experiencia, mejoras...). Se guarda
           en localStorage cada vez que cambia.
   · run = el pedido en curso (piezas elegidas, pasos instalados, errores).
           Se pierde si cierras la página: es solo de la sesión actual.
   · go('pantalla') cambia de pantalla; cada pantalla es una función
     renderXxx() que escribe HTML dentro de #app.
   ===================================================================== */

const SAVE_KEY = "pc-builder-academy-v1";

/* ---------- Estado ---------- */
function carreraNueva() {
  return {
    nombre: "Técnico", dinero: 1500, xp: 0, ratings: [], hechos: {}, vistos: {},
    mejoras: {}, ayuda: "live", sonido: true, dia: 1, tablero: [],
    stats: { armados: 0, reparados: 0, quiz: 0, quizOk: 0 }
  };
}
let S = carreraNueva();
let run = null;                 // pedido en curso (o null)
const ui = { screen: "menu", params: {} };

function cargar() {
  try {
    const j = localStorage.getItem(SAVE_KEY);
    if (j) { S = Object.assign(carreraNueva(), JSON.parse(j)); return true; }
  } catch (e) { /* sin almacenamiento: se juega igual */ }
  return false;
}
/* ---------- Integración con el proyecto «PC Builder · Simulador» ----------
   Si el juego se abre dentro del simulador (en un iframe), puede:
   · mandar al módulo de Teoría / Autoevaluación del simulador (irAlModulo),
   · avisarle su progreso para que aparezca en el panel del inicio (guardar).
   Si se abre solo, estas funciones no hacen nada. */
const EMBEBIDO = (() => { try { return window.parent !== window; } catch (e) { return true; } })();
function avisarPadre(msg) { if (EMBEBIDO) { try { window.parent.postMessage(msg, "*"); } catch (e) { /* nada */ } } }
function irAlModulo(mod) { avisarPadre({ pbIr: mod }); }

function guardar() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* nada */ }
  if (EMBEBIDO && typeof nivel === "function") {
    const n = nivel();
    avisarPadre({ pbAcademy: { nombre: S.nombre, nivel: n.n, titulo: n.t, xp: S.xp, dinero: S.dinero,
      armados: S.stats.armados, reparados: S.stats.reparados, quiz: S.stats.quiz, quizOk: S.stats.quizOk } });
  }
}
function hayGuardado() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function borrarGuardado() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* nada */ } }

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = n => "$" + Math.round(n).toLocaleString("es-MX");
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
function pick(a) { return a[(Math.random() * a.length) | 0]; }
function stars(n) { const f = Math.floor(n), h = n - f >= 0.5; return "★".repeat(f) + (h ? "⯨" : "") + "☆".repeat(5 - f - (h ? 1 : 0)); }

/* ---------- Niveles y experiencia ---------- */
function nivelDe(xp) { let n = NIVELES[0]; NIVELES.forEach(l => { if (xp >= l.xp) n = l; }); return n; }
function nivel() { return nivelDe(S.xp); }
function siguienteNivel() { return NIVELES.find(l => l.n === nivel().n + 1) || null; }
function reputacion() {
  if (!S.ratings.length) return 0;
  const r = S.ratings.slice(-10); return r.reduce((a, b) => a + b, 0) / r.length;
}
/* Suma XP y devuelve el nivel nuevo si subió (o null). */
function ganarXP(n) {
  const antes = nivel().n; S.xp += Math.round(n); guardar();
  const ahora = nivel();
  return ahora.n > antes ? ahora : null;
}
function desbloqueos(n) {
  const piezas = [];
  CATS.forEach(c => { if (c.k === "sto2") return; (PRODUCTOS[c.k] || []).forEach(p => { if (p.lvl === n) piezas.push(p.n); }); });
  const pedidos = PEDIDOS.filter(p => p.lvl === n).map(p => p.titulo);
  return { piezas, pedidos };
}

/* ---------- Catálogo: acceso ---------- */
function productosDe(cat) { return PRODUCTOS[cat] || []; }
function buscarProducto(id) {
  for (const k in PRODUCTOS) { const p = PRODUCTOS[k].find(x => x.id === id); if (p) return p; }
  return null;
}
function precioBuild(b) {
  return ["case", "mobo", "cpu", "ram", "cooler", "gpu", "sto1", "sto2", "psu"].reduce((t, k) => t + (b[k] ? b[k].p : 0), 0);
}
function catInfo(k) { return CATS.find(c => c.k === k); }

/* ---------- Iconos (SVG de 48×48, trazo con currentColor) ---------- */
const cableIco = t => `<path d="M5 34c9 0 8-20 19-20s10 20 19 20"/><rect x="3" y="30" width="9" height="9" rx="1.5"/><rect x="36" y="30" width="9" height="9" rx="1.5"/><text x="24" y="44" text-anchor="middle" font-size="8" font-weight="700" fill="currentColor" stroke="none">${t}</text>`;
const ICONS = {
  case: '<rect x="10" y="4" width="28" height="40" rx="3"/><rect x="14" y="9" width="14" height="22" rx="1"/><circle cx="33" cy="36" r="2"/><path d="M14 38h12"/>',
  mobo: '<rect x="6" y="6" width="36" height="36" rx="2"/><rect x="12" y="12" width="9" height="9"/><path d="M28 12v14M32 12v14M36 12v14"/><path d="M12 30h20v5H12z"/>',
  cpu: '<rect x="12" y="12" width="24" height="24" rx="2"/><rect x="18" y="18" width="12" height="12"/><path d="M18 6v6M24 6v6M30 6v6M18 36v6M24 36v6M30 36v6M6 18h6M6 24h6M6 30h6M36 18h6M36 24h6M36 30h6"/>',
  ram: '<rect x="4" y="14" width="40" height="18" rx="2"/><path d="M9 18h6v10H9zM19 18h6v10h-6zM29 18h6v10h-6z"/><path d="M8 32v5M14 32v5M20 32v5M28 32v5M34 32v5M40 32v5"/>',
  cooler: '<rect x="8" y="8" width="32" height="32" rx="3"/><circle cx="24" cy="24" r="9"/><circle cx="24" cy="24" r="2"/><path d="M24 15c4 0 5 4 2 7M33 24c0 4-4 5-7 2M24 33c-4 0-5-4-2-7M15 24c0-4 4-5 7-2"/>',
  aio: '<rect x="5" y="26" width="16" height="16" rx="2"/><circle cx="13" cy="34" r="4"/><rect x="27" y="6" width="16" height="36" rx="2"/><path d="M21 30h6M21 38h6M31 12h8M31 18h8M31 24h8M31 30h8"/>',
  gpu: '<rect x="3" y="12" width="40" height="22" rx="2"/><circle cx="16" cy="23" r="6"/><circle cx="32" cy="23" r="6"/><path d="M6 34v5h18v-5M44 15v14"/>',
  ssd: '<rect x="8" y="8" width="32" height="32" rx="3"/><path d="M14 14h20M14 34h8"/><circle cx="33" cy="33" r="2"/>',
  m2: '<rect x="4" y="16" width="40" height="16" rx="2"/><path d="M4 20v8M12 20h6v8h-6zM22 20h8v8h-8z"/>',
  hdd: '<rect x="8" y="6" width="32" height="36" rx="3"/><circle cx="24" cy="22" r="9"/><circle cx="24" cy="22" r="2"/><path d="M24 22l7-5M14 36h20"/>',
  psu: '<rect x="6" y="10" width="36" height="28" rx="3"/><circle cx="19" cy="24" r="8"/><path d="M19 18v12M13 24h12M33 16h5M33 22h5M33 28h5"/>',
  fan: '<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="3"/><path d="M24 21c0-8 7-9 9-5M27 24c8 0 9 7 5 9M24 27c0 8-7 9-9 5M21 24c-8 0-9-7-5-9"/>',
  standoffs: '<circle cx="14" cy="14" r="5"/><circle cx="34" cy="14" r="5"/><circle cx="14" cy="34" r="5"/><circle cx="34" cy="34" r="5"/><circle cx="14" cy="14" r="1.5"/><circle cx="34" cy="14" r="1.5"/><circle cx="14" cy="34" r="1.5"/><circle cx="34" cy="34" r="1.5"/>',
  paste: '<path d="M18 6h12v8H18zM16 14h16l-2 22H18z"/><path d="M24 36v6"/>',
  "cable-fan": cableIco("FAN"), "cable-eps": cableIco("EPS"), "cable-atx": cableIco("ATX"),
  "cable-pcie": cableIco("PCIe"), "cable-sata-data": cableIco("DATA"), "cable-sata-power": cableIco("SATA"),
  "fp-pin": '<rect x="8" y="14" width="32" height="20" rx="2"/><path d="M14 20v8M21 20v8M28 20v8M35 20v8"/>',
  usbf: '<rect x="10" y="12" width="28" height="24" rx="3"/><path d="M16 20h6v8h-6zM26 20h6v8h-6z"/>',
  audiof: '<path d="M10 28v-4a14 14 0 0 1 28 0v4"/><rect x="8" y="26" width="7" height="12" rx="2"/><rect x="33" y="26" width="7" height="12" rx="2"/>',
  manage: '<path d="M8 12c10 0 10 10 20 10s6-10 12-10M8 24c10 0 10 10 20 10s6-10 12-10M8 36c10 0 10 8 20 8"/><rect x="21" y="6" width="5" height="36" rx="1.5"/>',
  sidepanel: '<rect x="8" y="4" width="32" height="40" rx="3"/><path d="M14 38L34 10M22 40L38 20" opacity=".55"/>',
  keyboard: '<rect x="3" y="14" width="42" height="22" rx="3"/><path d="M8 20h3M14 20h3M20 20h3M26 20h3M32 20h3M38 20h3M8 26h3M14 26h3M20 26h3M26 26h3M32 26h3M38 26h3M14 32h20"/>',
  mouse: '<rect x="13" y="6" width="22" height="36" rx="11"/><path d="M24 6v14M13 20h22"/>',
  monitor: '<rect x="4" y="8" width="40" height="26" rx="2"/><path d="M18 40h12M24 34v6"/>',
  lock: '<rect x="12" y="22" width="24" height="18" rx="3"/><path d="M17 22v-5a7 7 0 0 1 14 0v5"/>',
  bolt: '<path d="M26 4L10 26h12l-2 18 18-24H26z"/>',
  book: '<path d="M8 8h14a4 4 0 0 1 4 4v28a4 4 0 0 0-4-4H8zM40 8H26v32a4 4 0 0 1 4-4h10z"/>'
};
function icon(name, size = 28) {
  return `<svg class="ico" viewBox="0 0 48 48" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.cpu}</svg>`;
}

/* Tipo de pieza (components[].type del repo) → nombre de icono */
function iconoDeTipo(t) {
  const map = { standoffs: "standoffs", mobo: "mobo", cpu: "cpu", paste: "paste", cooler: "cooler", aio: "aio", ram: "ram", m2: "m2",
    psu: "psu", ssd: "ssd", hdd: "hdd", gpu: "gpu", fan: "fan", "cable-fan": "cable-fan", "cable-eps": "cable-eps", "cable-atx": "cable-atx",
    "cable-pcie": "cable-pcie", "cable-sata-data": "cable-sata-data", "cable-sata-power": "cable-sata-power", "fp-pin": "fp-pin",
    usbf: "usbf", audiof: "audiof", manage: "manage", sidepanel: "sidepanel", keyboard: "keyboard", mouse: "mouse", monitor: "monitor" };
  return map[t] || "cpu";
}

/* ---------- Sonido (Web Audio, sin archivos) ---------- */
let _actx = null;
function actx() { if (!_actx) { const A = window.AudioContext || window.webkitAudioContext; if (A) { try { _actx = new A(); } catch (e) { /* nada */ } } } return _actx; }
["pointerdown", "keydown"].forEach(ev => window.addEventListener(ev, () => { const a = actx(); if (a && a.state === "suspended") a.resume(); }, { passive: true }));
function _noise(dur, type, freq, gain) {
  const a = actx(); if (!a || !S.sonido) return;
  const n = Math.max(1, (a.sampleRate * dur) | 0), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(); s.buffer = b;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = a.createGain(); g.gain.setValueAtTime(gain, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0008, a.currentTime + dur);
  s.connect(f); f.connect(g); g.connect(a.destination); s.start();
}
function _blip(freq, dur, type, gain) {
  const a = actx(); if (!a || !S.sonido) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type || "square"; o.frequency.value = freq;
  g.gain.setValueAtTime(gain || 0.1, a.currentTime); g.gain.exponentialRampToValueAtTime(0.0008, a.currentTime + dur);
  o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + dur + 0.02);
}
const SFX = {
  click() { _noise(0.05, "highpass", 2600, 0.2); _blip(1900, 0.04, "square", 0.04); },
  plug()  { _noise(0.10, "lowpass", 650, 0.24); _blip(150, 0.09, "sine", 0.1); },
  screw() { for (let i = 0; i < 4; i++) setTimeout(() => _noise(0.03, "bandpass", 1500, 0.16), i * 70); },
  error() { _blip(220, 0.18, "sawtooth", 0.12); },
  buy()   { _blip(880, 0.07, "triangle", 0.1); setTimeout(() => _blip(1320, 0.1, "triangle", 0.1), 70); },
  ok()    { _blip(660, 0.09, "triangle", 0.1); setTimeout(() => _blip(990, 0.14, "triangle", 0.1), 90); },
  beep()  { _blip(1000, 0.18, "square", 0.07); },
  longbeep() { _blip(800, 0.55, "square", 0.07); },
  power() {
    _blip(320, 0.12, "sawtooth", 0.09); setTimeout(() => _blip(520, 0.12, "sawtooth", 0.09), 90);
    setTimeout(() => _blip(780, 0.18, "triangle", 0.1), 180); setTimeout(() => _blip(1040, 0.5, "sine", 0.09), 300);
    setTimeout(() => _noise(1.0, "lowpass", 1000, 0.07), 120);
  },
  levelup() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => _blip(f, 0.18, "triangle", 0.1), i * 110)); }
};
function sfxDeInstalacion(step) {
  const t = step.type;
  if (t === "fp-pin" || t === "manage" || String(t).indexOf("cable") === 0) SFX.plug();
  else if (t === "psu" || t === "sidepanel" || t === "mobo" || t === "gpu") SFX.screw();
  else SFX.click();
}

/* ---------- Avisos, modales y mentor ---------- */
let _toastT = null;
function toast(msg, tipo) {
  const t = $("#toast"); if (!t) return;
  t.textContent = msg; t.className = "toast show " + (tipo || "");
  clearTimeout(_toastT); _toastT = setTimeout(() => t.classList.remove("show"), 3000);
}
let _modalCierre = null;
function abrirModal(html, opts = {}) {
  cerrarModal();
  const root = $("#modalRoot");
  root.innerHTML = `<div class="modal-back" id="modalBack"><div class="modal ${opts.ancho ? "wide" : ""}" role="dialog" aria-modal="true">${html}</div></div>`;
  _modalCierre = opts.alCerrar || null;
  if (!opts.fijo) $("#modalBack").addEventListener("pointerdown", e => { if (e.target.id === "modalBack") cerrarModal(); });
  $$("[data-cerrar]", root).forEach(b => b.addEventListener("click", () => cerrarModal()));
  const primero = $("button.primary, button", root); if (primero) primero.focus({ preventScroll: true });
}
function cerrarModal() {
  const root = $("#modalRoot"); if (!root || !root.innerHTML) return;
  root.innerHTML = ""; const f = _modalCierre; _modalCierre = null; if (f) f();
}
document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarModal(); });

/* El mentor es un panel con un avatar y un texto que cada pantalla actualiza. */
function mentorHTML(texto) {
  return `<div class="mentor"><div class="mentor-av" aria-hidden="true">🧑‍🔧</div><div class="mentor-box"><b>Ing. Tuerca</b><p id="mentorTx">${texto || ""}</p></div></div>`;
}
function decir(texto) {
  const t = $("#mentorTx"); if (!t) return;
  t.innerHTML = texto; const m = t.closest(".mentor"); if (m) { m.classList.remove("talk"); void m.offsetWidth; m.classList.add("talk"); }
}

/* ---------- Navegación ---------- */
const PANTALLAS = {};   // se llena en los demás archivos: PANTALLAS.hub = renderHub ...
function go(pantalla, params) {
  ui.screen = pantalla; ui.params = params || {};
  window.scrollTo(0, 0);
  renderBarra();
  const f = PANTALLAS[pantalla];
  if (!f) { $("#app").innerHTML = `<p>Pantalla no encontrada: ${esc(pantalla)}</p>`; return; }
  f(ui.params);
}
const PANTALLAS_PEDIDO = ["brief", "lesson", "shop", "build", "post", "result"];
function enPedido() { return !!run && PANTALLAS_PEDIDO.includes(ui.screen) && ui.screen !== "result"; }
/* Cambiar de pantalla desde la barra: si hay un pedido a medias, pide confirmación. */
function navegar(destino) {
  if (enPedido() && ui.screen !== "brief" && ui.screen !== "lesson") {
    abrirModal(`<h3>¿Salir del pedido?</h3><p>Perderás lo que llevas de este pedido. No se descuenta dinero ni estrellas.</p>
      <div class="row end"><button class="btn" data-cerrar>Seguir aquí</button><button class="btn danger" id="salirSi">Salir</button></div>`);
    $("#salirSi").addEventListener("click", () => { cerrarModal(); run = null; go(destino); });
    return;
  }
  run = null; go(destino);
}

function renderBarra() {
  const b = $("#bar"); if (!b) return;
  if (ui.screen === "menu") { b.hidden = true; return; }
  b.hidden = false;
  const n = nivel(), sig = siguienteNivel();
  const pct = sig ? Math.round((S.xp - n.xp) / (sig.xp - n.xp) * 100) : 100;
  const activo = k => (ui.screen === k ? ' aria-current="page"' : "");
  b.innerHTML = `
    <button class="brand" data-nav="hub" title="Ir al taller"><span class="brand-ico">${icon("cpu", 26)}</span><span>PC Builder <b>Academy</b></span></button>
    <div class="stats" aria-label="Estadísticas">
      <span class="chip money" title="Dinero">${money(S.dinero)}</span>
      <span class="chip lvl" title="${esc(n.t)}">Nv. ${n.n} · ${esc(n.t)}
        <span class="xpbar"><i style="width:${pct}%"></i></span></span>
      <span class="chip rep" title="Reputación: promedio de tus últimos pedidos">★ ${reputacion() ? reputacion().toFixed(1) : "—"}</span>
    </div>
    <nav class="topnav">
      <button data-nav="hub"${activo("hub")}>Taller</button>
      <button data-nav="lib"${activo("lib")}>Biblioteca</button>
      <button data-nav="quiz"${activo("quiz")}>Práctica</button>
      <button data-nav="mejoras"${activo("mejoras")}>Mejoras</button>
      ${EMBEBIDO ? `<button data-ext="modTeoria" title="Abrir el módulo de Teoría del simulador">Teoría</button><button data-ext="modQuiz" title="Abrir la Autoevaluación del simulador">Autoevaluación</button><button data-ext="home" title="Volver al inicio del simulador">Inicio</button>` : ""}
      <button id="btnSnd" class="icon-btn" title="Sonido" aria-label="Activar o silenciar sonido">${S.sonido ? "🔊" : "🔇"}</button>
    </nav>`;
  $$("[data-nav]", b).forEach(x => x.addEventListener("click", () => navegar(x.dataset.nav)));
  $$("[data-ext]", b).forEach(x => x.addEventListener("click", () => irAlModulo(x.dataset.ext)));
  $("#btnSnd", b).addEventListener("click", () => { S.sonido = !S.sonido; guardar(); renderBarra(); });
}

/* ---------- Subida de nivel ---------- */
function mostrarSubidaNivel(lv, despues) {
  const d = desbloqueos(lv.n);
  SFX.levelup();
  abrirModal(`<div class="levelup"><div class="big">⬆</div><h2>¡Nivel ${lv.n}!</h2><p class="muted">${esc(lv.t)}</p>
    ${d.piezas.length ? `<h4>Piezas nuevas en la tienda</h4><p>${d.piezas.map(esc).join(" · ")}</p>` : ""}
    ${d.pedidos.length ? `<h4>Pedidos nuevos</h4><p>${d.pedidos.map(esc).join(" · ")}</p>` : ""}
    <div class="row end"><button class="btn primary" data-cerrar>¡Vamos!</button></div></div>`, { alCerrar: despues });
}
