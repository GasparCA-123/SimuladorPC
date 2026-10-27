/* =====================================================================
   PC BUILDER ACADEMY · DATOS DEL JUEGO
   ---------------------------------------------------------------------
   Aquí vive TODO lo que se puede "balancear" sin tocar la lógica:
     1. Categorías y catálogo de la tienda (con precios y nivel).
     2. Niveles, mejoras del taller.
     3. Pedidos de clientes (armado y reparación).
     4. Lecciones previas (una por concepto).
     5. Fallas que aparecen en el POST.
     6. Glosario y pistas.
     7. Mapa de ranuras del gabinete.

   Para agregar una pieza nueva, copia una línea de PRODUCTOS, cámbiale
   id, nombre, precio y características: aparece sola en la tienda.
   ===================================================================== */

/* ---------- Funciones de apoyo para evaluar una configuración ---------- */
/* 'b' (build) es un objeto con una pieza por categoría:
   { case, mobo, cpu, ram, cooler, gpu, sto1, sto2, psu }
   gpu = null  → "usar gráficos integrados";  gpu = undefined → aún sin elegir. */
const H = {
  ram:   b => (b.ram ? b.ram.gb : 0),
  dual:  b => !!(b.ram && b.ram.mods >= 2),
  sto:   b => (b.sto1 ? b.sto1.gb : 0) + (b.sto2 ? b.sto2.gb : 0),
  soSSD: b => !!(b.sto1 && b.sto1.type !== "hdd"),
  soNVMe:b => !!(b.sto1 && b.sto1.type === "nvme"),
  gpuT:  b => (b.gpu ? b.gpu.tier : 0),
  cpuT:  b => (b.cpu ? b.cpu.tier : 0),
  need:  b => 150 + (b.cpu ? b.cpu.tdp : 0) + (b.gpu ? b.gpu.tdp : 0),
  psuOk: b => !!b.psu && b.psu.w >= H.need(b) * 1.25,
  coolOk:b => !!(b.cooler && b.cpu && b.cooler.tdp >= b.cpu.tdp),
  balanced: b => !b.gpu || !b.cpu || Math.abs(b.gpu.tier - b.cpu.tier) < 2
};

/* ---------- 1 · CATEGORÍAS DE LA TIENDA ---------- */
const CATS = [
  { k: "case",   n: "Gabinete",                 ico: "case",   lib: "Gabinete" },
  { k: "mobo",   n: "Placa madre",              ico: "mobo",   lib: "Tarjeta madre" },
  { k: "cpu",    n: "Procesador",               ico: "cpu",    lib: "Procesador (CPU)" },
  { k: "ram",    n: "Memoria RAM",              ico: "ram",    lib: "Memoria RAM" },
  { k: "cooler", n: "Enfriamiento",             ico: "cooler", lib: "Sistema de enfriamiento" },
  { k: "gpu",    n: "Tarjeta gráfica",          ico: "gpu",    lib: "GPU" },
  { k: "sto1",   n: "Almacenamiento principal", ico: "ssd",    lib: "Almacenamiento" },
  { k: "sto2",   n: "Almacenamiento extra",     ico: "hdd",    lib: "Almacenamiento", opt: true },
  { k: "psu",    n: "Fuente de poder",          ico: "psu",    lib: "Fuente de poder" }
];

/* ---------- CATÁLOGO DE PRODUCTOS ----------
   p = precio en pesos · lvl = nivel en el que se desbloquea */
const PRODUCTOS = {
  /* Gabinetes: 'supports' = tamaños de placa · maxGpu/maxCooler/maxRad en mm (maxRad 0 = no admite radiador) */
  case: [
    { id: "case_matx",    n: "Gabinete microATX",          p: 1100, lvl: 1, supports: ["mATX", "ITX"],        maxGpu: 300, maxCooler: 155, maxRad: 240 },
    { id: "case_atx",     n: "Torre media ATX",            p: 1500, lvl: 1, supports: ["ATX", "mATX", "ITX"], maxGpu: 360, maxCooler: 170, maxRad: 360 },
    { id: "case_cube",    n: "Cubo microATX",              p: 1400, lvl: 2, supports: ["mATX", "ITX"],        maxGpu: 330, maxCooler: 165, maxRad: 240 },
    { id: "case_mesh",    n: "Torre ATX de malla",         p: 1900, lvl: 2, supports: ["ATX", "mATX", "ITX"], maxGpu: 380, maxCooler: 175, maxRad: 360 },
    { id: "case_big",     n: "Torre completa ATX",         p: 3200, lvl: 4, supports: ["ATX", "mATX", "ITX"], maxGpu: 430, maxCooler: 190, maxRad: 360 },
    { id: "case_htpc",    n: "Mini-ITX delgado (HTPC)",    p: 1600, lvl: 3, supports: ["ITX"],                maxGpu: 200, maxCooler: 70,  maxRad: 0 },
    { id: "case_itx",     n: "Cubo Mini-ITX",              p: 1800, lvl: 3, supports: ["ITX"],                maxGpu: 250, maxCooler: 120, maxRad: 120 },
    { id: "case_itx_air", n: "Mini-ITX ventilado",         p: 2600, lvl: 3, supports: ["ITX"],                maxGpu: 320, maxCooler: 160, maxRad: 240 }
  ],
  mobo: [
    /* AM4 · DDR4 */
    { id: "m_a520",  n: "A520M · microATX",  chip: "AMD A520",   ff: "mATX", socket: "AM4",     ram: "DDR4", ramMax: 128, slots: 4, oc: false, pcie: "3.0", gama: "Básico", p: 1300, lvl: 1 },
    { id: "m_b550m", n: "B550M · microATX",  chip: "AMD B550",   ff: "mATX", socket: "AM4",     ram: "DDR4", ramMax: 128, slots: 4, oc: true,  pcie: "4.0", gama: "Medio",  p: 1800, lvl: 1 },
    { id: "m_b550",  n: "B550 · ATX",        chip: "AMD B550",   ff: "ATX",  socket: "AM4",     ram: "DDR4", ramMax: 128, slots: 4, oc: true,  pcie: "4.0", gama: "Medio",  p: 2200, lvl: 1 },
    { id: "m_x570",  n: "X570 · ATX",        chip: "AMD X570",   ff: "ATX",  socket: "AM4",     ram: "DDR4", ramMax: 128, slots: 4, oc: true,  pcie: "4.0", gama: "Alto",   p: 3700, lvl: 2 },
    { id: "m_b550i", n: "B550I · Mini-ITX",  chip: "AMD B550",   ff: "ITX",  socket: "AM4",     ram: "DDR4", ramMax: 32,  slots: 2, oc: true,  pcie: "4.0", gama: "Medio",  p: 2600, lvl: 3 },
    /* LGA1700 · Intel (H610 usa DDR4; el resto DDR5) */
    { id: "m_h610m", n: "H610M · microATX",  chip: "Intel H610", ff: "mATX", socket: "LGA1700", ram: "DDR4", ramMax: 64,  slots: 2, oc: false, pcie: "4.0", gama: "Básico", p: 1500, lvl: 2 },
    { id: "m_b660",  n: "B660M · microATX",  chip: "Intel B660", ff: "mATX", socket: "LGA1700", ram: "DDR5", ramMax: 32,  slots: 4, oc: false, pcie: "4.0", gama: "Medio",  p: 2400, lvl: 2 },
    { id: "m_b760",  n: "B760 · ATX",        chip: "Intel B760", ff: "ATX",  socket: "LGA1700", ram: "DDR5", ramMax: 128, slots: 4, oc: false, pcie: "4.0", gama: "Medio",  p: 3000, lvl: 3 },
    { id: "m_z790",  n: "Z790 · ATX",        chip: "Intel Z790", ff: "ATX",  socket: "LGA1700", ram: "DDR5", ramMax: 192, slots: 4, oc: true,  pcie: "5.0", gama: "Alto",   p: 4400, lvl: 3 },
    { id: "m_z790i", n: "Z790I · Mini-ITX",  chip: "Intel Z790", ff: "ITX",  socket: "LGA1700", ram: "DDR5", ramMax: 64,  slots: 2, oc: true,  pcie: "5.0", gama: "Alto",   p: 4900, lvl: 3 },
    /* AM5 · DDR5 */
    { id: "m_a620m", n: "A620M · microATX",  chip: "AMD A620",   ff: "mATX", socket: "AM5",     ram: "DDR5", ramMax: 96,  slots: 4, oc: false, pcie: "4.0", gama: "Básico", p: 1900, lvl: 3 },
    { id: "m_b650",  n: "B650 · ATX",        chip: "AMD B650",   ff: "ATX",  socket: "AM5",     ram: "DDR5", ramMax: 128, slots: 4, oc: true,  pcie: "5.0", gama: "Medio",  p: 3200, lvl: 3 },
    { id: "m_b650i", n: "B650I · Mini-ITX",  chip: "AMD B650",   ff: "ITX",  socket: "AM5",     ram: "DDR5", ramMax: 64,  slots: 2, oc: true,  pcie: "5.0", gama: "Medio",  p: 3600, lvl: 3 },
    { id: "m_x670",  n: "X670 · ATX",        chip: "AMD X670",   ff: "ATX",  socket: "AM5",     ram: "DDR5", ramMax: 128, slots: 4, oc: true,  pcie: "5.0", gama: "Alto",   p: 4600, lvl: 3 }
  ],
  cpu: [
    /* AM4 */
    { id: "c_athlon", n: "Athlon 3000G",    socket: "AM4",     tdp: 35,  igpu: true,  tier: 1, oc: false, cores: "2 / 4",   p: 1100,  lvl: 1 },
    { id: "c_5600",   n: "Ryzen 5 5600",    socket: "AM4",     tdp: 65,  igpu: false, tier: 2, oc: false, cores: "6 / 12",  p: 2800,  lvl: 1 },
    { id: "c_5700g",  n: "Ryzen 7 5700G",   socket: "AM4",     tdp: 65,  igpu: true,  tier: 2, oc: false, cores: "8 / 16",  p: 3600,  lvl: 1 },
    { id: "c_5800x3d",n: "Ryzen 7 5800X3D", socket: "AM4",     tdp: 105, igpu: false, tier: 3, oc: false, cores: "8 / 16",  p: 7200,  lvl: 3 },
    /* LGA1700 */
    { id: "c_g7400",  n: "Pentium G7400",   socket: "LGA1700", tdp: 46,  igpu: true,  tier: 1, oc: false, cores: "2 / 4",   p: 1500,  lvl: 2 },
    { id: "c_i3",     n: "Core i3-12100",   socket: "LGA1700", tdp: 60,  igpu: true,  tier: 2, oc: false, cores: "4 / 8",   p: 2600,  lvl: 2 },
    { id: "c_i5",     n: "Core i5-13400",   socket: "LGA1700", tdp: 65,  igpu: true,  tier: 2, oc: false, cores: "10 / 16", p: 5000,  lvl: 2 },
    { id: "c_i5k",    n: "Core i5-13600K",  socket: "LGA1700", tdp: 125, igpu: true,  tier: 3, oc: true,  cores: "14 / 20", p: 7400,  lvl: 3 },
    { id: "c_i7",     n: "Core i7-13700K",  socket: "LGA1700", tdp: 125, igpu: true,  tier: 4, oc: true,  cores: "16 / 24", p: 8800,  lvl: 4 },
    { id: "c_i9",     n: "Core i9-13900K",  socket: "LGA1700", tdp: 150, igpu: true,  tier: 5, oc: true,  cores: "24 / 32", p: 12500, lvl: 5 },
    /* AM5 */
    { id: "c_7600",   n: "Ryzen 5 7600",    socket: "AM5",     tdp: 65,  igpu: true,  tier: 3, oc: false, cores: "6 / 12",  p: 5200,  lvl: 3 },
    { id: "c_7700",   n: "Ryzen 7 7700",    socket: "AM5",     tdp: 65,  igpu: true,  tier: 3, oc: false, cores: "8 / 16",  p: 6000,  lvl: 3 },
    { id: "c_7800x3d",n: "Ryzen 7 7800X3D", socket: "AM5",     tdp: 120, igpu: true,  tier: 4, oc: false, cores: "8 / 16",  p: 9500,  lvl: 4 },
    { id: "c_7950x",  n: "Ryzen 9 7950X",   socket: "AM5",     tdp: 170, igpu: true,  tier: 5, oc: true,  cores: "16 / 32", p: 13500, lvl: 5 }
  ],
  ram: [
    { id: "r_8",    n: "8 GB DDR4 2666 (1×8)",    type: "DDR4", gb: 8,  mods: 1, mhz: 2666, p: 450,  lvl: 1 },
    { id: "r_16s",  n: "16 GB DDR4 3200 (1×16)",  type: "DDR4", gb: 16, mods: 1, mhz: 3200, p: 800,  lvl: 1 },
    { id: "r_16d",  n: "16 GB DDR4 3200 (2×8)",   type: "DDR4", gb: 16, mods: 2, mhz: 3200, p: 900,  lvl: 1 },
    { id: "r_32d4", n: "32 GB DDR4 3600 (2×16)",  type: "DDR4", gb: 32, mods: 2, mhz: 3600, p: 1700, lvl: 2 },
    { id: "r_64d4", n: "64 GB DDR4 3200 (2×32)",  type: "DDR4", gb: 64, mods: 2, mhz: 3200, p: 3300, lvl: 3 },
    { id: "r_16s5", n: "16 GB DDR5 4800 (1×16)",  type: "DDR5", gb: 16, mods: 1, mhz: 4800, p: 1100, lvl: 2 },
    { id: "r_16d5", n: "16 GB DDR5 5600 (2×8)",   type: "DDR5", gb: 16, mods: 2, mhz: 5600, p: 1500, lvl: 2 },
    { id: "r_32d5b",n: "32 GB DDR5 5600 (2×16)",  type: "DDR5", gb: 32, mods: 2, mhz: 5600, p: 2100, lvl: 3 },
    { id: "r_32d5", n: "32 GB DDR5 6000 (2×16)",  type: "DDR5", gb: 32, mods: 2, mhz: 6000, p: 2600, lvl: 3 },
    { id: "r_64d5", n: "64 GB DDR5 6000 (2×32)",  type: "DDR5", gb: 64, mods: 2, mhz: 6000, p: 5200, lvl: 4 }
  ],
  cooler: [
    { id: "f_stock",   n: "Disipador básico",     tdp: 65,  h: 45,  aio: false, p: 250,  lvl: 1 },
    { id: "f_lowp",    n: "Perfil bajo",          tdp: 95,  h: 58,  aio: false, p: 400,  lvl: 2 },
    { id: "f_compact", n: "Torre compacta",       tdp: 120, h: 100, aio: false, p: 550,  lvl: 1 },
    { id: "f_mid",     n: "Torre mediana",        tdp: 160, h: 140, aio: false, p: 750,  lvl: 2 },
    { id: "f_tower",   n: "Torre de aire doble",  tdp: 220, h: 160, aio: false, p: 900,  lvl: 2 },
    { id: "f_aio120",  n: "Líquida AIO 120",      tdp: 150, h: 50,  aio: true,  rad: 120, p: 1500, lvl: 2 },
    { id: "f_aio",     n: "Líquida AIO 240",      tdp: 250, h: 50,  aio: true,  rad: 240, p: 2100, lvl: 3 },
    { id: "f_aio280",  n: "Líquida AIO 280",      tdp: 290, h: 50,  aio: true,  rad: 280, p: 2700, lvl: 4 },
    { id: "f_aio360",  n: "Líquida AIO 360",      tdp: 350, h: 50,  aio: true,  rad: 360, p: 3300, lvl: 5 }
  ],
  gpu: [
    { id: "g_1030",  n: "GT 1030",     vram: 2,  tdp: 30,  len: 150, conn: 0, tier: 1, p: 1500,  lvl: 1 },
    { id: "g_1650",  n: "GTX 1650",    vram: 4,  tdp: 75,  len: 200, conn: 0, tier: 2, p: 3200,  lvl: 2 },
    { id: "g_6400",  n: "RX 6400",     vram: 4,  tdp: 53,  len: 170, conn: 0, tier: 2, p: 2800,  lvl: 2 },
    { id: "g_4060",  n: "RTX 4060",    vram: 8,  tdp: 115, len: 240, conn: 1, tier: 3, p: 7500,  lvl: 3 },
    { id: "g_7600",  n: "RX 7600",     vram: 8,  tdp: 165, len: 240, conn: 1, tier: 3, p: 6900,  lvl: 3 },
    { id: "g_4070",  n: "RTX 4070",    vram: 12, tdp: 200, len: 300, conn: 1, tier: 4, p: 11500, lvl: 3 },
    { id: "g_7800",  n: "RX 7800 XT",  vram: 16, tdp: 263, len: 280, conn: 2, tier: 4, p: 13500, lvl: 4 },
    { id: "g_4080",  n: "RTX 4080",    vram: 16, tdp: 320, len: 310, conn: 2, tier: 5, p: 26000, lvl: 5 },
    { id: "g_7900",  n: "RX 7900 XTX", vram: 24, tdp: 355, len: 287, conn: 2, tier: 5, p: 23000, lvl: 5 },
    { id: "g_4090",  n: "RTX 4090",    vram: 24, tdp: 450, len: 340, conn: 3, tier: 5, p: 38000, lvl: 5 }
  ],
  sto: [
    { id: "s_s240",  n: "SSD SATA 240 GB", type: "ssd",  gb: 240,  mbs: 520,  p: 450,  lvl: 1 },
    { id: "s_n500",  n: "SSD NVMe 500 GB", type: "nvme", gb: 500,  mbs: 3500, p: 650,  lvl: 1 },
    { id: "s_s512",  n: "SSD SATA 512 GB", type: "ssd",  gb: 512,  mbs: 550,  p: 650,  lvl: 1 },
    { id: "s_n1",    n: "SSD NVMe 1 TB",   type: "nvme", gb: 1000, mbs: 3500, p: 1100, lvl: 1 },
    { id: "s_s1t",   n: "SSD SATA 1 TB",   type: "ssd",  gb: 1000, mbs: 560,  p: 1000, lvl: 2 },
    { id: "s_n2",    n: "SSD NVMe 2 TB",   type: "nvme", gb: 2000, mbs: 7000, p: 2200, lvl: 4 },
    { id: "s_h1",    n: "HDD 1 TB",        type: "hdd",  gb: 1000, mbs: 150,  p: 700,  lvl: 1 },
    { id: "s_h2",    n: "HDD 2 TB",        type: "hdd",  gb: 2000, mbs: 160,  p: 900,  lvl: 1 },
    { id: "s_h4",    n: "HDD 4 TB",        type: "hdd",  gb: 4000, mbs: 180,  p: 1500, lvl: 3 },
    { id: "s_h8",    n: "HDD 8 TB",        type: "hdd",  gb: 8000, mbs: 200,  p: 2800, lvl: 4 }
  ],
  psu: [
    { id: "p_450",  n: "Fuente 450 W",  w: 450,  pcie: 1, cert: "80+ Bronze",   p: 650,  lvl: 1 },
    { id: "p_550",  n: "Fuente 550 W",  w: 550,  pcie: 2, cert: "80+ Bronze",   p: 850,  lvl: 1 },
    { id: "p_650",  n: "Fuente 650 W",  w: 650,  pcie: 2, cert: "80+ Bronze",   p: 1100, lvl: 1 },
    { id: "p_750",  n: "Fuente 750 W",  w: 750,  pcie: 3, cert: "80+ Gold",     p: 1500, lvl: 2 },
    { id: "p_850",  n: "Fuente 850 W",  w: 850,  pcie: 3, cert: "80+ Gold",     p: 2000, lvl: 2 },
    { id: "p_1000", n: "Fuente 1000 W", w: 1000, pcie: 4, cert: "80+ Gold",     p: 3000, lvl: 4 },
    { id: "p_1200", n: "Fuente 1200 W", w: 1200, pcie: 4, cert: "80+ Platinum", p: 4200, lvl: 5 }
  ]
};
/* Las dos categorías de almacenamiento comparten catálogo. */
PRODUCTOS.sto1 = PRODUCTOS.sto;
PRODUCTOS.sto2 = PRODUCTOS.sto;

/* Pieza "sin tarjeta gráfica" (usar los gráficos integrados del CPU). */
const SIN_GPU = { id: "g_none", n: "Sin tarjeta (gráficos integrados)", p: 0, lvl: 1, none: true };
const SIN_EXTRA = { id: "s_none", n: "Sin almacenamiento extra", p: 0, lvl: 1, none: true };

/* ---------- 2 · NIVELES Y MEJORAS ---------- */
const NIVELES = [
  { n: 1, xp: 0,    t: "Aprendiz" },
  { n: 2, xp: 120,  t: "Ayudante de taller" },
  { n: 3, xp: 300,  t: "Técnico" },
  { n: 4, xp: 560,  t: "Técnico senior" },
  { n: 5, xp: 900,  t: "Especialista" },
  { n: 6, xp: 1350, t: "Maestro ensamblador" }
];

const MEJORAS = [
  { id: "lamp",   ico: "🔦", n: "Lámpara de inspección", p: 1000, d: "Las pistas de diagnóstico ya no restan estrellas." },
  { id: "manual", ico: "📘", n: "Manual del técnico",    p: 1500, d: "«Resaltar siguiente paso» no resta estrellas." },
  { id: "meter",  ico: "🔌", n: "Multímetro",            p: 2000, d: "Verificar compatibilidad en modo Técnico es gratis." },
  { id: "pro",    ico: "🏭", n: "Banco profesional",     p: 4000, d: "+10 % en la mano de obra de cada pedido." }
];

/* Ayuda de compatibilidad = dificultad. 'mult' multiplica la experiencia. */
const AYUDAS = {
  live:   { n: "Aprendiz", ico: "🟢", mult: 1,   d: "El verificador explica cada regla en vivo y las ranuras llevan etiqueta." },
  demand: { n: "Técnico",  ico: "🟡", mult: 1.5, d: "Verificas bajo demanda (cuesta $100 sin multímetro). Las ranuras llevan etiqueta." },
  off:    { n: "Experto",  ico: "🔴", mult: 2,   d: "Sin verificador ni etiquetas. Lo que falle lo descubres en el POST." }
};

/* ---------- 3 · PEDIDOS DE CLIENTES ----------
   tipo 'armado'     → eliges piezas, ensamblas y enciendes.
   tipo 'reparacion' → diagnosticas un equipo con falla (casos del repo, CASES).
   reqs: requisitos del cliente, con una función que evalúa la configuración. */
const PEDIDOS = [
  { id: "oficina", tipo: "armado", lvl: 1, ico: "🧾", titulo: "PC para la papelería",
    cliente: "Doña Rosa", rol: "Papelería «La Escuadra»", presupuesto: 8000, mano: 700, xp: 60, concepto: "socket",
    historia: "Necesito una compu sencilla para cobrar, imprimir y llevar el inventario. Que arranque rápido y no me cueste una fortuna.",
    reqs: [
      { t: "RAM de al menos 8 GB",                 f: b => H.ram(b) >= 8 },
      { t: "Sistema en un SSD (arranque rápido)",  f: b => H.soSSD(b) },
      { t: "Almacenamiento total de 240 GB o más", f: b => H.sto(b) >= 240 }
    ] },
  { id: "estudiante", tipo: "armado", lvl: 1, ico: "💻", titulo: "PC para estudiar programación",
    cliente: "Valeria", rol: "Estudiante de ingeniería", presupuesto: 13000, mano: 900, xp: 80, concepto: "ram",
    historia: "Voy a correr editores, máquinas virtuales y el navegador con 30 pestañas. Necesito memoria y un disco veloz.",
    reqs: [
      { t: "RAM de 16 GB o más",                    f: b => H.ram(b) >= 16 },
      { t: "RAM en dual channel (2 módulos)",       f: b => H.dual(b) },
      { t: "Sistema en un SSD NVMe",                f: b => H.soNVMe(b) },
      { t: "Almacenamiento total de 480 GB o más",  f: b => H.sto(b) >= 480 }
    ] },
  { id: "gamer", tipo: "armado", lvl: 2, ico: "🎮", titulo: "PC gamer para 1080p",
    cliente: "Diego", rol: "Preparatoriano", presupuesto: 22000, mano: 1300, xp: 110, concepto: "psu",
    historia: "Quiero jugar a 1080p sin tirones. Ya me dijeron que la fuente es importante pero no sé cuánto.",
    reqs: [
      { t: "Tarjeta gráfica dedicada",                     f: b => !!b.gpu },
      { t: "RAM de 16 GB o más",                           f: b => H.ram(b) >= 16 },
      { t: "Sistema en un SSD",                            f: b => H.soSSD(b) },
      { t: "Fuente con 25 % de margen sobre el consumo",   f: b => H.psuOk(b) }
    ] },
  { id: "minipc", tipo: "armado", lvl: 3, ico: "📺", titulo: "Mini PC para la sala",
    cliente: "Familia Ortega", rol: "Hogar", presupuesto: 17000, mano: 1800, xp: 130, concepto: "formfactor",
    historia: "Debe caber en el mueble de la tele, así que tiene que ser chiquita. Para películas, videollamadas y la tarea de los niños.",
    reqs: [
      { t: "Gabinete Mini-ITX",                     f: b => !!b.case && b.case.supports.length === 1 && b.case.supports[0] === "ITX" },
      { t: "RAM de 16 GB o más",                    f: b => H.ram(b) >= 16 },
      { t: "Sistema en un SSD",                     f: b => H.soSSD(b) },
      { t: "Almacenamiento total de 480 GB o más",  f: b => H.sto(b) >= 480 }
    ] },
  { id: "nas", tipo: "armado", lvl: 3, ico: "🗄️", titulo: "Servidor casero de archivos",
    cliente: "Ing. Salazar", rol: "Fotógrafo aficionado", presupuesto: 14000, mano: 1700, xp: 130, concepto: "storage",
    historia: "Tengo años de fotos en discos sueltos. Quiero una PC que guarde todo en un solo lugar, con espacio de sobra.",
    reqs: [
      { t: "Almacenamiento total de 4 TB o más",            f: b => H.sto(b) >= 4000 },
      { t: "Sistema operativo en un SSD",                   f: b => H.soSSD(b) },
      { t: "Un disco duro (HDD) como almacenamiento extra", f: b => !!b.sto2 && b.sto2.type === "hdd" },
      { t: "RAM de 16 GB o más",                            f: b => H.ram(b) >= 16 }
    ] },
  { id: "diseno", tipo: "armado", lvl: 3, ico: "🎨", titulo: "Estudio de diseño gráfico",
    cliente: "Mariana", rol: "Diseñadora freelance", presupuesto: 30000, mano: 2200, xp: 140, concepto: "balance",
    historia: "Trabajo con archivos pesados en Photoshop e Illustrator y a veces render 3D. No quiero gastar de más en una pieza y que otra me frene.",
    reqs: [
      { t: "RAM de 32 GB o más",                             f: b => H.ram(b) >= 32 },
      { t: "Sistema en un SSD NVMe",                         f: b => H.soNVMe(b) },
      { t: "Tarjeta gráfica de nivel 3 o superior",          f: b => H.gpuT(b) >= 3 },
      { t: "CPU y GPU equilibrados (sin cuello de botella)", f: b => !!b.gpu && H.balanced(b) }
    ] },
  { id: "video", tipo: "armado", lvl: 4, ico: "🎬", titulo: "Estación de edición de video",
    cliente: "Productora Cinta 35", rol: "Estudio audiovisual", presupuesto: 42000, mano: 3000, xp: 170, concepto: "cooling",
    historia: "Renderizamos horas seguidas. Si la máquina se calienta y baja de rendimiento, perdemos entregas.",
    reqs: [
      { t: "Procesador de nivel 3 o superior",           f: b => H.cpuT(b) >= 3 },
      { t: "Tarjeta gráfica de nivel 3 o superior",      f: b => H.gpuT(b) >= 3 },
      { t: "RAM de 32 GB o más en dual channel",         f: b => H.ram(b) >= 32 && H.dual(b) },
      { t: "NVMe de 1 TB o más",                         f: b => H.soNVMe(b) && b.sto1.gb >= 1000 },
      { t: "Enfriamiento suficiente para el procesador", f: b => H.coolOk(b) }
    ] },
  { id: "extremo", tipo: "armado", lvl: 5, ico: "🚀", titulo: "Gamer 4K sin límites",
    cliente: "Rafa «Hyper»", rol: "Streamer", presupuesto: 80000, mano: 5000, xp: 220, concepto: "power",
    historia: "Quiero lo mejor para jugar en 4K y transmitir. El dinero no es problema; que no se apague ni se queme es lo que me importa.",
    reqs: [
      { t: "Tarjeta gráfica de nivel 5",                   f: b => H.gpuT(b) >= 5 },
      { t: "Procesador de nivel 4",                        f: b => H.cpuT(b) >= 4 },
      { t: "RAM de 32 GB o más",                           f: b => H.ram(b) >= 32 },
      { t: "NVMe de 1 TB o más",                           f: b => H.soNVMe(b) && b.sto1.gb >= 1000 },
      { t: "Fuente con 25 % de margen sobre el consumo",   f: b => H.psuOk(b) },
      { t: "Enfriamiento suficiente para el procesador",   f: b => H.coolOk(b) }
    ] },

  /* ----- Reparaciones: usan los casos del repo (CASES) ----- */
  { id: "r_psu", tipo: "reparacion", lvl: 2, ico: "🔌", titulo: "No enciende absolutamente nada",
    cliente: "Marco", rol: "Oficinista", caso: "psu", mano: 900, xp: 70, concepto: "post",
    historia: "Anoche la apagué normal y hoy no hace nada. Ni una luz. Ya probé otro enchufe." },
  { id: "r_ram", tipo: "reparacion", lvl: 2, ico: "🧬", titulo: "Pitidos y pantalla negra",
    cliente: "Lupita", rol: "Contadora", caso: "ram", mano: 900, xp: 70, concepto: "post",
    historia: "Mi hijo le estuvo moviendo adentro y ahora solo suena un pitido largo y no sale imagen." },
  { id: "r_storage", tipo: "reparacion", lvl: 2, ico: "💾", titulo: "«No bootable device»",
    cliente: "Prof. Navarro", rol: "Docente", caso: "storage", mano: 900, xp: 70, concepto: "storage",
    historia: "Prende, hace un pitido, y luego un mensaje en inglés que no entiendo. No carga Windows." },
  { id: "r_monitor", tipo: "reparacion", lvl: 3, ico: "🖥️", titulo: "Todo enciende pero hay pantalla negra",
    cliente: "Sr. Beltrán", rol: "Comerciante", caso: "monitor", mano: 1100, xp: 80, concepto: "post",
    historia: "Los ventiladores giran, las luces prenden, pero el monitor no muestra nada." },
  { id: "r_video", tipo: "reparacion", lvl: 3, ico: "📡", titulo: "«Sin señal» tras instalar la gráfica",
    cliente: "Andrea", rol: "Gamer", caso: "video", mano: 1200, xp: 90, concepto: "gpu",
    historia: "Compré una tarjeta gráfica nueva, la puse y desde entonces el monitor dice «sin señal». ¿La compré defectuosa?" },
  { id: "r_cpu", tipo: "reparacion", lvl: 3, ico: "⚙️", titulo: "Los ventiladores giran un segundo y se apaga",
    cliente: "Hugo", rol: "Estudiante", caso: "cpu", mano: 1200, xp: 90, concepto: "power",
    historia: "Armé mi primera PC con un amigo. Enciende un instante y se apaga solita. Una y otra vez." },
  { id: "r_cooling", tipo: "reparacion", lvl: 4, ico: "🌡️", titulo: "Se apaga a los pocos segundos y está caliente",
    cliente: "Taller Gómez", rol: "Negocio", caso: "cooling", mano: 1500, xp: 100, concepto: "cooling",
    historia: "Una PC que armaron hace meses. Llega al logo y se apaga. La torre se siente muy caliente." },
  { id: "r_eps", tipo: "reparacion", lvl: 4, ico: "🔧", titulo: "Enciende, pero nunca termina el arranque",
    cliente: "Carlos", rol: "Ingeniero", caso: "eps", mano: 1500, xp: 100, concepto: "power",
    historia: "Cambié la placa ayer. Se prende una luz roja fija y ya no pasa de ahí." },
  { id: "r_ok", tipo: "reparacion", lvl: 5, ico: "🕵️", titulo: "«Creo que algo anda mal»",
    cliente: "Don Armando", rol: "Jubilado", caso: "ok", mano: 1800, xp: 110, concepto: "post",
    historia: "Mi nieto dice que la compu hace un pitido al prender y que eso es mala señal. ¿Me la revisa?" }
];

/* ---------- 4 · LECCIONES PREVIAS (una por concepto) ----------
   theory = índice dentro de THEORY (datos-repo.js). Se muestran ANTES de
   la tienda: primero se enseña, después se pone a prueba. */
const CONCEPTOS = {
  socket: { theory: 0, titulo: "Socket: el «enchufe» del procesador",
    reglas: ["El socket del CPU debe ser el mismo que el de la placa (AM4, AM5, LGA1700…).",
             "El chipset de la placa decide qué socket y qué tipo de RAM usa.",
             "Un CPU de otro socket no entra: nunca se fuerza."],
    ejemplo: "Ryzen 5 5600 → socket AM4 → necesita una placa A520, B550 o X570.",
    q: { q: "Un procesador para socket AM4, ¿entra en una placa LGA1700?", opts: ["No: el socket es distinto", "Sí, si lo fuerzas", "Sí, con pasta térmica", "Solo con más RAM"], correct: 0,
         fb: "Cada socket tiene forma y número de contactos propios; no son intercambiables." } },
  ram: { theory: 2, titulo: "RAM: tipo, capacidad y canales",
    reglas: ["DDR4 y DDR5 no son intercambiables: la muesca está en otro lugar.",
             "La placa limita cuánta RAM acepta (chipset y número de ranuras).",
             "Dos módulos en A2/B2 activan el dual channel: más ancho de banda que un solo módulo."],
    ejemplo: "2×8 GB en dual channel rinde mejor que 1×16 GB, aunque el total sea el mismo.",
    q: { q: "¿Qué ventaja tiene 2×8 GB frente a 1×16 GB?", opts: ["Dual channel: más ancho de banda", "Se borra menos al apagar", "Consume más energía", "Ninguna, es idéntico"], correct: 0,
         fb: "Con dos módulos la placa usa dos canales de memoria a la vez." } },
  psu: { theory: 5, titulo: "Fuente: watts con margen",
    reglas: ["Suma el consumo: base (~150 W) + CPU + GPU.",
             "Deja ~25 % de margen para picos y para que la fuente trabaje holgada.",
             "Una fuente corta hace que el equipo se apague cuando se exige."],
    ejemplo: "CPU 65 W + GPU 115 W + base 150 W ≈ 330 W → con margen conviene una de 450 W o más.",
    q: { q: "Una fuente de más watts, ¿da más rendimiento por sí sola?", opts: ["No: da margen y estabilidad", "Sí, siempre", "Solo en oficina", "Sí, si es modular"], correct: 0,
         fb: "El rendimiento lo dan CPU, GPU y RAM; la fuente solo debe alcanzar y sobrar." } },
  formfactor: { theory: 6, titulo: "Factor de forma: ¿qué cabe en qué?",
    reglas: ["ATX > microATX > Mini-ITX en tamaño.",
             "El gabinete solo admite placas de su tamaño o menores.",
             "Un gabinete chico limita el largo de la GPU, la altura del disipador y el radiador."],
    ejemplo: "En un cubo Mini-ITX cabe una RTX 4060 (240 mm) pero no una RTX 4070 (300 mm).",
    q: { q: "¿Puede una placa ATX instalarse en un gabinete que solo admite Mini-ITX?", opts: ["No, es demasiado grande", "Sí, con standoffs extra", "Sí, si se atornilla fuerte", "Solo sin GPU"], correct: 0,
         fb: "La placa debe ser del tamaño del gabinete o más pequeña." } },
  balance: { theory: 4, titulo: "Equilibrio entre CPU y GPU",
    reglas: ["Un CPU muy lento limita a una GPU potente: es el cuello de botella.",
             "Una GPU débil desperdicia un buen CPU.",
             "Reparte el presupuesto según la tarea: oficina no necesita gráfica; diseño y juegos sí."],
    ejemplo: "Un CPU de nivel 2 con una GPU de nivel 5 desperdicia gran parte de la tarjeta.",
    q: { q: "¿Qué es un cuello de botella?", opts: ["Una pieza lenta que limita a las demás", "Un tipo de cable", "Un disipador pequeño", "Un error del POST"], correct: 0,
         fb: "El conjunto rinde lo que permite su componente más limitante para esa tarea." } },
  storage: { theory: 3, titulo: "Almacenamiento: velocidad contra capacidad",
    reglas: ["HDD: barato y enorme, pero lento (partes mecánicas).",
             "SSD SATA: ~550 MB/s. SSD NVMe (M.2): 3000 MB/s o más.",
             "Combina: sistema en SSD y archivos pesados en HDD."],
    ejemplo: "SSD de 500 GB para Windows + HDD de 4 TB para fotos y respaldos.",
    q: { q: "Para que el sistema arranque rápido, ¿dónde conviene instalarlo?", opts: ["En un SSD", "En un HDD", "En la RAM", "En la fuente"], correct: 0,
         fb: "Un SSD carga el sistema operativo mucho más rápido que un disco mecánico." } },
  cooling: { theory: 7, titulo: "Enfriamiento: cubrir el TDP",
    reglas: ["TDP = calor que genera el CPU; el enfriamiento debe disipar al menos eso.",
             "Sin enfriamiento suficiente el CPU baja su frecuencia (throttling) o se apaga.",
             "Revisa la altura del disipador y el tamaño del radiador contra el gabinete."],
    ejemplo: "Un i7 de 125 W con un disipador de 65 W se sobrecalienta; una torre de 220 W sí lo cubre.",
    q: { q: "Un CPU de 125 W y un disipador que disipa 65 W. ¿Qué pasa?", opts: ["Se sobrecalienta y se apaga o baja de rendimiento", "Rinde más", "Nada", "La RAM se vuelve lenta"], correct: 0,
         fb: "Si el calor generado supera lo que el disipador retira, la temperatura sube hasta el apagado." } },
  power: { theory: 5, titulo: "Conectores de energía",
    reglas: ["EPS de 8 pines → CPU. ATX de 24 pines → placa. PCIe 6+2 → GPU. SATA → discos.",
             "Una GPU potente pide uno o más cables PCIe: tu fuente debe tener suficientes.",
             "Una GPU de 75 W o menos se alimenta solo desde la ranura PCIe."],
    ejemplo: "La RTX 4090 pide 3 conectores PCIe de 8 pines; una fuente con solo 2 no sirve.",
    q: { q: "¿Qué conector alimenta específicamente al procesador?", opts: ["EPS de 8 pines", "ATX de 24 pines", "SATA", "USB"], correct: 0,
         fb: "El EPS entrega 12 V al VRM del CPU; el ATX de 24 pines alimenta la placa." } },
  post: { theory: 9, titulo: "POST: el autodiagnóstico",
    reglas: ["Al encender, la placa revisa fuente, CPU, RAM y video.",
             "Pitidos, LEDs de la placa y mensajes en pantalla indican qué falló.",
             "Un pitido corto suele significar que todo está bien."],
    ejemplo: "LED «DRAM» rojo y un pitido largo repetido: revisa la memoria RAM.",
    q: { q: "¿Qué hace el POST?", opts: ["Un autodiagnóstico del hardware al encender", "Instala programas", "Formatea el disco", "Sube archivos a la nube"], correct: 0,
         fb: "Verifica lo esencial antes de entregar el control al sistema operativo." } },
  gpu: { theory: 4, titulo: "Video: ¿GPU o gráficos integrados?",
    reglas: ["Con GPU dedicada, el monitor se conecta a la GPU, no a la placa.",
             "Los puertos de video de la placa solo funcionan si el CPU tiene gráficos integrados.",
             "Sin GPU ni iGPU no hay imagen."],
    ejemplo: "Ryzen 5 5600 (sin iGPU) + sin tarjeta gráfica = pantalla sin señal.",
    q: { q: "Tienes GPU dedicada. ¿A dónde va el cable del monitor?", opts: ["A la salida de la GPU", "Al puerto de video de la placa", "Al puerto USB", "Al de la fuente"], correct: 0,
         fb: "Con GPU dedicada, la salida de la placa se desactiva y la imagen sale por la tarjeta." } }
};

/* ---------- 5 · FALLAS DEL POST (equipos armados por el jugador) ----------
   La opción correcta SIEMPRE es la de índice 0 (la lógica las baraja).
   'accion' dice qué se arregla: cat = categoría que se cambia en la tienda,
   unplace = pasos de ensamblaje que hay que repetir, replug = reconectar monitor. */
const FALLAS = {
  psu_watts: b => ({
    falla: "Enciende, pero se apaga en cuanto trabaja fuerte",
    post: { pantalla: "negra tras el logo", beeps: "sin pitidos", led: "ninguno" },
    causa: `La fuente (${b.psu.w} W) no alcanza para el equipo, que consume ~${H.need(b)} W.`,
    opcionesCausa: [`La fuente (${b.psu.w} W) es insuficiente para ~${H.need(b)} W`, "La RAM está mal asentada", "El monitor está en otra entrada", "Falta pasta térmica"],
    fix: "Cambiar la fuente por una de mayor potencia, con ~25 % de margen.",
    opcionesFix: ["Cambiar por una fuente de más watts", "Reinstalar el sistema operativo", "Cambiar el cable HDMI", "Limpiar el teclado"],
    teoria: "Cuando el consumo sube (sobre todo con la GPU), una fuente corta no entrega la corriente que se le pide y su protección apaga el equipo. Suma siempre CPU + GPU + base y deja margen.",
    pista: `Suma: base 150 W + CPU ${b.cpu.tdp} W + GPU ${b.gpu ? b.gpu.tdp : 0} W. Compara con los watts de la fuente.`,
    accion: { cat: "psu", unplace: [] } }),

  cooler_tdp: b => ({
    falla: "Arranca y se apaga a los pocos segundos; la torre está caliente",
    post: { pantalla: "a veces llega al logo y se apaga", beeps: "1 corto y luego apagado", led: "CPU (temperatura)" },
    causa: `El enfriamiento (${b.cooler.tdp} W) no cubre el calor del procesador (${b.cpu.tdp} W de TDP).`,
    opcionesCausa: [`El enfriamiento disipa ${b.cooler.tdp} W y el CPU genera ${b.cpu.tdp} W`, "Falta el disco duro", "El cable HDMI está flojo", "La fuente tiene demasiados watts"],
    fix: "Instalar un disipador o AIO que cubra el TDP del CPU y volver a aplicar pasta térmica.",
    opcionesFix: ["Cambiar por un enfriamiento de mayor capacidad y repetir la pasta", "Añadir otro disco", "Cambiar el monitor", "Reinstalar Windows"],
    teoria: "Si el CPU supera su temperatura crítica, la placa lo apaga para protegerlo. Un enfriamiento por debajo del TDP lo hace en segundos.",
    pista: "Compara el TDP del procesador con lo que puede disipar el enfriamiento que elegiste.",
    accion: { cat: "cooler", unplace: ["paste", "cooler", "aio", "cpuFan"] } }),

  ram_limit: b => ({
    falla: "La placa reconoce menos memoria de la instalada, o no completa el arranque",
    post: { pantalla: "negra; aviso de memoria", beeps: "pitidos cortos repetidos", led: "DRAM (rojo) encendido" },
    causa: `Esta combinación de placa solo admite hasta ${b.mobo.ramMax} GB y se instalaron ${b.ram.gb} GB.`,
    opcionesCausa: [`Se superó el máximo de RAM que admite la placa (${b.mobo.ramMax} GB)`, "El monitor está apagado", "Falta pasta térmica", "El SSD está lleno"],
    fix: "Instalar un kit de RAM dentro del límite de la placa.",
    opcionesFix: ["Cambiar por un kit de menor capacidad", "Cambiar el teclado", "Conectar otro monitor", "Actualizar el navegador"],
    teoria: "Cada placa tiene una capacidad máxima de RAM definida por el chipset y por el número de ranuras. Pasarse puede impedir el arranque.",
    pista: "Mira el máximo de RAM de tu placa en la tienda y compáralo con tu kit.",
    accion: { cat: "ram", unplace: ["ram1", "ram2"] } }),

  no_video: b => ({
    falla: "Todo parece encender, pero no hay imagen",
    post: { pantalla: "sin señal", beeps: "3 pitidos cortos (error de video)", led: "VGA (blanco) fijo" },
    causa: `El ${b.cpu.n} no tiene gráficos integrados y no instalaste tarjeta gráfica.`,
    opcionesCausa: [`El ${b.cpu.n} no tiene iGPU y no hay GPU instalada`, "La RAM es muy lenta", "La fuente es demasiado grande", "Falta el teclado"],
    fix: "Instalar una tarjeta gráfica dedicada.",
    opcionesFix: ["Instalar una tarjeta gráfica", "Cambiar el gabinete", "Añadir más RAM", "Reinstalar el sistema"],
    teoria: "Para tener imagen necesitas una fuente de video: gráficos integrados en el CPU (iGPU) o una GPU dedicada. Algunos procesadores no traen iGPU.",
    pista: "Revisa la ficha de tu procesador: ¿dice que incluye iGPU?",
    accion: { cat: "gpu", unplace: ["monitor"] } }),

  video_port: b => ({
    falla: "POST correcto pero la pantalla dice «Sin señal»",
    post: { pantalla: "Sin señal", beeps: "1 pitido corto (POST OK)", led: "VGA (blanco) parpadea" },
    causa: "El monitor está conectado a la placa teniendo una GPU dedicada instalada.",
    opcionesCausa: ["El monitor está en el puerto de la placa y no en el de la GPU", "El teclado está desconectado", "La fuente es de pocos watts", "El disco está dañado"],
    fix: "Pasar el cable de video a una salida de la tarjeta gráfica.",
    opcionesFix: ["Conectar el monitor a la salida de la GPU", "Cambiar la RAM", "Reinstalar drivers de red", "Cambiar el gabinete"],
    teoria: "Con GPU dedicada, las salidas de video de la placa se desactivan. Hay POST pero «sin señal»: el cable está en el puerto equivocado.",
    pista: "Mira el panel trasero: ¿en qué puerto quedó el cable del monitor?",
    accion: { replug: true, unplace: [] } })
};
/* Orden en que se revisan las fallas (la primera es la que se ve). */
const ORDEN_FALLAS = ["psu_watts", "cooler_tdp", "ram_limit", "no_video", "video_port"];

/* Pistas para los casos de reparación (ids de CASES en datos-repo.js). */
const PISTAS = {
  ram: "Abre la placa y mira las ranuras: ¿los seguros de la RAM están cerrados a ambos lados?",
  cpu: "Mira el cabezal superior izquierdo, junto al VRM: ¿hay un cable conectado?",
  psu: "Revisa el interruptor trasero de la fuente y el conector grande de 24 pines.",
  storage: "Abre el gabinete: ¿llegan cables de datos y de poder al disco?",
  cooling: "Con el equipo apagado, toca el disipador: ¿está flojo? ¿hay pasta térmica?",
  video: "Mira el panel trasero: ¿en qué puerto está el cable del monitor?",
  monitor: "Mira el monitor: ¿está encendido? ¿en qué entrada (source) está?",
  eps: "Revisa el conector EPS: ¿entró hasta el clic en los 8 pines?",
  ok: "Compara los síntomas con un arranque normal."
};

/* ---------- 6 · GLOSARIO ---------- */
const GLOSARIO = [
  { t: "Socket", d: "Zócalo de la placa donde se inserta el procesador. Debe coincidir exactamente (AM4, AM5, LGA1700…)." },
  { t: "Chipset", d: "Conjunto de circuitos de la placa que gestiona PCIe, USB, SATA y define qué CPU y RAM acepta." },
  { t: "Factor de forma", d: "Tamaño estándar de una placa o gabinete: ATX, microATX o Mini-ITX." },
  { t: "TDP", d: "Potencia térmica de diseño: calor (en watts) que el enfriamiento debe poder retirar del CPU." },
  { t: "Throttling", d: "Reducción automática de frecuencia cuando el CPU se calienta demasiado, para protegerse." },
  { t: "VRM", d: "Reguladores de voltaje de la placa que convierten los 12 V del EPS en el voltaje del CPU." },
  { t: "DDR4 / DDR5", d: "Generaciones de memoria RAM. No son intercambiables: la muesca y los pines son distintos." },
  { t: "Dual channel", d: "Uso de dos módulos de RAM en canales separados (A2 y B2) para duplicar el ancho de banda." },
  { t: "iGPU", d: "Gráficos integrados dentro del procesador. Permiten tener imagen sin tarjeta gráfica dedicada." },
  { t: "VRAM", d: "Memoria propia de la tarjeta gráfica, usada para texturas y resolución." },
  { t: "PCIe", d: "Bus de alta velocidad para GPU y SSD NVMe. La ranura x16 es la más larga y es la de la GPU." },
  { t: "NVMe / M.2", d: "SSD que usa el bus PCIe por una ranura M.2. Es mucho más rápido que SATA." },
  { t: "SATA", d: "Interfaz de discos duros y SSD de 2.5\" y 3.5\". Necesita cable de datos y cable de poder." },
  { t: "80 Plus", d: "Certificación de eficiencia de la fuente (Bronze, Gold, Platinum): cuánta energía aprovecha." },
  { t: "EPS 8 pines", d: "Conector de la fuente que alimenta al procesador." },
  { t: "ATX 24 pines", d: "Conector principal de la fuente que alimenta a la placa madre." },
  { t: "F_PANEL", d: "Cabezal de la placa para los botones y LEDs del gabinete. Los LEDs tienen polaridad (+/−)." },
  { t: "POST", d: "Power-On Self Test: autodiagnóstico que hace la placa al encender. Avisa con pitidos, LEDs o mensajes." },
  { t: "BIOS / UEFI", d: "Firmware de la placa que inicializa el hardware y entrega el control al sistema operativo." },
  { t: "Cuello de botella", d: "Componente que limita el rendimiento de los demás para una tarea concreta." },
  { t: "Standoff", d: "Separador metálico que eleva la placa para que no toque la bandeja y evite cortocircuitos." },
  { t: "Pasta térmica", d: "Compuesto que rellena los microporos entre CPU y disipador para transmitir mejor el calor." }
];

/* ---------- 7 · MAPA DE RANURAS DEL GABINETE (lienzo de 760 × 600) ---------- */
const SLOTS = [
  /* pared trasera (izquierda) */
  { id: "fan-rear",   x: 12,  y: 12,  w: 80,  h: 76 },
  { id: "video-mobo", x: 12,  y: 100, w: 80,  h: 40 },
  { id: "usb-rear",   x: 12,  y: 150, w: 80,  h: 26 },
  { id: "usb-rear-2", x: 12,  y: 184, w: 80,  h: 26 },
  { id: "video-gpu",  x: 12,  y: 326, w: 80,  h: 54 },
  /* bandeja y placa */
  { id: "standoffs",  x: 110, y: 90,  w: 300, h: 380 },
  { id: "mobo-tray",  x: 110, y: 90,  w: 300, h: 380 },
  { id: "eps-header", x: 124, y: 100, w: 86,  h: 22 },
  { id: "cpu-fan-header", x: 260, y: 104, w: 60, h: 22 },
  { id: "cpu-socket", x: 160, y: 150, w: 90,  h: 90 },
  { id: "cpu-paste",  x: 183, y: 173, w: 44,  h: 44 },
  { id: "cooler-mount", x: 146, y: 136, w: 118, h: 118 },
  { id: "ram-a1",     x: 280, y: 150, w: 20,  h: 150, decoy: "Esa es la ranura A1. Con dos módulos se usan A2 y B2 (la 2.ª y la 4.ª) para activar el dual channel; con un solo módulo, también va en A2.", label: "A1" },
  { id: "ram-slot-1", x: 304, y: 150, w: 20,  h: 150 },
  { id: "ram-b1",     x: 328, y: 150, w: 20,  h: 150, decoy: "Esa es la ranura B1. Para dual channel usa A2 y B2 (la 2.ª y la 4.ª ranura).", label: "B1" },
  { id: "ram-slot-2", x: 352, y: 150, w: 20,  h: 150 },
  { id: "m2-slot",    x: 160, y: 270, w: 110, h: 22 },
  { id: "pcie-power", x: 296, y: 304, w: 70,  h: 20 },
  { id: "pcie-slot",  x: 134, y: 326, w: 262, h: 54 },
  { id: "pcie-x1",    x: 134, y: 388, w: 150, h: 16, decoy: "Esa es una ranura PCIe x1 (tarjetas pequeñas: red, sonido). La GPU va en la x16, la más larga y cercana al CPU.", label: "PCIe x1" },
  { id: "sata-data",  x: 320, y: 390, w: 76,  h: 26 },
  { id: "atx-header", x: 378, y: 190, w: 24,  h: 130 },
  { id: "audio-header", x: 120, y: 430, w: 50, h: 26 },
  { id: "fp-pwr-sw",  x: 176, y: 430, w: 40,  h: 26 },
  { id: "fp-rst-sw",  x: 220, y: 430, w: 40,  h: 26 },
  { id: "fp-hdd-led", x: 264, y: 430, w: 40,  h: 26 },
  { id: "fp-pwr-led", x: 308, y: 430, w: 40,  h: 26 },
  { id: "usb-header", x: 354, y: 430, w: 46,  h: 26 },
  /* compartimento de la fuente */
  { id: "psu-bay",    x: 110, y: 492, w: 300, h: 92 },
  /* lado derecho: bahías y cables */
  { id: "case-close", x: 440, y: 20,  w: 200, h: 56 },
  { id: "sata-bay",   x: 440, y: 96,  w: 200, h: 60 },
  { id: "hdd-bay",    x: 440, y: 166, w: 200, h: 90 },
  { id: "sata-power", x: 440, y: 266, w: 200, h: 26 },
  { id: "cable-route",x: 440, y: 310, w: 200, h: 56 },
  /* pared frontal (derecha) */
  { id: "fan-front",  x: 664, y: 170, w: 80,  h: 80 }
];
