/* =====================================================================
   PC BUILDER ACADEMY · 00b · ARTE (PIEZAS)
   ---------------------------------------------------------------------
   Cada pieza se dibuja de dos maneras:
     · Arte.escena(tipo, w, h, producto)  → cómo se ve YA INSTALADA dentro
       del gabinete (vista lateral, con el panel abierto).
     · Arte.foto(tipo, producto)          → "foto de producto" para la tienda,
       la bandeja de piezas y las fichas.
   El producto (p) trae los datos reales: socket, DDR4/DDR5, largo de la
   GPU, torre o líquida, capacidad... y el dibujo cambia con ellos.
   ===================================================================== */

(function () {
  const { E, R, C, P, L, T, G, svg } = Arte.h;
  const ESC = {};      // tipo → función(w, h, p, o) que devuelve el interior del SVG
  const FOTO = {};     // tipo → función(p) que devuelve el interior de un SVG 160 × 100

  const cap = p => p && p.gb ? (p.gb >= 1000 ? (p.gb / 1000) + " TB" : p.gb + " GB") : "";
  const sombra = (x, y, w, h, rx) => R(x + 2, y + 4, w, h, "rgba(0,0,0,.4)", rx || 3);

  /* ---------- CPU ---------- */
  ESC.cpu = function (w, h, p, o) {
    p = p || { socket: "AM4", n: "Ryzen 5 5600", cores: "6 / 12" };
    o = o || {};
    const am4 = p.socket === "AM4", intel = p.socket === "LGA1700";
    const partes = p.n.replace(/^(Core |Ryzen |Athlon )/, m => m).split(" ");
    const marca = intel ? "intel" : "RYZEN";
    let s = "";
    if (am4) {
      s += sombra(4, 4, 82, 82, 4);
      s += R(4, 4, 82, 82, "#2e6b4d", 3, 'stroke="#173a29" stroke-width="1"');
      s += R(10, 10, 70, 70, "url(#ag-alu)", 5, 'stroke="#5d6674" stroke-width="1"');
      s += R(10, 10, 70, 70, "none", 5, 'stroke="rgba(255,255,255,.5)" stroke-width="1" transform="translate(.5 .5)"');
      s += P("M6 6l11 0 0 11z", "url(#ag-gold)", 'opacity=".95"');
      s += T(18, 36, "AMD", 8, "#3d4552") + T(18, 50, p.n.replace(/^AMD /, "").toUpperCase(), p.n.length > 12 ? 6 : 7.5, "#3d4552");
      s += T(18, 62, "AM4 · " + p.cores.replace(" / ", "C/") + "T", 5.5, "#4a5362") + T(18, 72, "MADE IN TAIWAN", 4, "#59626f");
    } else {
      if (!o.solo) {
        /* marco de sujeción cerrado */
        s += R(0, 0, 90, 90, "url(#ag-steel)", 4, 'stroke="#59626f" stroke-width="1"');
        s += R(8, 8, 74, 74, "#14161a", 2);
        s += R(6, 4, 78, 6, "rgba(255,255,255,.35)", 3);
        s += C(8, 8, 2, "#59626f") + C(82, 82, 2, "#59626f");
      }
      const ox = o.solo ? 10 : 12, oy = o.solo ? 10 : 12, ww = o.solo ? 70 : 66, hh = o.solo ? 70 : 66;
      s += R(ox, oy, ww, hh, "#3d6b4f", 2) ;
      s += R(ox + 4, oy + 4, ww - 8, hh - 8, "url(#ag-alu)", 3, 'stroke="#5d6674" stroke-width="1"');
      s += P(`M${ox + 4} ${oy + hh / 2 - 5}h5v10h-5z`, "#14161a", 'opacity=".5"');
      s += R(ox + 4, oy + 4, ww - 8, hh - 8, "none", 3, 'stroke="rgba(255,255,255,.5)" stroke-width="1" transform="translate(.5 .5)"');
      s += T(ox + 11, oy + 24, intel ? "intel®" : "AMD", 8, "#3d4552") + T(ox + 11, oy + 36, p.n.replace(/^(Core |AMD )/, "").toUpperCase(), 6.5, "#3d4552");
      s += T(ox + 11, oy + 48, p.socket + " · " + p.cores.replace(" / ", "C/") + "T", 5.5, "#4a5362") + T(ox + 11, oy + 58, "MALAYSIA", 4, "#59626f");
    }
    return s;
  };
  FOTO.cpu = p => G(ESC.cpu(90, 90, p, { solo: true }), "translate(35 5)");

  ESC.standoffs = () => Arte.separadoresInner();

  /* ---------- pasta térmica ---------- */
  ESC.paste = function () {
    return `<ellipse cx="24" cy="26" rx="19" ry="18" fill="rgba(0,0,0,.25)"/>` +
      P("M22 5C32 4 41 12 41 22C42 33 33 42 22 41C11 42 3 33 4 22C3 12 12 6 22 5Z", "url(#ag-paste)", 'stroke="#6a707b" stroke-width=".8"') +
      `<ellipse cx="16" cy="14" rx="7" ry="4" fill="rgba(255,255,255,.7)" transform="rotate(-25 16 14)"/>`;
  };
  FOTO.paste = () =>
    R(26, 38, 70, 18, "#eef0f4", 4, 'stroke="#aeb4bf" stroke-width="1"') + R(26, 38, 70, 5, "rgba(255,255,255,.9)", 4) + R(40, 38, 4, 18, "#d94b3a") +
    T(50, 51, "PASTA TÉRMICA", 6, "#4a5260") + R(14, 43, 12, 8, "url(#ag-steel)", 2) + R(96, 41, 14, 12, "#cfd4dc", 2) + P("M110 44h14l8 3-8 3h-14z", "url(#ag-steel)") +
    C(138, 47, 4, "url(#ag-paste)") + `<ellipse cx="86" cy="76" rx="22" ry="9" fill="url(#ag-paste)"/><ellipse cx="80" cy="73" rx="9" ry="3" fill="rgba(255,255,255,.7)"/>`;

  /* ---------- coolers ---------- */
  ESC.cooler = function (w, h, p) {
    p = p || { id: "f_stock" };
    let s = "", cx = w / 2, cy = h / 2;
    if (p.id === "f_stock" || p.id === "f_lowp") {
      const cobre = p.id === "f_lowp";
      s += `<ellipse cx="${cx + 3}" cy="${cy + 5}" rx="52" ry="50" fill="rgba(0,0,0,.4)"/>`;
      s += R(cx - 49, cy - 49, 98, 98, cobre ? "url(#ag-copper)" : "url(#ag-alu)", 10, 'stroke="#59626f" stroke-width="1.2"');
      s += C(cx, cy, 46, cobre ? "#b8764a" : "#8f99a8", 'stroke="#39414c" stroke-width="1"');
      for (let i = 0; i < 40; i++) { const a = i * 9 * Math.PI / 180; s += L(cx + Math.cos(a) * 36, cy + Math.sin(a) * 36, cx + Math.cos(a) * 46, cy + Math.sin(a) * 46, "#3d4552", 1.1); }
      s += Arte.ventilador(cx, cy, 35, { aspas: 11, color: "#262a31" });
      [[cx - 44, cy - 44], [cx + 44, cy - 44], [cx - 44, cy + 44], [cx + 44, cy + 44]].forEach(q => { s += C(q[0], q[1], 3.4, "#14161a") + C(q[0], q[1], 1.4, "#69717e"); });
    } else if (p.aio) {
      /* radiador arriba (se ve de canto) y tubos hasta la bomba */
      const rw = Math.round(246 * (p.rad || 240) / 240), nF = Math.max(1, Math.round((p.rad || 240) / 120));
      s += R(4, -126, rw, 36, "url(#ap-finsH)", 3, 'stroke="#394049" stroke-width="1"') + R(4, -126, rw, 6, "rgba(255,255,255,.3)", 3);
      s += R(4, -92, rw, 30, "url(#ag-black)", 4, 'stroke="#050607" stroke-width="1"');
      for (let i = 1; i < nF; i++) { const x = 4 + rw * i / nF; s += L(x, -90, x, -64, "#07080a", 2); }
      s += R(10, -78, rw - 14, 3, "#4aa3ff", 1, 'opacity=".85"');
      s += R(4, -120, 14, 56, "url(#ag-steel)", 3);
      s += `<path d="M44 20C44 -20 22 -40 24 -70" fill="none" stroke="#050607" stroke-width="13" stroke-linecap="round"/><path d="M44 20C44 -20 22 -40 24 -70" fill="none" stroke="url(#ap-weave)" stroke-width="10" stroke-linecap="round"/>`;
      s += `<path d="M76 18C80 -12 44 -36 36 -70" fill="none" stroke="#050607" stroke-width="13" stroke-linecap="round"/><path d="M76 18C80 -12 44 -36 36 -70" fill="none" stroke="url(#ap-weave)" stroke-width="10" stroke-linecap="round"/>`;
      s += `<ellipse cx="${cx + 3}" cy="${cy + 5}" rx="52" ry="50" fill="rgba(0,0,0,.4)"/>`;
      s += C(cx, cy, 52, "url(#ag-steel)", 'stroke="#3a414c" stroke-width="1.2"') + C(cx, cy, 47, "url(#ag-pump)");
      s += C(cx, cy, 36, "#07080b", 'stroke="#4aa3ff" stroke-width="2.4" opacity=".95"') + C(cx, cy, 31, "#0d0f14");
      s += `<path d="M${cx - 18} ${cy - 6}q18-18 36 0" stroke="rgba(255,255,255,.14)" stroke-width="6" fill="none" stroke-linecap="round"/>`;
      s += T(cx - 26, cy + 4, "ACADEMY", 8.5, "#d5dbe6") + T(cx - 17, cy + 15, "AIO " + (p.rad || 240), 6, "#7e8aa0");
    } else {
      const dual = p.id === "f_tower";
      if (!dual) {
        s += R(5, 5, 90, 112, "rgba(0,0,0,.35)", 6, 'transform="translate(3 4)"');
        s += R(5, 3, 90, 112, "url(#ag-alu)", 5, 'stroke="#59626f" stroke-width="1"');
        s += R(5, 3, 90, 112, "url(#ap-fins)", 5, 'opacity=".35"');
        [[28, 21], [28, 45], [28, 69], [28, 93]].forEach(q => { s += C(q[0] + 24, q[1] + 2, 6, "url(#ag-copper)", 'stroke="#7a3d1e" stroke-width=".8"'); });
        s += R(76, 8, 14, 102, "url(#ag-black)", 4) + T(84, 98, p.id === "f_mid" ? "ACADEMY MID" : "ACADEMY", 7, "#8794a8", 'transform="rotate(-90 84 98)"');
        if (p.id === "f_mid") s += R(5, 0, 90, 6, "url(#ag-alu)", 2) + R(5, 0, 90, 2, "rgba(255,255,255,.45)", 2);
        s += R(98, 7, 20, 104, "url(#ag-black)", 4, 'stroke="#050607" stroke-width="1"');
        for (let i = 0; i < 9; i++) s += L(104 + (i % 3) * 4, 12, 104 + (i % 3) * 4, 106, "#07080a", 1);
        s += R(98, 7, 20, 3, "rgba(255,255,255,.2)", 2);
        s += R(112, 14, 4, 2, "#69717e") + R(112, 98, 4, 2, "#69717e");
      } else {
        s += R(-8, 3, 140, 114, "rgba(0,0,0,.4)", 6, 'transform="translate(3 5)"');
        s += R(-10, 0, 44, 118, "url(#ag-alu)", 4, 'stroke="#59626f" stroke-width="1"') + R(-10, 0, 44, 118, "url(#ap-fins)", 4, 'opacity=".35"');
        s += R(36, 4, 22, 110, "url(#ag-black)", 4, 'stroke="#050607" stroke-width="1"');
        s += R(60, 0, 46, 118, "url(#ag-alu)", 4, 'stroke="#59626f" stroke-width="1"') + R(60, 0, 46, 118, "url(#ap-fins)", 4, 'opacity=".35"');
        s += R(108, 4, 22, 110, "url(#ag-black)", 4, 'stroke="#050607" stroke-width="1"');
        for (let i = 0; i < 6; i++) { s += C(2 + (i % 2) * 22, 20 + Math.floor(i / 2) * 36, 5.5, "url(#ag-copper)", 'stroke="#7a3d1e" stroke-width=".8"'); s += C(70 + (i % 2) * 22, 20 + Math.floor(i / 2) * 36, 5.5, "url(#ag-copper)", 'stroke="#7a3d1e" stroke-width=".8"'); }
        [[40, 8], [40, 100], [112, 8], [112, 100]].forEach(q => { s += R(q[0] + 4, q[1], 4, 2, "#69717e"); });
        s += T(-2, 110, "DUAL TOWER", 7, "#5b6575", 'transform="rotate(-90 -2 110)"');
        for (let i = 0; i < 8; i++) { s += L(42 + (i % 4) * 4, 10, 42 + (i % 4) * 4, 108, "#07080a", 1); s += L(114 + (i % 4) * 4, 10, 114 + (i % 4) * 4, 108, "#07080a", 1); }
      }
    }
    return s;
  };
  ESC.aio = ESC.cooler;
  FOTO.cooler = function (p) {
    p = p || { id: "f_stock" };
    if (p.id === "f_stock" || p.id === "f_lowp") return G(ESC.cooler(118, 118, p), "translate(20 -6) scale(.9)");
    if (p.aio) {
      const n = Math.max(1, Math.round((p.rad || 240) / 120)), W = [0, 76, 140, 150][Math.min(n, 3)], x0 = 80 - W / 2, r = n === 3 ? 11.5 : 15;
      let s = R(x0, 54, W, 34, "rgba(0,0,0,.35)", 4, 'transform="translate(3 4)"') + R(x0, 54, W, 34, "url(#ap-finsH)", 4, 'stroke="#394049" stroke-width="1"');
      for (let i = 0; i < n; i++) s += Arte.ventilador(x0 + W * (i + .5) / n, 71, r, { aspas: 9 });
      s += `<path d="M${x0 + 14} 36C${x0 + 4} 46 ${x0 + 2} 54 ${x0 + 2} 60M${x0 + 26} 36C${x0 + 22} 48 ${x0 + 16} 54 ${x0 + 14} 60" fill="none" stroke="#07080a" stroke-width="7" stroke-linecap="round"/>`;
      s += C(x0 + 24, 24, 20, "url(#ag-steel)", 'stroke="#3a414c" stroke-width="1"') + C(x0 + 24, 24, 17, "url(#ag-pump)") + C(x0 + 24, 24, 11, "#07080b", 'stroke="#4aa3ff" stroke-width="1.6"') + T(x0 + 13, 27, "AIO", 7, "#d5dbe6");
      return s;
    }
    const dual = p.id === "f_tower";
    let s = R(46, 90, 68, 6, "url(#ag-copperH)", 2);
    [58, 72, 86, 100].forEach(x => { s += R(x - 2, 38, 4, 54, "url(#ag-copper)", 2); });
    s += R(36, 8, 88, 40, "url(#ag-alu)", 3, 'stroke="#59626f" stroke-width="1"') + R(36, 8, 88, 40, "url(#ap-finsH)", 3, 'opacity=".5"');
    if (dual) s += R(24, 6, 112, 8, "url(#ag-alu)", 2) + R(24, 6, 112, 3, "rgba(255,255,255,.4)", 2);
    s += R(30, 30, 100, 62, "url(#ag-black)", 6, 'stroke="#050607" stroke-width="1"') + Arte.ventilador(80, 61, 26, { aspas: 11 });
    [[36, 36], [124, 36], [36, 86], [124, 86]].forEach(q => { s += C(q[0], q[1], 2.2, "#050607"); });
    return s;
  };
  FOTO.aio = FOTO.cooler;

  /* ---------- RAM ---------- */
  ESC.ram = function (w, h, p) {
    p = p || { type: "DDR4", mhz: 3200, gb: 8 };
    const d5 = p.type === "DDR5";
    let s = R(2, 0, 16, 150, "rgba(0,0,0,.4)", 2, 'transform="translate(1 1)"');
    s += R(2, 0, 16, 150, "url(#ag-blackH)", 2.5, 'stroke="#050607" stroke-width=".8"');
    s += R(2, 0, 16, 5, "rgba(255,255,255,.22)", 2);
    s += R(7.5, 12, 5, 118, d5 ? "#7a5cff" : "#aeb6c4", 2, d5 ? 'opacity=".95"' : 'opacity=".55"');
    if (d5) s += R(7.5, 12, 5, 118, "url(#ag-rgb)", 2);
    s += T(14.5, 138, `${p.type}-${p.mhz}`, 6, "#c8d0de", 'transform="rotate(-90 14.5 138)"');
    return s;
  };
  FOTO.ram = function (p) {
    p = p || { type: "DDR4", mhz: 3200, gb: 8, mods: 1 };
    const d5 = p.type === "DDR5";
    const mod = (x, y) => {
      let s = R(x + 2, y + 4, 136, 36, "rgba(0,0,0,.35)", 3);
      s += R(x, y + 26, 136, 14, "#1b4d3a", 1.5) + R(x, y + 33, 136, 7, "url(#ap-gold)") + R(x + 62, y + 33, 4, 7, "#0c0d10");
      s += R(x, y, 136, 31, "url(#ag-black)", 3, 'stroke="#050607" stroke-width="1"');
      s += R(x, y, 136, 4, "rgba(255,255,255,.2)", 3);
      s += R(x + 6, y + 12, 124, 5, d5 ? "url(#ag-rgbH)" : "#aeb6c4", 2.5, d5 ? "" : 'opacity=".6"');
      s += T(x + 10, y + 26, `${cap({ gb: p.gb / (p.mods || 1) })} ${p.type}-${p.mhz}`, 6.5, "#c8d0de");
      s += R(x - 3, y + 5, 3, 24, "url(#ag-steel)", 1) + R(x + 136, y + 5, 3, 24, "url(#ag-steel)", 1);
      return s;
    };
    return (p.mods || 1) > 1 ? mod(10, 14) + mod(14, 46) : mod(12, 30);
  };

  /* ---------- almacenamiento ---------- */
  ESC.m2 = function (w, h, p, o) {
    p = p || { gb: 500 };
    o = o || {};
    const frio = p.gb >= 2000;
    let s = R(1, 3, 108, 18, "rgba(0,0,0,.4)", 2, 'transform="translate(1 2)"');
    s += R(0, 2, 108, 18, "#12231d", 2, 'stroke="#050607" stroke-width=".8"');
    s += R(0, 3, 9, 16, "url(#ap-gold)") + R(7.4, 3, 1.6, 16, "#0c0d10");
    if (frio) {
      s += R(12, 3, 84, 16, "url(#ag-aluV)", 2.5, 'stroke="#59626f" stroke-width=".8"') + R(12, 3, 84, 16, "url(#ap-fins)", 2.5, 'opacity=".35"');
      s += T(20, 14, cap(p) + " NVMe", 7, "#2b323d");
    } else {
      s += R(14, 5, 22, 12, "#08090c", 1) + C(18, 8, 1.1, "#9aa4b3");
      s += R(40, 5, 22, 12, "#08090c", 1) + C(44, 8, 1.1, "#9aa4b3");
      s += R(66, 6, 14, 10, "#0f1013", 1) + C(70, 9, 1, "#9aa4b3");
      s += R(82, 4, 14, 14, "#cfd6e0", 1) + T(83, 13, cap(p), 4.6, "#2b323d");
    }
    s += C(101, 11, 4.2, "url(#ag-steel)", 'stroke="#3a414c" stroke-width=".8"') + `<path d="M98.6 11h4.8" stroke="#59626f" stroke-width="1"/>`;
    return s;
  };
  FOTO.m2 = function (p) { return G(ESC.m2(110, 22, p), "translate(6 28) scale(1.38)"); };

  ESC.ssd = function (w, h, p) {
    p = p || { gb: 512 };
    let s = R(12, 4, 90, 58, "rgba(0,0,0,.4)", 5);
    s += R(10, 2, 90, 56, "url(#ag-aluV)", 5, 'stroke="#59626f" stroke-width="1"');
    s += R(10, 2, 90, 5, "rgba(255,255,255,.4)", 4);
    s += R(18, 14, 66, 30, "#e8ecf2", 2) + R(18, 14, 4, 30, "#4aa3ff") + T(28, 27, "SSD SATA", 7.5, "#2b323d") + T(28, 38, cap(p) + " · 6 Gb/s", 6.2, "#4a5360");
    [[16, 8], [94, 8], [16, 52], [94, 52]].forEach(q => { s += C(q[0], q[1], 2.3, "#2d333d") + C(q[0], q[1], 1, "#8a94a3"); });
    s += R(100, 12, 18, 12, "#101216", 1.5) + R(102, 15, 14, 3, "url(#ag-gold)") + R(100, 30, 30, 18, "#101216", 1.5);
    for (let i = 0; i < 15; i++) s += R(102 + i * 1.8, 34, 1, 8, "url(#ag-gold)");
    return s;
  };
  FOTO.ssd = function (p) { return G(ESC.ssd(200, 60, p), "translate(10 14) scale(1.1)"); };

  ESC.hdd = function (w, h, p) {
    p = p || { gb: 1000 };
    let s = R(12, 4, 124, 84, "rgba(0,0,0,.4)", 5);
    s += R(10, 2, 124, 84, "url(#ag-aluV)", 5, 'stroke="#59626f" stroke-width="1"');
    s += R(10, 2, 124, 5, "rgba(255,255,255,.4)", 4);
    s += R(20, 14, 60, 60, "#e8ecf2", 3) + R(20, 14, 5, 60, "#d94b3a") + T(31, 30, "HDD", 9, "#2b323d") + T(31, 42, cap(p), 8, "#2b323d") + T(31, 54, "7200 RPM · SATA", 5.5, "#4a5360");
    s += C(106, 44, 15, "url(#ag-steel)", 'stroke="#59626f" stroke-width="1"') + C(106, 44, 11, "#a3adbb") + C(106, 44, 3.5, "#59626f");
    s += `<path d="M122 14l-14 22" stroke="#6a727f" stroke-width="2.4" stroke-linecap="round"/>`;
    [[16, 8], [128, 8], [16, 80], [128, 80]].forEach(q => { s += C(q[0], q[1], 2.4, "#2d333d") + C(q[0], q[1], 1, "#8a94a3"); });
    s += R(134, 18, 18, 14, "#101216", 1.5) + R(136, 21, 14, 3, "url(#ag-gold)") + R(134, 40, 36, 28, "#101216", 1.5);
    for (let i = 0; i < 15; i++) s += R(136 + i * 2.1, 46, 1, 14, "url(#ag-gold)");
    return s;
  };
  FOTO.hdd = function (p) { return G(ESC.hdd(200, 90, p), "translate(0 8) scale(.92)"); };

  /* ---------- tarjeta gráfica ---------- */
  const gpuAcento = p => (p && /^RX/.test(p.n) ? "#ff4d3d" : p && p.tier >= 5 ? "#c8d0dc" : "#76c442");
  ESC.gpu = function (w, h, p) {
    p = p || { len: 240, conn: 1, n: "GPU", tier: 3 };
    const Lg = Math.round(p.len * 0.77), ac = gpuAcento(p);
    let s = "";
    /* soporte trasero con sus salidas de video (a la izquierda, sobre la pared) */
    s += R(-118, 0, 76, 54, "url(#ag-steelH)", 2, 'stroke="#46505d" stroke-width="1"');
    [[-110, 5], [-78, 5], [-110, 30], [-78, 30]].forEach((q, i) => {
      s += R(q[0], q[1], 30, 19, "#0a0b0e", 2, 'stroke="#2a2f38" stroke-width="1"');
      s += i === 3 ? P(`M${q[0] + 3} ${q[1] + 4}h24l-3 10h-18z`, "#1b1d22") + R(q[0] + 8, q[1] + 12, 14, 2, "url(#ag-gold)") : P(`M${q[0] + 3} ${q[1] + 4}h24v6l-3 5h-18z`, "#1b1d22") + R(q[0] + 7, q[1] + 12, 16, 2, "url(#ag-gold)");
    });
    s += T(-108, 28, "DP", 4.5, "#59626f") + T(-76, 28, "DP", 4.5, "#59626f") + T(-108, 53, "DP", 4.5, "#59626f") + T(-76, 53, "HDMI", 4.5, "#59626f");
    s += C(-46, 27, 2.4, "#59626f");
    /* cuerpo visto de canto: backplate arriba, aletas al medio, carcasa abajo */
    s += R(0, 4, Lg, 48, "rgba(0,0,0,.4)", 5, 'transform="translate(2 4)"');
    s += R(0, 0, Lg, 7, "url(#ag-aluV)", 2);
    s += R(2, 7, Lg - 4, 27, "url(#ap-fins)", 1) + R(2, 7, Lg - 4, 27, "url(#ag-pcbsheen)", 1);
    [13, 21, 29].forEach(y => { s += R(4, y - 2, Lg - 22, 3.6, "url(#ag-copperH)", 2); });
    s += R(0, 34, Lg, 18, "url(#ag-black)", 4, 'stroke="#050607" stroke-width="1"') + R(0, 34, Lg, 2, "rgba(255,255,255,.18)", 1);
    s += R(0, 49, Lg, 3, ac, 1.5, 'opacity=".95"');
    s += R(Lg - 18, 2, 18, 50, "url(#ag-black)", 4, 'stroke="#050607" stroke-width="1"') + R(Lg - 18, 26, 18, 3, ac, 1);
    s += T(8, 46, p.n.toUpperCase(), 9, "rgba(240,244,250,.92)", 'style="letter-spacing:.6px"');
    s += T(Lg - 62, 46, p.vram + " GB", 7, "rgba(200,210,225,.7)");
    /* zócalos de energía en el canto (el cable se enchufa encima) */
    for (let i = 0; i < Math.max(p.conn, 0); i++) {
      const x = 166 + i * 24;
      s += R(x, 1, 22, 14, "#14161a", 2, 'stroke="#050607" stroke-width=".8"');
    }
    return s;
  };
  FOTO.gpu = function (p) {
    p = p || { len: 240, conn: 1, n: "GPU", tier: 3 };
    const W = Math.max(46, Math.round(60 + (p.len - 200) * 0.6)), H = p.len > 280 ? 62 : 54, ac = gpuAcento(p);
    const x0 = 80 - W / 2 - 6, y0 = 50 - H / 2 - 4;
    const nf = p.len >= 330 ? 3 : 2, r = Math.min(H / 2 - 6, (W - 8) / (nf * 2) - 1);
    let s = R(x0 + 2, y0 + 4, W + 12, H + 6, "rgba(0,0,0,.35)", 5);
    s += R(x0 + 6, y0 + H - 1, W + 6, 8, "#1b4d3a", 1) + R(x0 + 12, y0 + H + 2, Math.min(W * 0.55, 60), 5, "url(#ap-gold)");
    s += R(x0, y0 + 2, 6, H + 8, "url(#ag-steelH)", 1.5);
    s += R(x0 + 6, y0, W + 6, H, "url(#ag-black)", 5, 'stroke="#050607" stroke-width="1"');
    s += R(x0 + 6, y0 + H - 4, W + 6, 3, ac, 1) + R(x0 + 6, y0, W + 6, 3, "rgba(255,255,255,.2)", 3);
    for (let i = 0; i < nf; i++) s += Arte.ventilador(x0 + 12 + r + 2 + i * (r * 2 + 3), y0 + H / 2, r, { aspas: 9, color: "#2a2e36" });
    s += R(x0 + W - 4, y0 - 4, 14, 5, "#14161a", 1.5);
    return s;
  };

  /* ---------- fuente de poder ---------- */
  ESC.psu = function (w, h, p) {
    p = p || { w: 450, cert: "80+ Bronze", pcie: 1 };
    const cer = /Platinum/.test(p.cert) ? ["#cfd6e2", "PLAT."] : /Gold/.test(p.cert) ? ["#e0b540", "GOLD"] : ["#c9803d", "BRONZE"];
    let s = "";
    /* cara trasera (en el hueco de la pared): ventilador, interruptor, entrada */
    s += R(-98, 0, 84, 92, "url(#ag-blackH)", 4, 'stroke="#050607" stroke-width="1"');
    s += C(-56, 36, 31, "#0b0c0f") + C(-56, 36, 29, "url(#ap-perf)") + `<g fill="none" stroke="#0b0c0f" stroke-width="1.2"><circle cx="-56" cy="36" r="10"/><circle cx="-56" cy="36" r="19"/></g>`;
    s += R(-92, 70, 40, 18, "#07080a", 2, 'stroke="#3a414c" stroke-width="1"') + C(-80, 79, 2, "#aab") + C(-72, 79, 2, "#aab") + C(-64, 79, 2, "#aab");
    s += R(-44, 72, 22, 14, "#1b1d22", 2) + R(-42, 74, 10, 10, "#d94b3a", 2) + T(-40, 82, "I/O", 4.5, "#fff");
    /* cuerpo, visto del lado con su etiqueta */
    s += R(2, 8, 214, 84, "rgba(0,0,0,.4)", 5);
    s += R(0, 4, 214, 84, "url(#ag-black)", 5, 'stroke="#050607" stroke-width="1"');
    s += R(0, 4, 214, 5, "rgba(255,255,255,.18)", 4);
    for (let i = 0; i < 7; i++) s += R(150, 18 + i * 9, 54, 3, "#0b0c0f", 1.5);
    s += R(14, 16, 126, 60, "#dfe3ea", 3, 'stroke="#aeb4bf" stroke-width="1"');
    s += R(14, 16, 126, 14, "#2b323d", 3) + T(20, 27, "ACADEMY POWER", 8, "#e6ebf3") + T(100, 27, "ATX", 7, "#9aa4b6");
    s += T(20, 52, p.w + " W", 20, "#1d232c") + T(20, 66, `PCIe ×${p.pcie} · +12V`, 6, "#4a5360");
    s += C(116, 56, 14, cer[0], 'stroke="#2b323d" stroke-width="1"') + T(106, 54, "80+", 7, "#1d232c") + T(104, 62, cer[1], 5.2, "#1d232c");
    [[8, 10], [206, 10], [8, 82], [206, 82]].forEach(q => { s += C(q[0], q[1], 2.2, "#0b0c0f") + C(q[0], q[1], .9, "#69717e"); });
    /* cables que salen por el frente (mazos con funda) */
    [[16, "#d6d6cc"], [30, "#17191d"], [44, "#17191d"], [58, "#17191d"]].forEach(c => { s += R(212, 4 + c[0], 40, 9, "url(#ap-weave)", 4.5, 'stroke="#050607" stroke-width=".8"'); });
    s += R(214, 14, 6, 12, "#2b2f37", 1) + R(214, 44, 6, 38, "#2b2f37", 1);
    return s;
  };
  FOTO.psu = function (p) { return G(ESC.psu(300, 92, p), "translate(2 14) scale(.6)").replace("translate(2 14)", "translate(52 14)"); };

  /* ---------- ventiladores del gabinete ---------- */
  ESC.fan = (w, h) => Arte.ventiladorMarco(w, h, { aspas: 9, led: "#4aa3ff" });
  FOTO.fan = () => G(Arte.ventiladorMarco(80, 80, { aspas: 9, led: "#4aa3ff" }), "translate(40 6) scale(1.1)");

  /* ---------- cables ---------- */
  const cuerda = (x, y, w, h, c) => R(x, y, w, h, c || "url(#ap-weave)", Math.min(w, h) / 2, 'stroke="#050607" stroke-width=".8"');
  const orificios = (x, y, cols, filas, dx, dy, ww, hh) => { let s = ""; for (let i = 0; i < cols; i++) for (let j = 0; j < filas; j++) s += R(x + i * dx, y + j * dy, ww, hh, "#050607", 1) + R(x + i * dx + ww / 2 - 1, y + j * dy + hh / 2 - 1, 2, 2, "url(#ag-gold)"); return s; };

  ESC["cable-fan"] = () => {
    let s = R(10, 4, 42, 14, "#e8e5d8", 2, 'stroke="#9a978a" stroke-width=".8"') + R(10, 4, 42, 3.5, "rgba(255,255,255,.7)", 2);
    for (let i = 0; i < 4; i++) s += R(15 + i * 9.4, 9, 3, 7, "#8c8a7e");
    s += R(14, 1, 12, 3, "#c9c6b8", 1);
    [["#17191d", 0], ["#e6c93a", 1], ["#3a8a3c", 2], ["#4a6fe0", 3]].forEach(c => { s += L(16 + c[1] * 9.4, 18, 16 + c[1] * 9.4, 24, c[0], 2.2); });
    return s;
  };
  ESC["cable-eps"] = () => {
    let s = R(0, 0, 86, 22, "#0f1114", 3, 'stroke="#050607" stroke-width="1"') + R(0, 0, 86, 4, "rgba(255,255,255,.18)", 3);
    s += R(30, -4, 26, 5, "#262a31", 2);
    s += orificios(6, 5, 4, 2, 19, 8.5, 12, 7);
    for (let i = 0; i < 8; i++) s += L(8 + i * 10, 0, 8 + i * 10, -14, i % 2 ? "#17191d" : "#e6c93a", 2.6);
    s += cuerda(6, -26, 74, 14);
    return s;
  };
  ESC["cable-atx"] = () => {
    let s = R(0, -2, 24, 134, "#0f1114", 3, 'stroke="#050607" stroke-width="1"') + R(0, -2, 4, 134, "rgba(255,255,255,.12)", 2);
    s += R(21, 6, 4, 118, "#262a31", 1);
    for (let i = 0; i < 12; i++) for (let j = 0; j < 2; j++) s += R(4.5 + j * 9.5, 1.5 + i * 10.4, 6, 7, "#050607", 1) + R(6.5 + j * 9.5, 3.5 + i * 10.4, 2, 3, "url(#ag-gold)");
    const col = ["#e8742a", "#e8742a", "#17191d", "#d6352b", "#17191d", "#d6352b", "#17191d", "#17191d", "#7a4cb8", "#e6c93a", "#d6352b", "#d6352b"];
    for (let i = 0; i < 12; i++) { s += R(24, 3 + i * 10.4, 22, 3, col[i], 1.2) + R(24, 6.5 + i * 10.4, 22, 3, col[(i + 5) % 12], 1.2); }
    s += `<rect x="38" y="4" width="10" height="118" rx="4" fill="url(#ap-weave)" stroke="#050607" stroke-width=".8"/>`;
    return s;
  };
  ESC["cable-pcie"] = () => {
    let s = R(0, 0, 66, 20, "#0f1114", 3, 'stroke="#050607" stroke-width="1"') + R(0, 0, 66, 4, "rgba(255,255,255,.18)", 3);
    s += R(4, 18, 58, 12, "#14161a", 2, 'stroke="#050607" stroke-width=".8"') + R(26, 14, 14, 5, "#262a31", 2);
    s += orificios(6, 5, 6, 2, 9.6, 7, 6, 5) + R(52, 3, 12, 14, "#1b1e24", 2);
    s += R(66, 3, 8, 14, "#1b1e24", 2) + cuerda(72, 5, 52, 10) + R(80, 2, 3, 16, "#e6e6e6", 1) + R(104, 2, 3, 16, "#e6e6e6", 1);
    return s;
  };
  ESC["cable-sata-data"] = () => {
    let s = R(4, 3, 30, 20, "#0f1114", 3, 'stroke="#050607" stroke-width="1"') + R(10, 7, 18, 12, "#1b1e24", 2) + R(12, 10, 14, 4, "url(#ag-gold)");
    s += R(2, 8, 6, 10, "#aeb6c4", 1.5) + R(34, 6, 8, 14, "#0f1114", 2);
    s += R(40, 8, 78, 10, "#d6352b", 4.5, 'stroke="#7a1812" stroke-width=".8"') + R(40, 8, 78, 3, "rgba(255,255,255,.28)", 3);
    return s;
  };
  ESC["cable-sata-power"] = () => {
    let s = R(-22, 8, 222, 12, "#17191d", 5, 'stroke="#050607" stroke-width=".8"');
    for (let i = 0; i < 4; i++) s += R(-22, 9.5 + i * 2.3, 222, 1.6, ["#e6c93a", "#17191d", "#d6352b", "#17191d"][i], 0.8);
    [12, 76, 140].forEach(x => { s += R(x, 2, 46, 24, "#0f1114", 3, 'stroke="#050607" stroke-width="1"') + R(x + 4, 6, 38, 16, "#1b1e24", 2) + R(x + 6, 10, 28, 5, "url(#ag-gold)") + R(x + 4, 2, 38, 3, "rgba(255,255,255,.16)", 2) + R(x + 36, 4, 6, 4, "#aeb6c4", 1); });
    return s;
  };
  const clavija = (n, col) => {
    let s = R(4, 3, 32, 20, "#0f1114", 2.5, 'stroke="#050607" stroke-width=".9"') + R(4, 3, 32, 4, "rgba(255,255,255,.16)", 2.5);
    for (let i = 0; i < n; i++) s += R(10 + i * 12, 10, 5, 8, "#050607", 1) + R(11.5 + i * 12, 12, 2, 4, "url(#ag-gold)");
    for (let i = 0; i < n; i++) s += L(12.5 + i * 12, 22, 12.5 + i * 12, 40, col[i % col.length], 2.4);
    return s;
  };
  ESC["fp-pin"] = (w, h, p, o) => clavija(2, o && o.cols || ["#e6e6e6", "#17191d"]);
  ESC.usbf = () => {
    let s = R(2, 2, 42, 22, "#0f1114", 3, 'stroke="#050607" stroke-width="1"') + R(2, 2, 42, 4, "rgba(255,255,255,.16)", 3);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { if (i === 4 && j === 0) continue; s += R(6 + i * 7.6, 7 + j * 8, 4, 5, "#050607", .8) + R(7.2 + i * 7.6, 8.5 + j * 8, 1.6, 2, "url(#ag-gold)"); }
    s += R(16, 24, 22, 10, "url(#ap-weave)", 3) + L(20, 24, 20, 40, "#2f6fe0", 2) + L(30, 24, 30, 40, "#17191d", 2);
    return s;
  };
  ESC.audiof = () => {
    let s = R(2, 2, 46, 22, "#0f1114", 3, 'stroke="#050607" stroke-width="1"') + R(2, 2, 46, 4, "rgba(255,255,255,.16)", 3);
    for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { if (i === 4 && j === 0) continue; s += R(7 + i * 8, 7 + j * 8, 4, 5, "#050607", .8) + R(8.2 + i * 8, 8.5 + j * 8, 1.6, 2, "url(#ag-gold)"); }
    s += R(16, 24, 24, 10, "url(#ap-weave)", 3) + L(22, 24, 22, 40, "#43c06a", 2) + L(34, 24, 34, 40, "#ff7fb8", 2);
    return s;
  };
  ESC.manage = () => {
    let s = "";
    ["M0 22C30 6 60 38 100 22S170 6 200 24", "M0 30C34 14 64 44 104 30S172 14 200 32", "M0 26C32 12 62 40 102 26S172 12 200 28"].forEach((d, i) => {
      s += `<path d="${d}" fill="none" stroke="#050607" stroke-width="${12 - i * 2}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="url(#ap-weave)" stroke-width="${9 - i * 2}" stroke-linecap="round"/>`;
    });
    [[36, 20], [100, 24], [162, 20]].forEach(q => { s += R(q[0], q[1] - 8, 4, 32, "#e9ecf2", 1.5, 'stroke="#9aa1ad" stroke-width=".6"') + P(`M${q[0] + 4} ${q[1] + 20}l7 5`, "none", 'stroke="#e9ecf2" stroke-width="2" stroke-linecap="round"'); });
    return s;
  };
  ESC.sidepanel = () => {
    let s = R(0, 0, 200, 56, "rgba(0,0,0,.35)", 7, 'transform="translate(2 4)"');
    s += R(0, 0, 200, 56, "#10141b", 7, 'stroke="#2b3340" stroke-width="2"') + R(3, 3, 194, 50, "url(#ag-glass)", 5, 'stroke="rgba(170,220,255,.55)" stroke-width="1"');
    s += P("M20 53L60 3H90L50 53Z", "rgba(255,255,255,.14)") + P("M110 53L140 3H152L122 53Z", "rgba(255,255,255,.1)");
    [[10, 10], [190, 10], [10, 46], [190, 46]].forEach(q => { s += C(q[0], q[1], 3.2, "#06080b", 'stroke="#59626f" stroke-width=".8"'); });
    s += T(66, 34, "VIDRIO TEMPLADO", 6, "rgba(220,235,250,.5)");
    return s;
  };
  FOTO.sidepanel = () => G(ESC.sidepanel(200, 56), "translate(14 18) scale(.72) skewY(-6)");

  /* ---------- periféricos ---------- */
  const enchufeUSB = (cable) => {
    let s = R(14, 3, 50, 20, "rgba(0,0,0,.4)", 5, 'transform="translate(1 2)"');
    s += R(14, 2, 50, 20, "url(#ag-black)", 5, 'stroke="#050607" stroke-width="1"') + R(26, 7, 26, 10, "url(#ag-steelH)", 1.5) + R(28, 9.5, 22, 5, "#2f6fe0", 1);
    s += R(0, 9, 16, 6, cable, 3);
    return s;
  };
  ESC.keyboard = () => enchufeUSB("#17191d");
  ESC.mouse = () => enchufeUSB("#262a31");
  ESC.monitor = (w, h) => {
    const y = (h - 28) / 2;
    let s = R(0, y + 9, 18, 10, "#101216", 5);
    s += R(15, y + 1, 54, 26, "rgba(0,0,0,.4)", 5, 'transform="translate(1 2)"');
    s += R(14, y, 54, 26, "url(#ag-black)", 5, 'stroke="#050607" stroke-width="1"') + R(24, y + 5, 36, 16, "url(#ag-steelH)", 2) + P(`M27 ${y + 8}h30l-3 10h-24z`, "#0a0b0e") + R(34, y + 15, 16, 2, "url(#ag-gold)");
    return s;
  };

  FOTO.keyboard = () => {
    let s = R(10, 26, 142, 54, "rgba(0,0,0,.35)", 6, 'transform="translate(2 3)"') + R(10, 24, 142, 54, "#1c1f26", 6, 'stroke="#050607" stroke-width="1"');
    for (let r = 0; r < 4; r++) for (let c = 0; c < (r === 3 ? 0 : 13); c++) s += R(15 + c * 10.4 + (r === 1 ? 3 : r === 2 ? 5 : 0), 29 + r * 11, 8.6, 9, "#2d323c", 1.8, 'stroke="#0b0c0f" stroke-width=".6"');
    s += R(36, 29 + 33, 70, 9, "#2d323c", 1.8) + R(112, 62, 8.6, 9, "#2d323c", 1.8) + R(122, 62, 8.6, 9, "#2d323c", 1.8) + R(132, 62, 8.6, 9, "#2d323c", 1.8);
    s += R(15, 62, 8.6, 9, "#2d323c", 1.8) + R(25, 62, 8.6, 9, "#2d323c", 1.8);
    return s;
  };
  FOTO.mouse = () =>
    `<ellipse cx="82" cy="52" rx="24" ry="38" fill="rgba(0,0,0,.35)" transform="translate(2 3)"/>` +
    P("M82 12C102 12 108 30 108 52C108 78 98 92 82 92C66 92 56 78 56 52C56 30 62 12 82 12Z", "url(#ag-black)", 'stroke="#050607" stroke-width="1"') +
    L(82, 14, 82, 44, "#050607", 1.4) + P("M60 44H104", "none", 'stroke="#050607" stroke-width="1.2"') + R(78, 22, 8, 16, "#4aa3ff", 3, 'opacity=".9"') + R(60, 18, 20, 6, "rgba(255,255,255,.14)", 3) +
    P("M82 92v10", "none", 'stroke="#262a31" stroke-width="3"');
  FOTO.monitor = () =>
    R(24, 8, 112, 66, "rgba(0,0,0,.35)", 5, 'transform="translate(2 3)"') + R(22, 6, 116, 68, "#15171c", 5, 'stroke="#050607" stroke-width="1.2"') +
    R(26, 10, 108, 58, "url(#ag-screen)", 2) + R(72, 74, 16, 12, "url(#ag-steelH)", 1) + R(50, 86, 60, 6, "url(#ag-steelH)", 3) + C(80, 71, 1.4, "#4aa3ff");

  /* ---------- carcasa, placa, separadores ---------- */
  FOTO.case = function (p) {
    p = p || { id: "case_atx" };
    const k = Arte.pintura[p.id] || Arte.pintura.case_atx, ac = k.ac;
    if (p.id === "case_htpc") {
      /* caja plana y ancha, como un reproductor multimedia */
      return R(24, 62, 112, 30, "rgba(0,0,0,.35)", 4, 'transform="translate(3 4)"') +
        P("M22 56L46 46H138L114 56Z", "url(#ag-aluV)", 'stroke="#59626f" stroke-width=".8"') +
        P("M114 56L138 46V78L114 90Z", "url(#ag-black)", 'stroke="#050607" stroke-width="1"') +
        R(22, 56, 92, 34, "url(#ag-black)", 3, 'stroke="#050607" stroke-width="1"') + R(22, 56, 92, 3, "rgba(255,255,255,.2)", 3) +
        R(30, 66, 56, 5, "#0b0c0f", 2) + R(30, 76, 56, 5, "#0b0c0f", 2) + R(30, 70.5, 56, 1.5, ac, 1) +
        C(100, 72, 5, "url(#ag-steel)", 'stroke="#14161a" stroke-width="1"') + C(100, 72, 2, ac) + R(94, 82, 14, 3, "#0b0c0f", 1.5);
    }
    const id = p.id || "", itx = /itx/.test(id), matx = /matx|cube/.test(id);
    const dim = { case_atx: [58, 88], case_mesh: [58, 90], case_big: [64, 94], case_matx: [52, 80], case_cube: [64, 70], case_itx: [52, 66], case_itx_air: [56, 76] }[id] || [58, 88];
    const w = dim[0], h = dim[1], y = 96 - h, x = 34;
    let s = R(x + 3, y + 4, w + 40, h, "rgba(0,0,0,.35)", 4);
    s += R(x, y, w, h, "url(#ag-black)", 4, 'stroke="#050607" stroke-width="1"');
    s += R(x + 4, y + 8, w - 8, h - 22, k.malla ? "url(#ap-mesh)" : "url(#ap-perf)", 2);
    const vr = Math.min(11, w / 4), nv = (itx || id === "case_cube") ? 1 : (id === "case_big" ? 3 : 2);
    for (let i = 0; i < nv; i++) s += Arte.ventilador(x + w / 2, y + 8 + (h - 22) * (nv === 1 ? .33 : (i + .6) / (nv + .2)), vr, { aspas: 9, led: ac });
    s += R(x + 6, y + 3, 8, 3, "url(#ag-steelH)", 1) + R(x + 17, y + 3, 8, 3, "url(#ag-steelH)", 1) + C(x + w - 8, y + 5, 2.4, ac);
    s += R(x + 4, y + h - 8, w - 8, 2, ac, 1);
    s += P(`M${x + w} ${y + 4}L${x + w + 40} ${y + 10}V${y + h - 2}L${x + w} ${y + h}Z`, "url(#ag-glass)", 'stroke="rgba(170,220,255,.6)" stroke-width="1"');
    s += P(`M${x + w + 6} ${y + 14}L${x + w + 34} ${y + 18}V${y + h - 14}L${x + w + 6} ${y + h - 10}Z`, "rgba(8,12,20,.55)");
    s += R(x + w + 12, y + 24, 14, 10, "#1f6a4e", 1) + R(x + w + 10, y + h - 24, 18, 3, ac, 1);
    s += R(x + 4, y + h, 6, 3, "#07080a", 1) + R(x + w - 10, y + h, 6, 3, "#07080a", 1);
    return s;
  };
  FOTO.mobo = p => G(Arte.placaInner(p, { sinPuertos: true, sinTornillos: true }), "translate(52 3) scale(.255)");
  FOTO.standoffs = () => {
    let s = "";
    [[40, 34], [80, 46], [118, 30], [60, 74], [106, 78]].forEach((q, i) => {
      s += `<ellipse cx="${q[0] + 2}" cy="${q[1] + 4}" rx="11" ry="7" fill="rgba(0,0,0,.4)"/>`;
      s += P(`M${q[0] - 9} ${q[1]}l4.5-8h9l4.5 8l-4.5 8h-9z`, "url(#ag-brass)", 'stroke="#6b4a10" stroke-width="1"') + C(q[0], q[1], 3.4, "#4c360d") + C(q[0], q[1], 1.4, "#1a1205");
    });
    return s;
  };

  /* Marca de los tipos que comparten dibujo. */
  ["cable-fan", "cable-eps", "cable-atx", "cable-pcie", "cable-sata-data", "cable-sata-power", "fp-pin", "usbf", "audiof", "manage"].forEach(t => {
    FOTO[t] = FOTO[t] || function (p) {
      const f = ESC[t](100, 40, p), esc = { "cable-atx": "translate(66 2) scale(.7) rotate(90 12 66)", "cable-eps": "translate(34 36) scale(1.1)", "cable-pcie": "translate(26 34) scale(1.4)", "cable-fan": "translate(46 28) scale(1.6)", "cable-sata-data": "translate(14 34) scale(1.1)", "cable-sata-power": "translate(14 34) scale(.7)", "fp-pin": "translate(52 18) scale(2)", usbf: "translate(46 16) scale(1.9)", audiof: "translate(44 16) scale(1.8)", manage: "translate(-4 20) scale(.84)" }[t];
      return G(f, esc);
    };
  });

  /* ---------- gradientes extra que usan estas piezas ---------- */
  Arte.defs = Arte.defs.replace("</defs>", `
    <linearGradient id="ag-rgb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3be0ff"/><stop offset=".5" stop-color="#8a5cff"/><stop offset="1" stop-color="#ff4fa6"/></linearGradient>
    <linearGradient id="ag-rgbH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3be0ff"/><stop offset=".5" stop-color="#8a5cff"/><stop offset="1" stop-color="#ff4fa6"/></linearGradient>
    <linearGradient id="ag-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17406e"/><stop offset=".55" stop-color="#2b7cc4"/><stop offset="1" stop-color="#0d2745"/></linearGradient>
    </defs>`);

  /* =====================================================================
     API pública
     ===================================================================== */
  /* Vista instalada: devuelve un <svg> que llena la ranura. */
  Arte.escena = function (tipo, w, h, p, o) {
    const f = ESC[tipo]; if (!f) return "";
    return svg(w, h, f(w, h, p, o), "inst-art", 'preserveAspectRatio="none" style="overflow:visible;width:100%;height:100%"');
  };
  /* Foto de producto de 160 × 100. */
  Arte.foto = function (tipo, p, cls) {
    const f = FOTO[tipo] || (ESC[tipo] ? (q => G(ESC[tipo](100, 60, q), "translate(30 20)")) : null);
    if (!f) return "";
    return svg(160, 100, f(p), "foto" + (cls ? " " + cls : ""));
  };
  /* Categoría de tienda (+ producto) → tipo de dibujo. */
  Arte.tipoDe = function (cat, p) {
    if (cat === "sto1" || cat === "sto2" || cat === "sto") return p && p.type === "nvme" ? "m2" : p && p.type === "hdd" ? "hdd" : "ssd";
    if (cat === "cooler") return p && p.aio ? "aio" : "cooler";
    return cat;
  };
  Arte.tiene = tipo => !!(FOTO[tipo] || ESC[tipo]);
})();
