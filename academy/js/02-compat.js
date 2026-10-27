/* =====================================================================
   PC BUILDER ACADEMY · 02 · MOTOR DE COMPATIBILIDAD Y PASOS
   ---------------------------------------------------------------------
   Aquí está el "cerebro" didáctico. Todo se calcula a partir de la
   configuración (build) que eligió el jugador:

   · evaluate(b) ........ revisa las reglas (basadas en el módulo 4 de tu
                          proyecto original) y devuelve cada regla con su
                          explicación: qué pasó y POR QUÉ.
   · detectFaults(...) .. qué fallas aparecerán en el POST.
   · makeSteps(b) ....... toma los pasos del repo (components) y arma la
                          lista exacta de pasos que necesita ESTA PC.
   · fitCheck(...) ...... ¿la pieza físicamente encaja al instalarla?
   · reqStatus / bench .. requisitos del cliente y prueba de rendimiento.

   Dos momentos en los que se descubre un problema (igual que en la vida real):
     · al INSTALAR  ('fit'):  no entra, no cabe, no hay conectores.
     · al ENCENDER  ('post'): enciende pero falla (fuente corta, calor, sin video).
   ===================================================================== */

const OBLIGATORIAS = ["case", "mobo", "cpu", "ram", "cooler", "sto1", "psu"];

function faltantes(b) {
  const f = OBLIGATORIAS.filter(k => !b[k]);
  if (b.gpu === undefined) f.push("gpu");           // gpu = null significa "sin tarjeta" (elegido)
  return f;
}

/* ---------- Reglas ---------- */
function evaluate(b) {
  const P = { title: "Compatibilidad física", checks: [] };
  const E = { title: "Energía y temperatura", checks: [] };
  const F = { title: "Requisitos de funcionamiento", checks: [] };
  const B = { title: "Balance de rendimiento", checks: [] };
  const ok   = (t, w, cats) => ({ s: "ok", t, w, cats: cats || [] });
  const bad  = (t, w, cats, stage, fault) => ({ s: "bad", t, w, cats: cats || [], stage: stage || "post", fault: fault || null });
  const info = (t, w, cats) => ({ s: "info", t, w, cats: cats || [] });
  const c = b.case, m = b.mobo, cpu = b.cpu, ram = b.ram, co = b.cooler, gpu = b.gpu, s1 = b.sto1, s2 = b.sto2, psu = b.psu;

  /* ---- Física ---- */
  if (cpu && m) P.checks.push(cpu.socket === m.socket
    ? ok(`Socket compatible (${cpu.socket}).`, "El CPU y la placa comparten socket, así que el procesador encaja.", ["cpu", "mobo"])
    : bad(`CPU incompatible: socket ${cpu.socket} ≠ ${m.socket} de la placa.`, "Cada chipset se fabrica para un socket concreto: un procesador AM4 no entra en una placa LGA1700 ni al revés.", ["cpu", "mobo"], "fit"));

  if (ram && m) P.checks.push(ram.type === m.ram
    ? ok(`RAM ${ram.type} compatible con la placa.`, "El controlador de memoria de la placa define si acepta DDR4 o DDR5.", ["ram", "mobo"])
    : bad(`RAM incompatible: la placa usa ${m.ram} y elegiste ${ram.type}.`, "DDR4 y DDR5 tienen la muesca en distinto lugar: no son intercambiables.", ["ram", "mobo"], "fit"));

  if (ram && m && ram.type === m.ram) P.checks.push(ram.gb <= m.ramMax
    ? ok(`Capacidad de RAM dentro del límite (${ram.gb} ≤ ${m.ramMax} GB).`, "La placa limita la RAM total según su chipset y sus ranuras.", ["ram", "mobo"])
    : bad(`Demasiada RAM: ${ram.gb} GB supera el máximo de la placa (${m.ramMax} GB).`, `Esta placa (${m.ff}, ${m.slots} ranuras) solo reconoce hasta ${m.ramMax} GB. El equipo puede no arrancar o ignorar parte de la memoria.`, ["ram", "mobo"], "post", "ram_limit"));

  if (c && m) P.checks.push(c.supports.includes(m.ff)
    ? ok(`La placa ${m.ff} cabe en el gabinete.`, "El gabinete debe admitir el tamaño de la placa (ATX > microATX > Mini-ITX).", ["case", "mobo"])
    : bad(`La placa ${m.ff} no cabe: este gabinete solo admite ${c.supports.join(", ")}.`, "Un gabinete pequeño no admite placas más grandes.", ["case", "mobo"], "fit"));

  if (gpu && c) P.checks.push(gpu.len <= c.maxGpu
    ? ok(`La GPU (${gpu.len} mm) cabe en el gabinete (máx. ${c.maxGpu} mm).`, "Las tarjetas largas necesitan gabinetes con espacio suficiente.", ["gpu", "case"])
    : bad(`La GPU (${gpu.len} mm) es más larga que el máximo del gabinete (${c.maxGpu} mm).`, "Si la tarjeta no cabe a lo largo, no se puede instalar.", ["gpu", "case"], "fit"));

  if (co && c) {
    if (co.aio) P.checks.push(co.rad <= c.maxRad
      ? ok(`El radiador de ${co.rad} mm cabe en el gabinete (máx. ${c.maxRad} mm).`, "El radiador de una AIO se fija a las paredes del gabinete: debe haber espacio.", ["cooler", "case"])
      : bad(`El radiador de ${co.rad} mm no cabe: este gabinete admite hasta ${c.maxRad} mm.`, "Los gabinetes pequeños no tienen espacio para radiadores grandes.", ["cooler", "case"], "fit"));
    else P.checks.push(co.h <= c.maxCooler
      ? ok(`El disipador (${co.h} mm) cabe (máx. ${c.maxCooler} mm).`, "La altura del disipador está limitada por el ancho del gabinete.", ["cooler", "case"])
      : bad(`El disipador (${co.h} mm) es más alto que el máximo del gabinete (${c.maxCooler} mm).`, "Un disipador muy alto choca con el panel lateral.", ["cooler", "case"], "fit"));
  }

  const tipos = [s1, s2].filter(Boolean).map(x => x.type);
  const dup = t => tipos.filter(x => x === t).length > 1;
  if (dup("nvme")) P.checks.push(bad("Dos SSD NVMe: la placa solo tiene una ranura M.2.", "Cada ranura M.2 aloja un solo SSD. Elige otro tipo de almacenamiento para el extra.", ["sto1", "sto2"], "fit"));
  else if (dup("ssd")) P.checks.push(bad("Dos SSD SATA: el gabinete solo tiene una bahía de 2.5\".", "Cada bahía aloja una unidad. Combina tipos distintos (SSD + HDD).", ["sto1", "sto2"], "fit"));
  else if (dup("hdd")) P.checks.push(bad("Dos discos duros: el gabinete solo tiene una bahía de 3.5\".", "Cada bahía aloja una unidad. Combina tipos distintos (SSD + HDD).", ["sto1", "sto2"], "fit"));
  else if (s1) P.checks.push(ok("Las unidades de almacenamiento caben en sus ranuras/bahías.", "Hay una ranura M.2, una bahía de 2.5\" y una de 3.5\".", ["sto1", "sto2"]));

  /* ---- Energía y temperatura ---- */
  if (cpu && psu) {
    const need = H.need(b);
    if (psu.w < need) E.checks.push(bad(`Fuente insuficiente: el equipo pide ~${need} W y la fuente da ${psu.w} W.`, "La suma de consumos no debe superar la potencia de la fuente; si no, el equipo se apaga al exigirlo.", ["psu", "cpu", "gpu"], "post", "psu_watts"));
    else if (psu.w < need * 1.25) E.checks.push(info(`Fuente justa: ${psu.w} W para ~${need} W.`, "Funciona, pero conviene ~25 % de margen para picos de consumo y para que la fuente trabaje holgada.", ["psu", "cpu", "gpu"]));
    else E.checks.push(ok(`Fuente adecuada: ${psu.w} W para ~${need} W.`, "Con margen suficiente el sistema es estable bajo carga.", ["psu", "cpu", "gpu"]));
  }
  if (gpu && psu) E.checks.push(psu.pcie >= gpu.conn
    ? ok(gpu.conn ? `Conectores PCIe suficientes (${psu.pcie} ≥ ${gpu.conn}).` : "La GPU se alimenta desde la ranura PCIe (no pide cables).", "Las GPU potentes necesitan cables PCIe de 8 pines desde la fuente.", ["psu", "gpu"])
    : bad(`Faltan conectores: la GPU pide ${gpu.conn}×8 pines y la fuente tiene ${psu.pcie}.`, "Sin los conectores PCIe correctos la tarjeta no recibe energía y no hay dónde enchufar el cable.", ["psu", "gpu"], "fit"));
  if (cpu && co) E.checks.push(co.tdp >= cpu.tdp
    ? ok(`Enfriamiento suficiente: disipa ${co.tdp} W para un CPU de ${cpu.tdp} W.`, "El enfriamiento debe poder retirar al menos el TDP del procesador.", ["cooler", "cpu"])
    : bad(`Enfriamiento insuficiente: disipa ${co.tdp} W y el CPU genera ${cpu.tdp} W.`, "Un disipador corto provoca throttling o apagados por temperatura.", ["cooler", "cpu"], "post", "cooler_tdp"));

  /* ---- Funcionamiento ---- */
  if (cpu && gpu !== undefined) F.checks.push((gpu || cpu.igpu)
    ? ok(gpu ? "Video por GPU dedicada." : "Video por gráficos integrados del CPU.", "Se necesita una fuente de video: GPU dedicada o iGPU del procesador.", ["cpu", "gpu"])
    : bad(`Sin video: el ${cpu.n} no tiene gráficos integrados y no hay GPU.`, "Sin iGPU ni GPU dedicada no hay imagen en pantalla.", ["cpu", "gpu"], "post", "no_video"));
  if (s1) F.checks.push(ok("Hay almacenamiento para instalar el sistema operativo.", "Se necesita al menos una unidad para instalar el sistema operativo.", ["sto1"]));
  if (s1 && s1.type === "hdd") F.checks.push(info("El sistema arrancará desde un HDD: será lento.", "Los discos mecánicos tardan mucho más en cargar el sistema. Un SSD mejora muchísimo la experiencia.", ["sto1"]));
  if (cpu && m && cpu.oc && !m.oc) F.checks.push(info("Overclock no disponible: el CPU está desbloqueado pero el chipset no lo permite.", "Funciona, pero pagaste por un procesador desbloqueado que no podrás aprovechar. Un chipset Z o X sí lo permite.", ["cpu", "mobo"]));
  if (ram && ram.mods === 1) F.checks.push(info("Un solo módulo de RAM: funciona en single channel.", "Con dos módulos (A2 y B2) la placa activa el dual channel y mejora el ancho de banda.", ["ram"]));
  else if (ram && ram.mods >= 2) F.checks.push(ok("Dos módulos de RAM: dual channel activo.", "Dos módulos en A2/B2 duplican los canales de memoria.", ["ram"]));

  /* ---- Balance ---- */
  if (cpu && gpu) {
    const d = gpu.tier - cpu.tier;
    if (d >= 2) B.checks.push(info("Posible cuello de botella: el CPU podría quedarse corto frente a una GPU tan potente.", "Un CPU muy inferior limita el rendimiento que la GPU puede entregar.", ["cpu", "gpu"]));
    else if (d <= -2) B.checks.push(info("El CPU supera con holgura a la GPU: la gráfica será el límite.", "Equilibra el presupuesto: podrías subir de GPU si el uso es gráfico.", ["cpu", "gpu"]));
    else B.checks.push(ok("CPU y GPU están razonablemente equilibrados.", "Un buen balance evita desperdiciar dinero en una sola pieza.", ["cpu", "gpu"]));
  }

  const groups = [P, E, F, B].filter(g => g.checks.length);
  const todos = groups.flatMap(g => g.checks);
  const faults = [...new Set(todos.filter(x => x.s === "bad" && x.fault).map(x => x.fault))];
  return { groups, todos, faults, hayBad: todos.some(x => x.s === "bad") };
}

/* ¿Esta pieza candidata choca con la configuración actual? (para marcar tarjetas) */
function conflictoDe(cat, prod, b) {
  const h = Object.assign({}, b); h[cat] = prod.none ? null : prod;
  const mal = evaluate(h).todos.find(c => c.s === "bad" && c.cats.includes(cat));
  return mal ? mal.t : null;
}

/* Fallas que aparecerán al encender, en el orden en que se muestran. */
function detectFaults(b, placedAt) {
  const set = new Set(evaluate(b).faults);
  if (b.gpu && placedAt && placedAt.monitor === "video-mobo") set.add("video_port");
  return ORDEN_FALLAS.filter(f => set.has(f));
}

/* ---------- Requisitos del cliente, rendimiento ---------- */
function reqStatus(order, b) {
  return (order.reqs || []).map(r => { let okk = false; try { okk = !!r.f(b); } catch (e) { okk = false; } return { t: r.t, ok: okk }; });
}
function bench(b) {
  const cpu = (b.cpu ? b.cpu.tier : 0) * 25;
  const gpu = b.gpu ? b.gpu.tier * 20 : (b.cpu && b.cpu.igpu ? 10 : 0);
  const ram = Math.min(100, (b.ram ? b.ram.gb : 0) * 3) * (b.ram && b.ram.mods >= 2 ? 1 : 0.85);
  const sto = b.sto1 ? (b.sto1.type === "nvme" ? 100 : b.sto1.type === "ssd" ? 60 : 20) : 0;
  const t = H.coolOk(b) ? 1 : 0.7;
  const r = v => Math.round(clamp(v * t, 0, 100));
  return { productividad: r(0.4 * cpu + 0.3 * ram + 0.3 * sto), juegos: r(0.35 * cpu + 0.45 * gpu + 0.1 * ram + 0.1 * sto), edicion: r(0.35 * cpu + 0.2 * gpu + 0.3 * ram + 0.15 * sto) };
}

/* ---------- Pasos de ensamble ----------
   Se toman de 'components' (datos-repo.js) y se ajustan a la PC elegida:
   · los tornillos van incluidos en cada instalación (menos clics),
   · solo aparecen los pasos que esta PC necesita (¿lleva HDD? ¿GPU? ¿AIO?),
   · las dependencias (deps) dicen qué debe estar instalado antes. */
const limpiaInfo = t => String(t || "").replace(/OPCIÓN [AB] \([^)]*\): /, "").replace(" (También puedes elegir refrigeración líquida.)", "").replace(" Elige aire O líquida, no las dos.", "");

function makeSteps(b) {
  const base = {}; components.forEach(c => { base[c.id] = c; });
  const out = [];
  const add = (id, deps, extra) => {
    const c = base[id]; if (!c) return;
    const s = Object.assign({}, c, { deps: deps || [] }, extra || {});
    delete s.dependsOn; delete s.group; delete s.step;
    s.info = limpiaInfo(s.info);
    s.targets = s.targets || [s.target];
    out.push(s);
  };
  const air = b.cooler && !b.cooler.aio, cid = air ? "cooler" : "aio";
  const nvme = [b.sto1, b.sto2].find(x => x && x.type === "nvme");
  const ssd = [b.sto1, b.sto2].find(x => x && x.type === "ssd");
  const hdd = [b.sto1, b.sto2].find(x => x && x.type === "hdd");
  const sata = !!(ssd || hdd);
  const sataIds = [ssd ? "ssd" : null, hdd ? "hdd" : null].filter(Boolean);

  add("standoffs");
  add("mobo", ["standoffs"]);
  add("cpu", ["mobo"]);
  add("paste", ["cpu"]);
  add(cid, ["paste"]);
  add("cpuFan", [cid]);
  add("ram1", ["mobo"], { name: b.ram && b.ram.mods > 1 ? "Memoria RAM (módulo 1 · A2)" : "Memoria RAM (A2)" });
  if (b.ram && b.ram.mods > 1) add("ram2", ["ram1"], { name: "Memoria RAM (módulo 2 · B2)" });
  if (nvme) add("m2", ["mobo"]);
  add("psu", ["mobo"]);
  if (ssd) add("ssd", ["psu"]);
  if (hdd) add("hdd", ["psu"]);
  if (b.gpu) add("gpu", ["mobo"]);
  add("fanFront", ["mobo"]);
  add("fanRear", ["mobo"]);
  add("eps", ["psu"]);
  add("atx", ["psu"]);
  if (b.gpu && b.gpu.conn > 0) add("pcie", ["gpu", "psu"]);
  if (sata) { add("sataData", sataIds); add("sataPower", sataIds.concat(["psu"])); }
  add("pwrSw", ["mobo"]); add("rstSw", ["mobo"]); add("hddLed", ["mobo"]); add("pwrLed", ["mobo"]);
  add("usbFront", ["mobo"]); add("audioFront", ["mobo"]);
  const gestion = ["atx", "eps"].concat(sata ? ["sataPower"] : []).concat(b.gpu && b.gpu.conn > 0 ? ["pcie"] : []);
  add("manage", gestion);
  add("sidePanel", ["manage"], { info: "Con todo conectado y ordenado, coloca el panel lateral y atorníllalo para cerrar el gabinete." });
  add("keyboard", ["sidePanel"]);
  add("mouse", ["keyboard"]);
  add("monitor", ["mouse"].concat(b.gpu ? ["gpu"] : []), { targets: b.gpu ? ["video-gpu", "video-mobo"] : ["video-mobo"],
    info: b.gpu ? components.find(c => c.id === "monitor").info
      : "El monitor es un dispositivo de SALIDA. Este equipo no tiene tarjeta gráfica dedicada: usa los gráficos integrados del procesador, así que el cable va al puerto de video de la placa madre (parte alta del panel trasero)." });
  out.forEach((s, i) => { s.n = i + 1; });
  return out;
}

/* Pieza de la tienda a la que corresponde un paso (para mostrar su ficha). */
function productoDePaso(id, b) {
  const stor = t => [b.sto1, b.sto2].find(x => x && x.type === t);
  switch (id) {
    case "standoffs": return b.case;
    case "mobo": return b.mobo;
    case "cpu": return b.cpu;
    case "cooler": case "aio": case "cpuFan": return b.cooler;
    case "ram1": case "ram2": return b.ram;
    case "m2": return stor("nvme");
    case "ssd": return stor("ssd");
    case "hdd": return stor("hdd");
    case "psu": case "eps": case "atx": case "pcie": case "sataPower": return b.psu;
    case "gpu": return b.gpu;
    default: return null;
  }
}

/* Ficha técnica del paso según la pieza REAL elegida (si no hay, usa SPECS del repo). */
function fichaDePaso(step, b) {
  const p = productoDePaso(step.id, b);
  const tipoSto = { nvme: "SSD NVMe (PCIe)", ssd: "SSD SATA", hdd: "Disco duro SATA" };
  if (p) {
    switch (step.id) {
      case "standoffs": return [["Gabinete", p.n], ["Admite placas", p.supports.join(" / ")], ["Material", "Latón niquelado"], ["Función", "Aislar y elevar la placa"]];
      case "mobo": return [["Modelo", p.n], ["Chipset", p.chip], ["Socket", p.socket], ["Memoria", `${p.slots}× ${p.ram} (máx. ${p.ramMax} GB)`], ["PCIe", p.pcie], ["Overclock", p.oc ? "Sí" : "No"]];
      case "cpu": return [["Modelo", p.n], ["Socket", p.socket], ["Núcleos / hilos", p.cores], ["TDP", p.tdp + " W"], ["Gráficos integrados", p.igpu ? "Sí" : "No"], ["Nivel", p.tier]];
      case "cooler": case "aio": return [["Modelo", p.n], ["Tipo", p.aio ? "Líquida AIO" : "Aire (torre)"], ["Disipa", p.tdp + " W"], [p.aio ? "Radiador" : "Altura", (p.aio ? p.rad : p.h) + " mm"]];
      case "cpuFan": return SPECS.cpuFan;
      case "ram1": case "ram2": return [["Modelo", p.n], ["Tipo", p.type], ["Capacidad total", p.gb + " GB"], ["Módulos", p.mods], ["Velocidad", p.mhz + " MHz"]];
      case "m2": case "ssd": case "hdd": return [["Modelo", p.n], ["Tipo", tipoSto[p.type]], ["Capacidad", p.gb >= 1000 ? (p.gb / 1000) + " TB" : p.gb + " GB"], ["Velocidad", "~" + p.mbs + " MB/s"]];
      case "psu": return [["Modelo", p.n], ["Potencia", p.w + " W"], ["Certificación", p.cert], ["Conectores PCIe", p.pcie]];
      case "gpu": return [["Modelo", p.n], ["VRAM", p.vram + " GB"], ["Consumo", p.tdp + " W"], ["Largo", p.len + " mm"], ["Cables PCIe", p.conn ? p.conn + "×8 pines" : "ninguno"]];
      default: break;
    }
  }
  return SPECS[step.id] || null;
}

/* ---------- ¿Encaja al instalarla? ---------- */
function fitCheck(step, b) {
  const c = b.case, m = b.mobo, cpu = b.cpu, ram = b.ram, co = b.cooler, gpu = b.gpu, psu = b.psu;
  const tipos = [b.sto1, b.sto2].filter(Boolean).map(x => x.type);
  const cuantos = t => tipos.filter(x => x === t).length;
  switch (step.id) {
    case "mobo":
      if (!c.supports.includes(m.ff)) return { title: "La placa no cabe en el gabinete",
        body: `Tu placa es ${m.ff} y este gabinete solo admite ${c.supports.join(", ")}. El tamaño (factor de forma) de la placa debe ser igual o menor que el del gabinete.`, cats: ["mobo", "case"] };
      break;
    case "cpu":
      if (cpu.socket !== m.socket) return { title: "El procesador no encaja en el socket",
        body: `El ${cpu.n} es socket ${cpu.socket} y la placa tiene socket ${m.socket}. Cada socket tiene forma y contactos propios: nunca fuerces un procesador.`, cats: ["cpu"] };
      break;
    case "ram1":
      if (ram.type !== m.ram) return { title: "La memoria no entra en la ranura",
        body: `La placa usa ${m.ram} y la memoria es ${ram.type}. La muesca está en otro lugar, así que físicamente no se puede insertar.`, cats: ["ram"] };
      break;
    case "cooler":
      if (co.h > c.maxCooler) return { title: "El disipador es demasiado alto",
        body: `Mide ${co.h} mm y este gabinete admite hasta ${c.maxCooler} mm: el panel lateral no cerraría.`, cats: ["cooler"] };
      break;
    case "aio":
      if (co.rad > c.maxRad) return { title: "El radiador no cabe",
        body: `El radiador es de ${co.rad} mm y este gabinete admite hasta ${c.maxRad} mm.`, cats: ["cooler"] };
      break;
    case "gpu":
      if (gpu.len > c.maxGpu) return { title: "La tarjeta gráfica es demasiado larga",
        body: `Mide ${gpu.len} mm y el gabinete admite hasta ${c.maxGpu} mm.`, cats: ["gpu"] };
      break;
    case "pcie":
      if (psu.pcie < gpu.conn) return { title: "Faltan conectores PCIe en la fuente",
        body: `La ${gpu.n} pide ${gpu.conn} cable(s) PCIe de 8 pines y la fuente solo tiene ${psu.pcie}.`, cats: ["psu"] };
      break;
    case "m2":
      if (cuantos("nvme") > 1) return { title: "Solo hay una ranura M.2",
        body: "Elegiste dos SSD NVMe pero la placa tiene una sola ranura M.2.", cats: ["sto1", "sto2"] };
      break;
    case "ssd":
      if (cuantos("ssd") > 1) return { title: "Solo hay una bahía de 2.5\"",
        body: "Elegiste dos SSD SATA pero el gabinete tiene una sola bahía de 2.5\".", cats: ["sto1", "sto2"] };
      break;
    case "hdd":
      if (cuantos("hdd") > 1) return { title: "Solo hay una bahía de 3.5\"",
        body: "Elegiste dos discos duros pero el gabinete tiene una sola bahía de 3.5\".", cats: ["sto1", "sto2"] };
      break;
    default: break;
  }
  return null;
}
