/* =====================================================================
   PC BUILDER ACADEMY · 00a · ARTE (BASE)
   ---------------------------------------------------------------------
   Todas las imágenes del juego son SVG dibujados por código. Así cambian
   según la pieza elegida (el largo de la GPU, el socket del CPU, DDR4 o
   DDR5...) y no hace falta ningún archivo de imagen.

   Este archivo tiene: ayudantes de dibujo, gradientes compartidos, la
   placa madre (Arte.placa) y el interior del gabinete (Arte.caso).
   Las piezas sueltas están en 00b-arte-piezas.js.

   Escala de la escena: el lienzo mide 760 × 600 y la placa 300 × 380.
   Las coordenadas de cada ranura salen de SLOTS (datos-juego.js).
   ===================================================================== */

const Arte = {};

(function () {
  /* ---------- ayudantes ---------- */
  const E = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const R = (x, y, w, h, fill, rx, ex) => `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ""} fill="${fill}"${ex ? " " + ex : ""}/>`;
  const C = (x, y, r, fill, ex) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"${ex ? " " + ex : ""}/>`;
  const P = (d, fill, ex) => `<path d="${d}" fill="${fill}"${ex ? " " + ex : ""}/>`;
  const L = (x1, y1, x2, y2, stroke, sw, ex) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${sw || 1}"${ex ? " " + ex : ""}/>`;
  const T = (x, y, txt, size, fill, ex) => `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-family="'Chakra Petch', system-ui, sans-serif" font-weight="600"${ex ? " " + ex : ""}>${E(txt)}</text>`;
  const G = (inner, tr, ex) => `<g${tr ? ` transform="${tr}"` : ""}${ex ? " " + ex : ""}>${inner}</g>`;
  const svg = (w, h, inner, cls, ex) => `<svg class="art${cls ? " " + cls : ""}" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" aria-hidden="true"${ex ? " " + ex : ""}>${inner}</svg>`;
  Arte.h = { E, R, C, P, L, T, G, svg };

  /* ---------- gradientes y patrones compartidos ---------- */
  const stops = a => a.map((c, i) => `<stop offset="${(i / (a.length - 1)).toFixed(2)}" stop-color="${c}"/>`).join("");
  const lg = (id, a, v) => `<linearGradient id="${id}" x1="0" y1="0" x2="${v ? 0 : 1}" y2="${v ? 1 : 0}">${stops(a)}</linearGradient>`;
  const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
    ${lg("ag-steel", ["#e3e8ef", "#a3adbb", "#6c7584"], 1)}${lg("ag-steelH", ["#e3e8ef", "#a3adbb", "#6c7584"])}
    ${lg("ag-alu", ["#d9dfe8", "#8e98a8", "#c6cdd8", "#7f899a"])}${lg("ag-aluV", ["#d9dfe8", "#8e98a8", "#c6cdd8", "#7f899a"], 1)}
    ${lg("ag-brass", ["#f4d98a", "#c99a33", "#8a6119"])}${lg("ag-gold", ["#fbe9a7", "#dcae3f", "#9c7418"], 1)}
    ${lg("ag-copper", ["#f4b88c", "#c76d3d", "#8a4320"], 1)}${lg("ag-copperH", ["#f4b88c", "#c76d3d", "#8a4320"])}
    ${lg("ag-black", ["#444a56", "#1c1f26", "#0f1115"], 1)}${lg("ag-blackH", ["#444a56", "#1c1f26", "#0f1115"])}
    ${lg("ag-pcbsheen", ["rgba(255,255,255,.07)", "rgba(255,255,255,0)", "rgba(0,0,0,.25)"], 1)}
    ${lg("ag-tray", ["#3a3f49", "#2a2e36", "#23262d"], 1)}${lg("ag-wall", ["#4a505c", "#353a44", "#2b2f37"])}
    ${lg("ag-glass", ["rgba(160,215,255,.35)", "rgba(160,215,255,.06)", "rgba(160,215,255,.22)"])}
    ${lg("ag-rubber", ["#2c2f36", "#15171b"], 1)}
    <radialGradient id="ag-paste" cx=".4" cy=".35" r=".7">${stops(["#fbfbfd", "#b7bcc6", "#7a808c"])}</radialGradient>
    <radialGradient id="ag-hub" cx=".4" cy=".35" r=".8">${stops(["#5a606c", "#23262d", "#101216"])}</radialGradient>
    <radialGradient id="ag-ball" cx=".35" cy=".3" r=".8">${stops(["#ffffff", "#c8ced8", "#7b8493"])}</radialGradient>
    <radialGradient id="ag-pump" cx=".4" cy=".3" r=".9">${stops(["#7a8294", "#3a404c", "#171a20"])}</radialGradient>
    <pattern id="ap-fins" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#8e98a8"/><rect width="1.2" height="3" fill="#4d5563"/></pattern>
    <pattern id="ap-finsH" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#9aa4b3"/><rect width="3" height="1.2" fill="#4d5563"/></pattern>
    <pattern id="ap-mesh" width="7" height="6" patternUnits="userSpaceOnUse"><rect width="7" height="6" fill="#23262d"/><path d="M0 3h3.5l1.7-3h1.8M3.5 3l1.7 3" stroke="#0b0c0f" stroke-width="1.6" fill="none"/></pattern>
    <pattern id="ap-perf" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#2d3139"/><circle cx="3" cy="3" r="1.7" fill="#101216"/></pattern>
    <pattern id="ap-gold" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#7a5c18"/><circle cx="1.5" cy="1.5" r="1" fill="#f1cd6a"/></pattern>
    <pattern id="ap-weave" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#15171b"/><path d="M0 0l4 4M4 0l-4 4" stroke="#2b2e35" stroke-width="1"/></pattern>
  </defs></svg>`;
  Arte.defs = DEFS;

  /* ---------- ventilador (se usa en el gabinete, GPU, radiador...) ---------- */
  /* Dibuja un ventilador visto de frente. cx,cy,r = centro y radio de las aspas. */
  const BLADE = "M0.2 0.02C0.3-0.26 0.7-0.36 0.97-0.14C0.9 0.12 0.62 0.3 0.32 0.27C0.24 0.2 0.2 0.11 0.2 0.02Z";
  Arte.ventilador = function (cx, cy, r, o) {
    o = o || {};
    const n = o.aspas || 9, col = o.color || "#2f343d", led = o.led;
    let s = "";
    s += C(cx, cy, r + 1.5, "#0c0d10");
    if (led) s += C(cx, cy, r, "none", `stroke="${led}" stroke-width="2.2" opacity=".85"`);
    for (let i = 0; i < n; i++) s += `<path d="${BLADE}" transform="translate(${cx} ${cy}) rotate(${(360 / n * i).toFixed(1)}) scale(${r})" fill="${col}" stroke="#14161b" stroke-width="${(0.9 / r).toFixed(3)}" opacity=".96"/>`;
    s += C(cx, cy, r * 0.27, "url(#ag-hub)", 'stroke="#0a0b0d" stroke-width=".8"');
    s += C(cx - r * 0.07, cy - r * 0.08, r * 0.1, "rgba(255,255,255,.25)");
    return s;
  };
  /* Ventilador de gabinete con marco cuadrado de w × h. */
  Arte.ventiladorMarco = function (w, h, o) {
    o = o || {};
    const r = Math.min(w, h) / 2 - 5;
    let s = R(0, 0, w, h, "url(#ag-black)", 5, 'stroke="#07080a" stroke-width="1.2"');
    [[6, 6], [w - 6, 6], [6, h - 6], [w - 6, h - 6]].forEach(p => { s += C(p[0], p[1], 2.4, "#050607"); });
    s += C(w / 2, h / 2, r + 2, "#06070a");
    s += Arte.ventilador(w / 2, h / 2, r, o);
    return s;
  };

  /* =====================================================================
     PLACA MADRE · 300 × 380 (+ panel de puertos traseros a la izquierda)
     ===================================================================== */
  const HUECOS = [[24, 46], [236, 38], [24, 222], [130, 216], [270, 252], [24, 372], [150, 372], [276, 372]];
  Arte.huecosPlaca = HUECOS;

  /* Socket vacío: LGA (Intel y AM5) con marco metálico, o PGA (AM4) con agujeros. */
  function socket(tipo) {
    let s = "";
    if (tipo === "AM4") {
      s += R(50, 60, 90, 90, "#1a1c21", 4, 'stroke="#0a0b0d" stroke-width="1.4"');
      s += R(54, 64, 82, 82, "#24272e", 2);
      s += `<g fill="#07080a">`;
      for (let i = 0; i < 17; i++) for (let j = 0; j < 17; j++) { if (i < 3 && j < 3) continue; s += `<circle cx="${60 + i * 4.3}" cy="${70 + j * 4.3}" r="1.15"/>`; }
      s += `</g>`;
      s += P("M56 66l9 0 0 9z", "url(#ag-gold)");
      s += R(138, 64, 4, 70, "url(#ag-steelH)", 2) + P("M142 134h-3v10h3z", "url(#ag-steel)") + C(140, 66, 3, "url(#ag-steel)");
    } else {
      s += R(50, 60, 90, 90, "#202329", 4, 'stroke="#0a0b0d" stroke-width="1.4"');
      s += R(56, 66, 78, 78, "url(#ag-steel)", 3, 'stroke="#59626f" stroke-width="1"');
      s += R(64, 74, 62, 62, "#15171b", 2);
      s += R(68, 78, 54, 54, "url(#ap-gold)", 1);
      s += R(56, 64, 78, 7, "rgba(255,255,255,.35)", 3);
      s += R(40, 70, 4, 76, "url(#ag-steelH)", 2) + C(42, 74, 3.2, "url(#ag-steel)") + P("M44 140h8v4h-8z", "url(#ag-steel)");
      s += T(66, 144, tipo, 5.5, "#3b434f");
    }
    return s;
  }

  /* Ranura de RAM: 4 posiciones x=170,194,218,242. */
  function dimm(x, ddr5, armor, acc) {
    const y = 60;
    let s = R(x, y, 20, 150, "#101216", 2, 'stroke="#050608" stroke-width="1"');
    s += R(x + 7.5, y + 5, 5, 140, "#2a2d34", 1);
    s += `<g fill="#b98b2a" opacity=".55">`; for (let i = 0; i < 28; i++) s += `<rect x="${x + 8.6}" y="${y + 8 + i * 4.9}" width="2.8" height="1.6"/>`; s += `</g>`;
    const nt = y + (ddr5 ? 87 : 72);
    s += R(x + 6, nt, 8, 3.5, "#6a707c", 1);
    s += R(x + 2, y - 3, 16, 9, ddr5 ? "#1c1f26" : "#e6e3d6", 2, 'stroke="#0a0b0d" stroke-width=".8"');
    if (ddr5) s += R(x + 4, y - 1, 12, 2, acc, 1);
    s += R(x + 2, y + 144, 16, 8, ddr5 ? "#1c1f26" : "#e6e3d6", 2, 'stroke="#0a0b0d" stroke-width=".8"');
    if (armor) s += R(x - 1, y, 1.8, 150, "url(#ag-steel)") + R(x + 19.2, y, 1.8, 150, "url(#ag-steel)");
    return s;
  }

  /* Cabezal de pines (2 filas). */
  function pines(x, y, cols, w, h, llave) {
    let s = R(x, y, w, h, "#1b1d22", 1.5, 'stroke="#08090b" stroke-width=".8"');
    for (let i = 0; i < cols; i++) for (let j = 0; j < 2; j++) {
      if (llave === i && j === 0) continue;
      s += R(x + 3 + i * ((w - 6) / cols), y + 4 + j * ((h - 8) / 1.15), 2.4, 2.4, "url(#ag-gold)");
    }
    return s;
  }

  Arte.placaInner = function (m, o) {
    o = o || {};
    m = m || { chip: "AMD B550", gama: "Medio", ram: "DDR4", socket: "AM4", slots: 4, ff: "ATX", pcie: "4.0" };
    const intel = /Intel/.test(m.chip), acc = intel ? "#4aa3ff" : "#ff6a3d";
    const tier = { "Básico": 0, "Medio": 1, "Alto": 2 }[m.gama] || 1;
    const ddr5 = m.ram === "DDR5", itx = m.ff === "ITX", matx = m.ff === "mATX";
    let s = "";
    /* panel de puertos traseros (fuera de la placa, a la izquierda) */
    if (!o.sinPuertos) s += puertos(m, acc);
    /* PCB */
    s += R(0, 0, 300, 380, "#161920", 5, 'stroke="#0a0b0e" stroke-width="2"') + R(0, 0, 300, 380, "url(#ag-pcbsheen)", 5);
    s += `<g stroke="#8fa3bd" stroke-opacity=".11" fill="none" stroke-width="1.1" stroke-linejoin="round">
      <path d="M50 150V176H170M60 150V168H160M70 150V160H150M142 70H168V196H248M142 82H162V190H236"/>
      <path d="M262 100V70H292M262 110V76H286M24 330H110V300H60M24 318H98V292H52M170 214V230H250V250"/>
      <path d="M210 330H282M210 340H270V322M150 316V280M160 316V284M170 316V288M14 200V240M20 200V236"/></g>`;
    /* sombras suaves de zonas */
    /* orificios de montaje */
    HUECOS.forEach(h => { s += C(h[0], h[1], 8.5, "#a8683c", 'opacity=".75"') + C(h[0], h[1], 5.6, "#0c0d10"); });
    /* VRM */
    if (tier === 0) {
      s += R(0, 52, 40, 128, "#101216", 3);
      for (let i = 0; i < 5; i++) s += L(2, 60 + i * 24, 38, 60 + i * 24, "#252932", 3);
      s += R(46, 36, 100, 18, "#101216", 2) + L(50, 42, 142, 42, "#252932", 2) + L(50, 48, 142, 48, "#252932", 2);
    } else {
      const big = tier === 2;
      s += R(5, 54, 36, 124, "url(#ap-fins)", 2.5, 'stroke="#3b424f" stroke-width="1"') + R(5, 54, 36, 124, "url(#ag-pcbsheen)", 2.5);
      s += R(44, 34, 104, 20, "url(#ap-fins)", 2.5, 'stroke="#3b424f" stroke-width="1"') + R(44, 34, 104, 20, "url(#ag-pcbsheen)", 2.5);
      if (big) {
        s += R(8, 86, 30, 60, "url(#ag-black)", 3, 'stroke="#050607" stroke-width="1"');
        s += R(8, 98, 30, 3, acc, 1) + R(8, 131, 30, 3, acc, 1) + T(12, 120, "ACADEMY", 5.2, "#c9d1de");
        s += R(70, 38, 60, 12, "url(#ag-black)", 2) + R(72, 43, 56, 2, acc, 1);
        s += P("M40 160h6v14h-6z", "#2a2e36");
      } else s += R(8, 64, 30, 6, "rgba(255,255,255,.3)", 2) + R(52, 36, 90, 4, "rgba(255,255,255,.28)", 2);
    }
    /* socket */
    s += socket(m.socket);
    /* RAM */
    const xs = itx ? [194, 242] : [170, 194, 218, 242];
    xs.forEach(x => { s += dimm(x, ddr5, tier > 0, acc); });
    /* M.2 */
    s += R(50, 181, 12, 20, "#14161b", 1.5, 'stroke="#07080a" stroke-width=".8"');
    s += `<g fill="url(#ag-gold)">`; for (let i = 0; i < 6; i++) s += `<rect x="${51.5 + i * 1.6}" y="184" width=".9" height="14"/>`; s += `</g>`;
    s += R(66, 183, 76, 16, "rgba(255,255,255,.035)", 2, 'stroke="rgba(255,255,255,.08)" stroke-width=".8"');
    s += C(148, 191, 5.5, "url(#ag-brass)", 'stroke="#6d4c12" stroke-width=".8"') + C(148, 191, 1.6, "#4e3a10");
    s += T(66, 179, "M.2", 5.5, "rgba(210,220,235,.55)");
    /* PCIe */
    const slot = (y, len, armor) => {
      let r = R(28, y, len, 14, "#0f1115", 2, 'stroke="#050607" stroke-width="1"');
      r += R(31, y + 4.5, len - 6, 5, "#272b33", 1);
      if (armor) r += R(25, y - 2, len + 6, 18, "none", 2, 'stroke="url(#ag-steel)" stroke-width="2.2"');
      r += R(28 + len - 6, y + 1.5, 6, 11, "#d9d6c8", 1.5);
      return r;
    };
    s += slot(258, 112, tier > 0 || m.pcie !== "3.0");
    if (!itx) {
      s += R(28, 298, 56, 10, "#0f1115", 2, 'stroke="#050607" stroke-width="1"') + R(31, 301, 50, 4, "#272b33", 1);
      if (!matx) s += slot(322, 70, false).replace(/#d9d6c8/, "#cfcdbd");
    }
    s += T(30, 252, `PCIe ${m.pcie} x16`, 5.5, "rgba(210,220,235,.55)");
    /* chipset */
    const cx = 150, cy = 316;
    if (tier === 0) s += R(cx, cy, 44, 34, "url(#ag-black)", 3) + R(cx + 6, cy + 8, 32, 3, "#252932", 1);
    else if (tier === 1) s += R(cx, cy, 54, 40, "url(#ap-fins)", 3, 'stroke="#3b424f" stroke-width="1"') + R(cx, cy, 54, 40, "url(#ag-pcbsheen)", 3);
    else s += R(cx - 4, cy - 4, 64, 50, "url(#ag-black)", 4, 'stroke="#050607" stroke-width="1"') + R(cx - 4, cy + 14, 64, 3, acc, 1) + T(cx + 4, cy + 36, m.chip.replace(/^(AMD|Intel) /, ""), 9, "#c9d1de");
    /* SATA */
    s += `<g>`;
    [[214, 302], [250, 302], [214, 314], [250, 314]].forEach(p => { s += R(p[0], p[1], 34, 10, "#0f1115", 1.5, 'stroke="#050607" stroke-width=".8"') + R(p[0] + 4, p[1] + 3, 22, 4, "#1d2027") + R(p[0] + 2, p[1] + 2, 4, 6, "#2b2f37"); });
    s += `</g>`;
    /* conectores de energía */
    s += R(268, 100, 24, 130, "#17191e", 2, 'stroke="#07080a" stroke-width="1"');
    for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) s += R(272.5 + j * 9.5, 104.5 + i * 10.4, 6, 7, "#050607", 1) + R(274.7 + j * 9.5, 106.5 + i * 10.4, 1.6, 3, "url(#ag-gold)");
    s += R(290, 106, 4, 118, "#2b2e36", 1);
    s += R(14, 10, 86, 22, "#17191e", 2, 'stroke="#07080a" stroke-width="1"');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) s += R(20 + i * 18.4, 14 + j * 9.5, 12, 7, "#050607", 1) + R(24.5 + i * 18.4, 16.5 + j * 9.5, 3, 2.4, "url(#ag-gold)");
    s += R(150, 18, 44, 14, "#e8e5d8", 2, 'stroke="#9a978a" stroke-width=".8"') + R(150, 18, 44, 3.5, "rgba(255,255,255,.7)", 2);
    for (let i = 0; i < 4; i++) s += R(156 + i * 9.4, 22.5, 2.3, 7, "url(#ag-gold)");
    s += T(150, 14, "CPU_FAN", 5.2, "rgba(210,220,235,.6)") + T(18, 8, "EATX12V", 5.2, "rgba(210,220,235,.6)") + T(238, 98, "ATX_PWR", 5.2, "rgba(210,220,235,.6)");
    /* cabezales de panel frontal, USB y audio */
    s += pines(10, 340, 5, 50, 26, 4) + pines(66, 340, 2, 40, 26) + pines(110, 340, 2, 40, 26) + pines(154, 340, 2, 40, 26) + pines(198, 340, 2, 40, 26) + pines(244, 340, 5, 46, 26, 4);
    [["AAFP", 14], ["PWR", 72], ["RST", 116], ["HDD", 160], ["PLED", 202], ["USB3", 250]].forEach(l => { s += T(l[1], 337, l[0], 5, "rgba(210,220,235,.55)"); });
    /* componentes sueltos: condensadores de audio, batería, chokes */
    [[16, 316], [32, 316], [48, 316]].forEach((p, i) => { s += C(p[0], p[1], 5.5, i === 2 ? "#1a1c21" : "url(#ag-gold)", 'stroke="#0a0b0d" stroke-width=".8"') + C(p[0] - 1.5, p[1] - 1.5, 1.6, "rgba(255,255,255,.4)"); });
    s += C(236, 342, 11, "#15171b", 'stroke="#2a2e36" stroke-width="1"') + C(236, 342, 8.5, "url(#ag-ball)") + T(231, 345, "3V", 5, "#5a6270");
    s += `<g fill="#0a0b0e" stroke="#2a2e36" stroke-width=".6">`; [[22, 270], [34, 270], [46, 270], [22, 284], [34, 284], [46, 284]].forEach(p => { s += `<rect x="${p[0]}" y="${p[1]}" width="9" height="9" rx="1"/>`; }); s += `</g>`;
    /* serigrafía */
    s += T(210, 285, "ACADEMY", 7, "rgba(210,220,235,.4)") + T(210, 294, m.chip, 5.5, "rgba(210,220,235,.4)");
    /* tornillos (la placa ya está fijada con la misma acción) */
    if (!o.sinTornillos) HUECOS.forEach(h => { s += C(h[0], h[1], 5.3, "url(#ag-steel)", 'stroke="#3a414c" stroke-width=".8"') + `<path d="M${h[0] - 3.2} ${h[1]}H${h[0] + 3.2}M${h[0]} ${h[1] - 3.2}V${h[1] + 3.2}" stroke="#4a525e" stroke-width="1.2"/>`; });
    return s;
  };
  Arte.placa = (m, o) => svg(300, 380, Arte.placaInner(m, o), "placa", 'style="overflow:visible"');

  /* Panel de puertos traseros: se dibuja a la izquierda de la placa (x negativo). */
  function puertos(m, acc) {
    const x0 = -102, y0 = 4;    // origen del panel (en coordenadas de la placa)
    let s = R(x0 + 2, y0 + 2, 90, 134, "url(#ag-steel)", 3, 'stroke="#4f5865" stroke-width="1.2"');
    s += `<g stroke="#5a6472" stroke-width=".8" opacity=".6">${L(x0 + 4, y0 + 6, x0 + 4, y0 + 130, "#fff", 1)}</g>`;
    /* HDMI + DisplayPort (ranura video-mobo: abs 12,100 -> placa -98,10) */
    s += R(x0 + 12, y0 + 12, 36, 18, "url(#ag-steelH)", 2, 'stroke="#46505d" stroke-width="1"') + P(`M${x0 + 16} ${y0 + 16}h28l-3 10h-22z`, "#07080a") + R(x0 + 20, y0 + 22, 20, 2.5, "url(#ag-gold)");
    s += R(x0 + 54, y0 + 12, 30, 18, "url(#ag-steelH)", 2, 'stroke="#46505d" stroke-width="1"') + P(`M${x0 + 58} ${y0 + 16}h20v6l-3 4h-14z`, "#07080a") + R(x0 + 62, y0 + 22, 12, 2, "url(#ag-gold)");
    s += T(x0 + 16, y0 + 38, "HDMI", 5, "#363e49") + T(x0 + 58, y0 + 38, "DP", 5, "#363e49");
    /* USB 3 (azules) + USB 2 */
    [[0, "#2f6fe0"], [1, "#16181d"]].forEach(p => {
      const y = y0 + 46 + p[0] * 34;
      [x0 + 10, x0 + 50].forEach(x => { s += R(x, y, 34, 16, "url(#ag-steelH)", 2, 'stroke="#46505d" stroke-width="1"') + R(x + 3, y + 3, 28, 10, "#07080a", 1) + R(x + 5, y + 7.5, 24, 4, p[1], 1); });
    });
    /* Ethernet y audio */
    s += R(x0 + 8, y0 + 114, 34, 28, "url(#ag-steelH)", 2, 'stroke="#46505d" stroke-width="1"') + R(x0 + 12, y0 + 118, 26, 18, "#07080a", 1);
    for (let i = 0; i < 8; i++) s += R(x0 + 14.5 + i * 3, y0 + 130, 1.5, 4, "url(#ag-gold)");
    [["#43c06a", 0], ["#4aa3ff", 1], ["#ff7fb8", 2]].forEach(a => { s += C(x0 + 55 + (a[1] % 2) * 16, y0 + 122 + Math.floor(a[1] / 2) * 14, 5.2, a[0], 'stroke="#14161b" stroke-width="1.4"') + C(x0 + 55 + (a[1] % 2) * 16, y0 + 122 + Math.floor(a[1] / 2) * 14, 1.7, "#0a0b0d"); });
    return s;
  }

  /* =====================================================================
     GABINETE · lienzo 760 × 600 visto desde el lado abierto
     Atrás (izquierda) · frente (derecha) · fuente abajo.
     ===================================================================== */
  const PINTURA = {
    case_atx: { base: "#2b2d33", osc: "#1b1d21", ac: "#e4572e", malla: true, nombre: "TORRE ATX" },
    case_matx: { base: "#262d3a", osc: "#181d27", ac: "#4aa3ff", malla: true, nombre: "microATX" },
    case_itx: { base: "#2f2f33", osc: "#1d1d20", ac: "#d79a4e", malla: false, nombre: "SFF" },
    case_cube: { base: "#2f322c", osc: "#1c1f1a", ac: "#9be15d", malla: true, nombre: "CUBO mATX" },
    case_mesh: { base: "#23262b", osc: "#15171b", ac: "#2fd1c1", malla: true, nombre: "MALLA ATX" },
    case_big: { base: "#1f2024", osc: "#121316", ac: "#d9b24a", malla: true, nombre: "FULL TOWER" },
    case_htpc: { base: "#2c2c30", osc: "#1b1b1e", ac: "#8f9bb0", malla: false, nombre: "HTPC" },
    case_itx_air: { base: "#2a2c30", osc: "#18191c", ac: "#e0483a", malla: true, nombre: "SFF AIRE" }
  };
  Arte.pintura = PINTURA;
  Arte.caso = function (c) {
    const k = PINTURA[c && c.id] || PINTURA.case_atx;
    let s = "";
    s += R(0, 0, 760, 600, k.osc);
    /* pared trasera */
    s += R(0, 0, 102, 600, "url(#ag-wall)") + R(100, 0, 3, 600, "rgba(0,0,0,.45)") + R(0, 0, 3, 600, "rgba(255,255,255,.07)");
    /* ventilador trasero: abertura con rejilla */
    s += C(52, 50, 38, "#0b0c0f") + C(52, 50, 36, "url(#ap-perf)") + C(52, 50, 33, "none", 'stroke="#0b0c0f" stroke-width="1"');
    [[18, 16], [86, 16], [18, 84], [86, 84]].forEach(p => { s += C(p[0], p[1], 3, "#0a0b0d") + C(p[0], p[1], 1.4, "#555c68"); });
    s += `<g fill="none" stroke="#14161a" stroke-width="1.2">`; [12, 20, 28].forEach(r => { s += `<circle cx="52" cy="50" r="${r}"/>`; }); s += `</g>`;
    /* abertura del panel de puertos (la placa lo cubre al instalarse) */
    s += R(10, 96, 88, 130, "#07080a", 3, 'stroke="#5a6472" stroke-width="1.5"') + T(16, 160, "I/O", 10, "#2a2e36");
    /* tapas de las ranuras de expansión */
    for (let i = 0; i < 5; i++) {
      const y = 326 + i * 25;
      s += R(10, y, 86, 23, "url(#ag-steelH)", 1.5, 'stroke="#39404b" stroke-width="1"');
      s += `<g stroke="#232830" stroke-width="2.2">`; for (let j = 0; j < 4; j++) s += L(18, y + 5 + j * 4.3, 70, y + 5 + j * 4.3, "#232830", 2.2); s += `</g>`;
      s += C(86, y + 11.5, 3.4, "url(#ag-steel)", 'stroke="#2f353f" stroke-width=".8"');
    }
    /* hueco de la fuente (parte trasera) */
    s += R(10, 488, 88, 100, "#07080a", 4, 'stroke="#5a6472" stroke-width="1.5"');
    s += T(18, 540, "PSU", 9, "#2a2e36");
    /* bandeja de la placa */
    s += R(103, 0, 330, 488, "url(#ag-tray)");
    s += `<g opacity=".9"><rect x="110" y="90" width="300" height="380" rx="4" fill="#31353e" stroke="#4a505c" stroke-width="1.2"/></g>`;
    /* orificios para separadores, con la letra del formato */
    HUECOS.forEach(h => { const x = 110 + h[0], y = 90 + h[1]; s += C(x, y, 7, "#14161a", 'stroke="#575f6c" stroke-width="1.4"') + C(x, y, 3.3, "#07080a") + T(x + 9, y + 3, "A", 6, "#6f7886"); });
    /* recortes para pasar cables, con aro de goma */
    const ranura = (x, y, w, h) => R(x, y, w, h, "#07080a", Math.min(w, h) / 2.2, 'stroke="#14161a" stroke-width="3"') + R(x - 1, y - 1, w + 2, h + 2, "none", Math.min(w, h) / 2.2 + 1, 'stroke="#0d0e11" stroke-width="1.5"');
    s += ranura(156, 68, 150, 14) + ranura(418, 186, 14, 150) + ranura(418, 376, 14, 70) + ranura(110, 474, 290, 10);
    /* correas y anclajes */
    [[436, 160], [436, 350], [436, 452]].forEach(p => { s += R(p[0], p[1], 9, 5, "#14161a", 1.5, 'stroke="#3d434e" stroke-width=".8"'); });
    /* separación de la fuente */
    s += R(103, 476, 330, 12, "url(#ag-steel)", 0, 'opacity=".55"') + R(103, 486, 330, 3, "rgba(0,0,0,.6)");
    s += R(103, 489, 330, 111, "#14161a");
    [[124, 590], [390, 590]].forEach(p => { s += R(p[0] - 14, p[1] - 4, 28, 8, "url(#ag-rubber)", 3); });
    s += T(114, 598, "ENTRADA DE AIRE · FILTRO", 5.5, "#3a404b");
    /* jaula de discos (derecha) */
    s += R(432, 88, 218, 176, "#1c1f25", 4, 'stroke="#3a414c" stroke-width="1.2"');
    s += R(440, 96, 202, 60, "#14161a", 2, 'stroke="#2f353f" stroke-width="1"');
    s += R(440, 166, 202, 90, "#14161a", 2, 'stroke="#2f353f" stroke-width="1"');
    s += `<g fill="#0a0b0d">`; [[448, 104], [632, 104], [448, 148], [632, 148], [448, 174], [632, 174], [448, 248], [632, 248]].forEach(p => { s += `<circle cx="${p[0]}" cy="${p[1]}" r="2.8"/>`; }); s += `</g>`;
    s += R(440, 160, 202, 4, k.ac, 1, 'opacity=".75"');
    s += T(446, 92, 'BAHÍA 2.5"', 5.5, "#4a515e") + T(446, 162, 'BAHÍA 3.5"', 5.5, "#4a515e");
    s += R(432, 262, 218, 22, "none") + R(432, 296, 218, 82, "rgba(0,0,0,.25)", 3, 'stroke="#2b3038" stroke-width="1" stroke-dasharray="5 4"') + T(446, 308, "PASACABLES", 5.5, "#4a515e");
    /* panel lateral guardado (arriba a la derecha) */
    s += R(436, 14, 210, 66, "none", 6, 'stroke="#3a414c" stroke-width="1" stroke-dasharray="6 5"');
    /* pared frontal con malla */
    s += R(654, 0, 106, 600, k.malla ? "url(#ap-mesh)" : "url(#ap-perf)") + R(652, 0, 3, 600, "rgba(0,0,0,.55)") + R(757, 0, 3, 600, "rgba(255,255,255,.06)");
    s += R(654, 560, 106, 4, k.ac, 0, 'opacity=".8"');
    /* abertura del ventilador frontal */
    s += R(660, 166, 88, 88, "#0b0c0f", 6, 'stroke="#3a414c" stroke-width="1.2"') + C(704, 210, 38, "url(#ap-mesh)") + C(704, 210, 38, "none", 'stroke="#0b0c0f" stroke-width="2"');
    [[668, 174], [740, 174], [668, 246], [740, 246]].forEach(p => { s += C(p[0], p[1], 2.6, "#07080a") + C(p[0], p[1], 1.2, "#555c68"); });
    /* USB frontales y botón (se aprecian arriba) */
    s += R(676, 22, 18, 9, "url(#ag-steelH)", 1.5) + R(678, 24, 14, 5, "#2f6fe0", 1) + R(702, 22, 18, 9, "url(#ag-steelH)", 1.5) + R(704, 24, 14, 5, "#2f6fe0", 1) + C(738, 26, 6, "url(#ag-black)", 'stroke="#4a515e" stroke-width="1"');
    s += T(660, 14, k.nombre, 6, "rgba(220,228,240,.35)");
    /* sombra interior */
    s += `<rect x="0" y="0" width="760" height="600" fill="none" stroke="#050607" stroke-width="6"/>`;
    return s;
  };
  /* Etiqueta dibujada: la usa renderBuild() */
  Arte.casoSVG = c => svg(760, 600, Arte.caso(c), "casoart", 'preserveAspectRatio="none" style="width:100%;height:100%"');

  /* Separadores de latón sobre la bandeja (paso 'standoffs'). */
  Arte.separadoresInner = function () {
    let s = "";
    HUECOS.forEach(h => {
      s += `<ellipse cx="${h[0] + 2}" cy="${h[1] + 3}" rx="8.5" ry="6" fill="rgba(0,0,0,.45)"/>`;
      s += P(`M${h[0] - 6.5} ${h[1]}l3.2-5.6h6.6l3.2 5.6l-3.2 5.6h-6.6z`, "url(#ag-brass)", 'stroke="#6b4a10" stroke-width=".9"');
      s += C(h[0], h[1], 2.6, "#4c360d") + C(h[0], h[1], 1.1, "#1a1205");
    });
    return s;
  };
  /* Se llama una vez al arrancar: coloca los gradientes compartidos en la página. */
  Arte.montar = function () { if (!document.getElementById("ag-steel")) document.body.insertAdjacentHTML("afterbegin", Arte.defs); };
})();
