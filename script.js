/* =====================================================================
   PC BUILDER · SIMULADOR DE ENSAMBLAJE DE COMPUTADORAS
   Proyecto de servicio social · versión comentada para estudiantes
   =====================================================================

   ¿QUÉ ES ESTE ARCHIVO?
   Es toda la lógica (JavaScript) del simulador. El diseño (HTML/CSS) va
   aparte; aquí solo se controla QUÉ pasa cuando el usuario interactúa.

   ---------------------------------------------------------------------
   GUÍA DE LECTURA  (el archivo está dividido en 3 grandes bloques)
   ---------------------------------------------------------------------
   BLOQUE 1 · ENSAMBLAJE (líneas de datos + motor del armado)
     1. components .......... lista de las 38 piezas y sus textos.
     2. Estado y referencias  variables globales + accesos al DOM.
     3. initBuild / renderParts ... dibujar piezas y reiniciar.
     4. Arrastrar y soltar .. mover la pieza y validar dónde se soltó.
     5. installComponent .... "instalar" la pieza y su animación.
     6. Guía / info / UI .... texto de ayuda y barra de progreso.
     7. Explicación contextual  panel de teoría del paso actual.
     8. Helpers ............. funciones cortas de apoyo (dependencias).
     9. Sonido / cámara / encendido / eventos.

   BLOQUE 2 · MÓDULOS DIDÁCTICOS  (una función 'renderX' por módulo)
     · Módulo 1 Teoría   · Módulo 2 Catálogo · Módulo 4 Compatibilidad
     · Módulo 5 Quiz     · Módulo 6 Glosario · Menú principal (tarjetas)

   BLOQUE 3 · MÓDULO 3 Diagnóstico de errores (laboratorio de POST)

   ---------------------------------------------------------------------
   IDEAS CLAVE PARA ENTENDER EL CÓDIGO
   ---------------------------------------------------------------------
   · "placed" es un Set con los id de las piezas ya instaladas. Casi todo
     (progreso, qué sigue, bloqueos) se calcula a partir de ese conjunto.
   · Cada pieza dice de qué otras DEPENDE (dependsOn). Una pieza solo se
     puede instalar si todas sus dependencias ya están en 'placed'.
   · El HTML tiene "slots" (huecos) con data-target; cada pieza tiene un
     'target'. Si el target de la pieza coincide con el del slot, va ahí.
   · Todo se vuelve a dibujar llamando a renderParts()/renderGuide()/
     updateUI() después de cada cambio: es más simple que editar a mano.

   ORDEN DE EJECUCIÓN AL CARGAR:
     setupOrbit() → applyTransform() → tickAuto() → runBoot() → initBuild()
     y, al final, las dos IIFE de módulos + el menú principal.
   ===================================================================== */

/* Cada componente tiene:
     id       identificador único
     name     nombre visible
     short    frase corta para la tarjeta
     type     "tipo" que define su dibujo (clase CSS)
     target   slot del HTML donde debe soltarse
     dependsOn pieza(s) previa(s). Texto, lista, o "group:NOMBRE".
     group    grupo de elección: basta instalar UN miembro (refrigeración).
     info     explicación larga (teoría de la pieza)
     wrong    mensaje si el usuario la suelta en el lugar equivocado */
const components = [
  { id: "standoffs", name: "Separadores (standoffs)",
    short: "Tornillos elevadores de la bandeja.", type: "standoffs", target: "standoffs",
    info: "Los separadores (standoffs) se atornillan en la bandeja del gabinete y elevan la placa madre para que no toque el metal y no haga cortocircuito. Van según el formato ATX.",
    wrong: "Los separadores se atornillan en la bandeja del gabinete, no ahí. Marca primero los agujeros del formato ATX." },

  { id: "mobo", name: "Placa madre ATX",
    short: "Se monta sobre los standoffs.", type: "mobo", target: "mobo-tray", dependsOn: "standoffs",
    info: "La placa madre se apoya sobre los separadores y se atornilla a la bandeja. Es la base donde se conectan todos los demás componentes.",
    wrong: "La placa madre va sobre la bandeja, alineada con los separadores y el I/O shield trasero." },

  { id: "screwMobo", name: "Atornillar la placa madre",
    short: "Fija la placa a los standoffs.", type: "screws", target: "mobo-tray", dependsOn: "mobo",
    info: "Con la placa apoyada sobre los separadores, atorníllala en cada agujero (sin apretar de más). Así queda fija y bien contactada a tierra.",
    wrong: "Estos tornillos fijan la placa madre ya montada sobre la bandeja." },

  { id: "cpu", name: "Procesador (CPU)",
    short: "Va en el socket central.", type: "cpu", target: "cpu-socket", dependsOn: "mobo",
    info: "El CPU es el cerebro de la PC. Levanta la palanca del socket, alinea la flecha/triángulo dorado con el de la placa y déjalo caer por su propio peso. Nunca lo fuerces.",
    wrong: "El procesador sólo entra en el socket central de la placa, alineando el triángulo dorado." },

  { id: "paste", name: "Pasta térmica",
    short: "Un punto sobre el CPU.", type: "paste", target: "cpu-paste", dependsOn: "cpu",
    info: "La pasta térmica mejora la transferencia de calor entre el CPU y el disipador. Aplica un punto del tamaño de un guisante en el centro del procesador.",
    wrong: "La pasta térmica se aplica encima del procesador ya instalado, no en otro lugar." },

  { id: "cooler", name: "Disipador de aire", group: "cooling",
    short: "Opción A · enfría el CPU por aire.", type: "cooler", target: "cooler-mount", dependsOn: "paste",
    info: "OPCIÓN A (aire): el disipador se monta encima del CPU presionando sobre la pasta térmica y se fija con sus sujetadores. Conecta su ventilador al cabezal CPU_FAN. (También puedes elegir refrigeración líquida.)",
    wrong: "El disipador de aire se monta encima del procesador, sobre la pasta térmica." },

  { id: "aio", name: "Refrigeración líquida (AIO)", group: "cooling",
    short: "Opción B · bloque + radiador + tubos.", type: "aio", target: "cooler-mount", dependsOn: "paste",
    info: "OPCIÓN B (líquida/AIO): el bloque con la bomba se monta encima del CPU (sobre la pasta) y el radiador con sus ventiladores se fija arriba o al frente del gabinete; los tubos llevan el líquido entre ambos. Elige aire O líquida, no las dos.",
    wrong: "El bloque/bomba de la refrigeración líquida va encima del CPU (mismo lugar que el cooler)." },

  { id: "cpuFan", name: "Conectar ventilador (CPU_FAN)",
    short: "Cable del disipador al pin CPU_FAN.", type: "cable-fan", target: "cpu-fan-header", dependsOn: "group:cooling",
    info: "El ventilador del disipador (o la bomba del AIO) se conecta al cabezal CPU_FAN de la placa, junto al socket. Así la placa controla las RPM y detecta la refrigeración al arrancar.",
    wrong: "El conector del ventilador va en el cabezal CPU_FAN, junto al socket del procesador." },

  { id: "ram1", name: "Memoria RAM (A2)",
    short: "Primer módulo.", type: "ram", target: "ram-slot-1", dependsOn: "mobo",
    info: "La RAM guarda datos temporales. Abre los seguros, alinea la muesca y presiona hasta oír el clic en ambos extremos.",
    wrong: "La memoria RAM sólo encaja en las ranuras largas verticales junto al CPU." },

  { id: "ram2", name: "Memoria RAM (B2)",
    short: "Segundo módulo (dual channel).", type: "ram", target: "ram-slot-2", dependsOn: "ram1",
    info: "Usar dos módulos en las ranuras A2/B2 activa el dual channel y mejora el ancho de banda.",
    wrong: "El segundo módulo va en la otra ranura larga (B2) para activar dual channel." },

  { id: "m2", name: "SSD M.2 NVMe",
    short: "Almacenamiento rápido en la placa.", type: "m2", target: "m2-slot", dependsOn: "mobo",
    info: "El SSD M.2 se inserta en ángulo en su ranura, se baja y se fija con un tornillo. Es el almacenamiento más rápido.",
    wrong: "El SSD M.2 sólo entra en su ranura horizontal pequeña sobre la placa." },

  { id: "psu", name: "Fuente de poder (PSU)",
    short: "Se coloca en el gabinete.", type: "psu", target: "psu-bay", dependsOn: "mobo",
    info: "La fuente de poder entrega energía a todo el sistema. Se coloca en su compartimento inferior del gabinete.",
    wrong: "La fuente de poder va en su compartimento inferior del gabinete (PSU shroud)." },

  { id: "screwPsu", name: "Atornillar la fuente",
    short: "Fija la PSU al chasis.", type: "screws", target: "psu-bay", dependsOn: "psu",
    info: "La fuente se atornilla por la parte trasera del gabinete con 4 tornillos para que quede firme.",
    wrong: "Estos tornillos fijan la fuente por la parte trasera del gabinete." },

  { id: "ssd", name: "SSD SATA 2.5\"",
    short: "Unidad de 2.5 pulgadas.", type: "ssd", target: "sata-bay", dependsOn: "psu",
    info: "El SSD SATA de 2.5\" se coloca en su bahía. Después se conecta con cable de datos SATA y alimentación SATA desde la fuente.",
    wrong: "El SSD de 2.5\" va en la bahía pequeña de discos del gabinete." },

  { id: "hdd", name: "Disco duro 3.5\"",
    short: "Almacenamiento mecánico.", type: "hdd", target: "hdd-bay", dependsOn: "psu",
    info: "El disco duro de 3.5\" se monta en la jaula de discos. Vibra, así que conviene atornillarlo bien. Usa cable de datos y alimentación SATA.",
    wrong: "El disco duro de 3.5\" va en la bahía/jaula grande del gabinete." },

  { id: "screwDrives", name: "Atornillar los discos",
    short: "Fija SSD y HDD en sus bahías.", type: "screws", target: "hdd-bay", dependsOn: ["ssd", "hdd"],
    info: "Atornilla cada disco en su bahía para que no vibre ni se mueva. El HDD especialmente, porque tiene partes móviles.",
    wrong: "Estos tornillos fijan los discos en sus bahías del gabinete." },

  { id: "gpu", name: "Tarjeta gráfica (GPU)",
    short: "Va en el PCIe x16.", type: "gpu", target: "pcie-slot", dependsOn: "mobo",
    info: "La GPU se inserta en la ranura PCIe x16 superior hasta oír el clic del seguro. Procesa gráficos y videojuegos.",
    wrong: "La tarjeta gráfica sólo encaja en la ranura larga PCIe x16." },

  { id: "screwGpu", name: "Atornillar la GPU",
    short: "Fija la GPU al chasis.", type: "screws", target: "pcie-slot", dependsOn: "gpu",
    info: "Una vez encajada en el PCIe, atornilla la GPU al chasis por su bracket para que no cuelgue ni se afloje.",
    wrong: "Este tornillo fija la tarjeta gráfica al chasis, sobre su bracket." },

  { id: "fanFront", name: "Ventilador frontal",
    short: "Entrada de aire (intake).", type: "fan", target: "fan-front", dependsOn: "mobo",
    info: "El ventilador frontal empuja aire fresco hacia dentro (intake). Fíjate en la flecha de dirección y conéctalo a un cabezal SYS_FAN.",
    wrong: "Este ventilador va en el frente del gabinete, como entrada de aire." },

  { id: "fanRear", name: "Ventilador trasero",
    short: "Salida de aire (exhaust).", type: "fan", target: "fan-rear", dependsOn: "mobo",
    info: "El ventilador trasero expulsa el aire caliente (exhaust). Junto con el frontal crea un flujo frontal→trasero.",
    wrong: "Este ventilador va en la parte trasera del gabinete, como salida de aire." },

  { id: "screwFans", name: "Atornillar los ventiladores",
    short: "Fija los ventiladores al gabinete.", type: "screws", target: "fan-front", dependsOn: ["fanFront", "fanRear"],
    info: "Cada ventilador se fija con 4 tornillos largos al gabinete para que no vibre.",
    wrong: "Estos tornillos fijan los ventiladores al gabinete." },

  { id: "eps", name: "Cable EPS CPU (8-pin)",
    short: "Alimenta el procesador.", type: "cable-eps", target: "eps-header", dependsOn: "psu",
    info: "El conector EPS de 8 pines alimenta al CPU. Va en el cabezal de la esquina superior izquierda de la placa, cerca del VRM.",
    wrong: "El cable EPS de 8 pines del CPU va en el cabezal superior izquierdo de la placa." },

  { id: "atx", name: "Cable ATX 24-pin",
    short: "Alimenta la placa madre.", type: "cable-atx", target: "atx-header", dependsOn: "psu",
    info: "El conector ATX de 24 pines es la alimentación principal de la placa. Va en el cabezal vertical del borde derecho.",
    wrong: "El cable ATX de 24 pines va en el conector vertical grande del borde derecho de la placa." },

  { id: "pcie", name: "Cable PCIe (GPU)",
    short: "Energía extra para la GPU.", type: "cable-pcie", target: "pcie-power", dependsOn: ["gpu", "psu"],
    info: "El cable PCIe (6+2 pines) entrega energía adicional a la tarjeta gráfica desde la fuente.",
    wrong: "El cable PCIe alimenta la GPU; va en los conectores de energía de la tarjeta gráfica." },

  { id: "sataData", name: "Cable SATA de datos",
    short: "Conecta el disco a la placa.", type: "cable-sata-data", target: "sata-data", dependsOn: "ssd",
    info: "El cable plano SATA lleva los datos del disco a un puerto SATA de la placa madre.",
    wrong: "El cable de datos SATA conecta el disco con un puerto SATA de la placa." },

  { id: "sataPower", name: "Cable SATA de poder",
    short: "Alimenta los discos.", type: "cable-sata-power", target: "sata-power", dependsOn: ["ssd", "psu"],
    info: "El conector de alimentación SATA viene de la fuente y entrega energía a los discos SATA.",
    wrong: "El cable de alimentación SATA va de la fuente hacia los discos." },

  { id: "pwrSw", name: "Power SW (F_PANEL)",
    short: "Botón de encendido del gabinete.", type: "fp-pin", target: "fp-pwr-sw", dependsOn: "mobo",
    info: "Power SW conecta el botón de encendido del gabinete al cabezal F_PANEL. Es un interruptor: no tiene polaridad, cualquier orientación funciona.",
    wrong: "El Power SW va en su par de pines del cabezal F_PANEL (esquina inferior de la placa)." },

  { id: "rstSw", name: "Reset SW (F_PANEL)",
    short: "Botón de reinicio.", type: "fp-pin", target: "fp-rst-sw", dependsOn: "mobo",
    info: "Reset SW conecta el botón de reinicio del gabinete. También es un interruptor, sin polaridad.",
    wrong: "El Reset SW va en su par de pines del cabezal F_PANEL." },

  { id: "hddLed", name: "HDD LED (F_PANEL) +/−",
    short: "LED de actividad del disco (con polaridad).", type: "fp-pin", target: "fp-hdd-led", dependsOn: "mobo",
    info: "HDD LED se enciende al leer/escribir en los discos. Es un LED: SÍ tiene polaridad; el pin + (positivo, cable de color) debe ir en su sitio o no encenderá.",
    wrong: "El HDD LED va en su par de pines del F_PANEL respetando la polaridad (+/−)." },

  { id: "pwrLed", name: "Power LED (F_PANEL) +/−",
    short: "LED de encendido (con polaridad).", type: "fp-pin", target: "fp-pwr-led", dependsOn: "mobo",
    info: "Power LED indica que la PC está encendida. También es un LED con polaridad: respeta el pin + (positivo).",
    wrong: "El Power LED va en su par de pines del F_PANEL respetando la polaridad (+/−)." },

  { id: "usbFront", name: "USB frontal",
    short: "Cabezal USB del gabinete.", type: "usbf", target: "usb-header", dependsOn: "mobo",
    info: "El cable de USB frontal del gabinete se conecta a su cabezal USB en la placa (USB 2.0, 3.0 de 19 pines o USB-C).",
    wrong: "El USB frontal va al cabezal USB de la placa, no ahí." },

  { id: "audioFront", name: "Audio frontal",
    short: "Cabezal HD Audio (AAFP).", type: "audiof", target: "audio-header", dependsOn: "mobo",
    info: "El cable de audio frontal se conecta al cabezal HD Audio (AAFP), normalmente en la esquina inferior izquierda de la placa.",
    wrong: "El audio frontal va al cabezal HD Audio (AAFP) de la placa." },

  { id: "manage", name: "Administrar cableado",
    short: "Ordena los cables por detrás.", type: "manage", target: "cable-route", dependsOn: ["atx", "eps", "sataPower"],
    info: "Pasa los cables por detrás de la bandeja y sujétalos con cinchos. Un buen cable management mejora el flujo de aire y la estética antes de cerrar.",
    wrong: "El cable management se hace por detrás de la bandeja, organizando todos los cables." },

  { id: "sidePanel", name: "Panel lateral",
    short: "Coloca el panel del gabinete.", type: "sidepanel", target: "case-close", dependsOn: "manage",
    info: "Con todo conectado y ordenado, coloca el panel lateral en su sitio.",
    wrong: "El panel lateral se coloca al final, cuando ya está todo conectado y ordenado." },

  { id: "screwPanel", name: "Atornillar el panel lateral",
    short: "Cierre final del gabinete.", type: "screws", target: "case-close", dependsOn: "sidePanel",
    info: "Atornilla el panel lateral para cerrar el gabinete. ¡La PC está lista para encender!",
    wrong: "Estos tornillos cierran y fijan el panel lateral del gabinete." },

  /* ---------- Periféricos (antes iban en un módulo aparte) ---------- */
  { id: "keyboard", name: "Teclado",
    short: "Dispositivo de entrada · USB.", type: "keyboard", target: "usb-rear", dependsOn: "screwPanel",
    info: "El teclado es un dispositivo de ENTRADA: convierte tus pulsaciones en datos que el CPU procesa. Se conecta a cualquier puerto USB del panel trasero (o frontal). No necesita controladores especiales para funcionar en el arranque.",
    wrong: "El teclado se conecta a un puerto USB del panel trasero del gabinete." },

  { id: "mouse", name: "Mouse",
    short: "Dispositivo de entrada · USB.", type: "mouse", target: "usb-rear-2", dependsOn: "keyboard",
    info: "El mouse también es un dispositivo de ENTRADA. Se conecta a otro puerto USB libre del panel trasero. Junto con el teclado permite operar el sistema desde el primer arranque.",
    wrong: "El mouse se conecta a otro puerto USB libre del panel trasero." },

  { id: "monitor", name: "Monitor",
    short: "Salida de video · ¡cuidado dónde lo conectas!", type: "monitor", target: "video-gpu", dependsOn: ["mouse", "gpu"],
    info: "El monitor es un dispositivo de SALIDA. Como este equipo tiene tarjeta gráfica dedicada, el cable debe ir a una salida de la GPU (parte baja del panel trasero). Si se conecta al puerto de video de la placa madre, el monitor no recibirá señal.",
    wrong: "El monitor va conectado a una salida de video de la tarjeta gráfica, en la parte baja del panel trasero." }
];

/* Numeración automática de pasos (los del mismo grupo comparten número). */
(function () {
  let n = 0; const grupos = {};
  components.forEach(c => {
    if (c.group) { if (grupos[c.group] == null) grupos[c.group] = ++n; c.step = grupos[c.group]; }
    else c.step = ++n;
  });
})();

/* ---------- Estado del ensamble ---------- */
let selectedId = null;
let placed = new Set();
/* Orden MEZCLADO de las piezas, para que el alumno piense cuál va
   y no siga la lista en orden. Se mezcla una vez al cargar. */
let partsOrder = components.slice();
for (let i = partsOrder.length - 1; i > 0; i--) {
  const j = (Math.random() * (i + 1)) | 0;
  [partsOrder[i], partsOrder[j]] = [partsOrder[j], partsOrder[i]];
}

/* ---------- Referencias del DOM ---------- */
const partsList     = document.getElementById("partsList");
const progressLabel = document.getElementById("progressLabel");
const progressBar   = document.getElementById("progressBar");
const phaseText     = document.getElementById("phaseText");
const infoBox       = document.getElementById("componentInfo");
const stepGuide     = document.getElementById("stepGuide");
const highlightBtn  = document.getElementById("highlightBtn");
const resetBtn      = document.getElementById("resetBtn");
const toast         = document.getElementById("toast");

const pcCase        = document.getElementById("pcCase");
const motherboard   = document.getElementById("motherboard");
const boardScene    = document.getElementById("boardScene");
const powerBtn      = document.getElementById("powerBtn");
const poweredBadge  = document.getElementById("poweredBadge");
const autoBtn       = document.getElementById("autoBtn");
const layersBtn     = document.getElementById("layersBtn");
const centerBtn     = document.getElementById("centerBtn");
const soundBtn      = document.getElementById("soundBtn");
const confettiCanvas= document.getElementById("confetti");
const bootScreen    = document.getElementById("bootScreen");
const bootFill      = document.getElementById("bootFill");
const bootLog       = document.getElementById("bootLog");
const sidePanelGlass= document.getElementById("sidePanelGlass");

const errorModal = document.getElementById("errorModal");
const errorTitle = document.getElementById("errorTitle");
const errorBody  = document.getElementById("errorBody");
const errorClose = document.getElementById("errorClose");

const specModal  = document.getElementById("specModal");
const specTitle  = document.getElementById("specTitle");
const specRole   = document.getElementById("specRole");
const specBody   = document.getElementById("specBody");
const specExtra  = document.getElementById("specExtra");
const specVisual = document.getElementById("specVisual");
const specClose  = document.getElementById("specClose");

/* Elementos del panel de explicación contextual (pueden no existir) */
const learnPanel = document.getElementById("learnPanel");
const bubble     = document.getElementById("instructionBubble");
const catIndex   = document.getElementById("catIndex");

/* ---------- Etiquetas de cada slot ---------- */
const SLOT_LABELS = {
  "standoffs": "STANDOFFS", "mobo-tray": "PLACA MADRE",
  "cpu-socket": "CPU SOCKET", "cpu-paste": "PASTA", "cooler-mount": "COOLER",
  "ram-slot-1": "RAM A2", "ram-slot-2": "RAM B2", "m2-slot": "M.2 NVMe",
  "pcie-slot": "PCIe x16", "psu-bay": "FUENTE (PSU)",
  "sata-bay": "BAHÍA 2.5\"", "hdd-bay": "BAHÍA 3.5\"",
  "fan-front": "VENT. FRONTAL", "fan-rear": "VENT. TRASERO",
  "eps-header": "EPS 8-PIN", "atx-header": "24-PIN", "pcie-power": "PCIe PWR",
  "sata-data": "SATA DATOS", "sata-power": "SATA PWR", "cpu-fan-header": "CPU_FAN",
  "fp-pwr-sw": "POWER SW", "fp-rst-sw": "RESET SW",
  "fp-hdd-led": "HDD LED +/−", "fp-pwr-led": "POWER LED +/−",
  "usb-header": "USB FRONTAL", "audio-header": "AUDIO FRONTAL",
  "cable-route": "ORGANIZAR CABLES", "case-close": "PANEL LATERAL",
  "usb-rear": "USB 1", "usb-rear-2": "USB 2", "video-gpu": "VIDEO GPU", "video-mobo": "VIDEO PLACA"
};

/* Qué pieza pertenece a cada slot (para avisar cuando se equivocan de lugar) */
const TARGET_TO_NAME = {};
components.forEach(c => { if (!TARGET_TO_NAME[c.target]) TARGET_TO_NAME[c.target] = c.name; });

/* Dato extra del chipset, se muestra en la ficha de placa y CPU */
const CHIPSET = {
  name: "AMD X570",
  note: "Dato extra — Chipset AMD X570: es el 'centro de comunicaciones' de la placa. Gestiona las líneas PCIe 4.0 (para GPU y SSD M.2 de alta velocidad), los puertos SATA y USB, y permite overclocking en CPUs Ryzen con socket AM4. Un chipset superior ofrece más líneas PCIe y conectividad; uno básico (como A520/B550) recorta algunas."
};

/* ---------- Ficha técnica de cada pieza (pares [etiqueta, valor]) ---------- */
const SPECS = {
  standoffs: [["Material", "Latón niquelado"], ["Rosca", "#6-32 / M3"], ["Altura", "~6 mm"], ["Función", "Aislar y elevar la placa"]],
  mobo: [["Formato", "ATX"], ["Socket", "AM4"], ["Chipset", "X570"], ["Memoria", "4× DDR4 (dual channel)"], ["Expansión", "PCIe 4.0 x16"]],
  cpu: [["Socket", "AM4"], ["Núcleos / hilos", "8 / 16"], ["Frecuencia", "3.8–4.7 GHz"], ["Caché L3", "32 MB"], ["TDP", "105 W"]],
  paste: [["Tipo", "Pasta térmica (no conductora)"], ["Conductividad", "~8.5 W/mK"], ["Cantidad", "Tamaño de un guisante"], ["Función", "Rellenar microporos CPU–disipador"]],
  cooler: [["Tipo", "Aire (torre)"], ["Disipación", "hasta ~200 W TDP"], ["Ventilador", "120 mm PWM"], ["Conector", "CPU_FAN 4-pin"]],
  aio: [["Tipo", "Líquida AIO"], ["Radiador", "240 mm"], ["Ventiladores", "2× 120 mm"], ["Bomba", "Integrada en el bloque"], ["Conector", "CPU_FAN / AIO_PUMP"]],
  ram1: [["Tipo", "DDR4"], ["Capacidad", "8 GB"], ["Velocidad", "3200 MHz"], ["Ranura", "A2"], ["Modo", "Dual channel (con B2)"]],
  ram2: [["Tipo", "DDR4"], ["Capacidad", "8 GB"], ["Velocidad", "3200 MHz"], ["Ranura", "B2"], ["Modo", "Dual channel (con A2)"]],
  m2: [["Interfaz", "PCIe 4.0 x4 NVMe"], ["Formato", "M.2 2280"], ["Capacidad", "1 TB"], ["Lectura", "~7000 MB/s"]],
  psu: [["Potencia", "650 W"], ["Certificación", "80+ Bronze"], ["Cableado", "Semi-modular"], ["Conectores", "ATX / EPS / PCIe / SATA"]],
  ssd: [["Interfaz", "SATA III (6 Gb/s)"], ["Formato", "2.5\""], ["Capacidad", "1 TB"], ["Velocidad", "~550 MB/s"]],
  hdd: [["Interfaz", "SATA III"], ["Formato", "3.5\""], ["Capacidad", "2 TB"], ["Velocidad", "7200 RPM"]],
  gpu: [["Interfaz", "PCIe 4.0 x16"], ["VRAM", "8 GB GDDR6"], ["Alimentación", "8-pin PCIe"], ["Salidas", "HDMI 2.1 / DisplayPort"]],
  fanFront: [["Tamaño", "120 mm"], ["Conector", "4-pin PWM"], ["Flujo", "Entrada (intake)"], ["Posición", "Frontal"]],
  fanRear: [["Tamaño", "120 mm"], ["Conector", "4-pin PWM"], ["Flujo", "Salida (exhaust)"], ["Posición", "Trasera"]],
  eps: [["Conector", "EPS 8-pin (4+4)"], ["Voltaje", "12 V"], ["Alimenta", "CPU (VRM)"], ["Cabezal", "Esquina superior izquierda"]],
  atx: [["Conector", "ATX 24-pin (20+4)"], ["Voltaje", "3.3 / 5 / 12 V"], ["Alimenta", "Placa madre"], ["Cabezal", "Borde derecho"]],
  pcie: [["Conector", "PCIe 6+2 pin"], ["Voltaje", "12 V"], ["Alimenta", "Tarjeta gráfica"]],
  sataData: [["Cable", "SATA de datos"], ["Ancho de banda", "6 Gb/s"], ["Alimenta", "No (solo datos)"], ["Conecta", "Disco → placa"]],
  sataPower: [["Conector", "SATA power 15-pin"], ["Voltaje", "3.3 / 5 / 12 V"], ["Origen", "Fuente"], ["Alimenta", "Discos SATA"]],
  cpuFan: [["Conector", "3/4-pin PWM"], ["Cabezal", "CPU_FAN"], ["Función", "Controla las RPM del disipador"], ["Ubicación", "Junto al socket"]],
  pwrSw: [["Tipo", "Interruptor"], ["Cabezal", "F_PANEL"], ["Polaridad", "No aplica"], ["Función", "Encender la PC"]],
  rstSw: [["Tipo", "Interruptor"], ["Cabezal", "F_PANEL"], ["Polaridad", "No aplica"], ["Función", "Reiniciar la PC"]],
  hddLed: [["Tipo", "LED"], ["Cabezal", "F_PANEL"], ["Polaridad", "Sí (+ / −)"], ["Función", "Actividad de disco"]],
  pwrLed: [["Tipo", "LED"], ["Cabezal", "F_PANEL"], ["Polaridad", "Sí (+ / −)"], ["Función", "Indicador de encendido"]],
  usbFront: [["Cabezal", "USB frontal"], ["Estándar", "USB 3.0 (19-pin) / USB-C"], ["Origen", "Panel del gabinete"]],
  audioFront: [["Cabezal", "HD Audio (AAFP)"], ["Función", "Audio del panel frontal"], ["Posición", "Inferior izquierda"]],
  manage: [["Tarea", "Cable management"], ["Dónde", "Detrás de la bandeja"], ["Beneficio", "Mejor flujo de aire y estética"]],
  sidePanel: [["Pieza", "Panel lateral"], ["Material", "Cristal templado"], ["Cierre", "Tornillos de mano"]],
  keyboard: [["Tipo", "Dispositivo de entrada"], ["Interfaz", "USB / inalámbrico"], ["Formato", "104 teclas"], ["Función", "Introducir datos y comandos"]],
  mouse: [["Tipo", "Dispositivo de entrada"], ["Interfaz", "USB / inalámbrico"], ["Sensor", "Óptico 1600 DPI"], ["Función", "Señalar y seleccionar"]],
  monitor: [["Tipo", "Dispositivo de salida"], ["Conexión", "HDMI / DisplayPort"], ["Resolución", "1920×1080"], ["Se conecta a", "La GPU dedicada, no a la placa"]]
};

/* ---------- Cámara / vista 3D ---------- */
const PRESETS = {
  iso: [57, -33, 0.62], top: [0, 0, 0.68], left: [55, -62, 0.60],
  right: [55, -10, 0.60], rear: [55, 150, 0.60], internal: [22, -33, 0.78]
};
let rotX = 57, rotZ = -33, zoom = 0.62, panX = -200, panY = 0;
let autoOn = false, exploded = false, draggingBoard = false, panningBoard = false;
if (window.innerWidth <= 1220) zoom = 0.5;
if (window.innerWidth <= 720) zoom = 0.42;

/* =================================================================
   INICIO / REINICIO
   ================================================================= */
function initBuild() {
  selectedId = null;
  placed = new Set();

  pcCase.classList.remove("cpu-ready", "powered", "exploded", "xray", "liquid-cooling",
    "igniting", "lit-fans", "lit-ram", "lit-gpu");
  boardScene.classList.remove("power-dim");
  exploded = false;
  if (layersBtn) layersBtn.classList.remove("active");
  if (powerBtn) powerBtn.hidden = true;
  if (poweredBadge) poweredBadge.hidden = true;

  motherboard.classList.add("not-mounted");
  motherboard.classList.remove("screwing");
  const rad = document.getElementById("aioRadiator");
  if (rad) rad.remove();
  if (sidePanelGlass) { sidePanelGlass.hidden = true; sidePanelGlass.classList.remove("show"); }

  document.querySelectorAll(".slot").forEach(slot => {
    const t = slot.dataset.target;
    slot.innerHTML = `<span>${SLOT_LABELS[t] || t}</span>`;
    delete slot.dataset.installedId;
    slot.classList.remove("correct-flash", "wrong-flash", "next-step",
      "drop-ready", "drop-wrong", "occupied", "installing", "screwed", "inspecting");
  });

  renderParts();
  renderGuide();
  updateUI();
  showDefaultInfo();
  showToast("Banco de trabajo listo. Empieza colocando los separadores (standoffs).");
}

/* =================================================================
   PIEZAS DISPONIBLES (columna de tarjetas)
   ================================================================= */
function renderParts() {
  partsList.innerHTML = "";
  const currentId = getCurrentComponentId();

  partsOrder.forEach(component => {
    const done = placed.has(component.id);
    const skipped = !done && component.group && groupSatisfied(component.group);
    const available = depsMet(component);

    const card = document.createElement("div");
    card.className = "part-card";
    card.dataset.id = component.id;

    if (done) card.classList.add("is-done");
    else if (skipped) card.classList.add("skipped");
    else if (!available) card.classList.add("locked");
    //if (!done && !skipped && component.id === currentId) card.classList.add("current-part");

    const stepN = document.createElement("span");
    stepN.className = "step-n";
    stepN.textContent = "Paso " + component.step;

    const visualWrap = document.createElement("div");
    visualWrap.className = "part-visual";
    visualWrap.appendChild(createVisual(component.type));

    const text = document.createElement("div");
    text.innerHTML = `<h3>${component.name}</h3><p>${component.short}</p>`;

    card.appendChild(stepN);
    card.appendChild(visualWrap);
    card.appendChild(text);

    card.addEventListener("click", () => selectComponent(component.id));
    card.addEventListener("pointerdown", event => startDrag(event, component.id, card));

    partsList.appendChild(card);
  });
}

/* Devuelve el "dibujo" de cada tipo de pieza (una clase CSS). */
function createVisual(type) {
  const clases = {
    standoffs: "standoffs-visual", mobo: "mobo-visual", cpu: "cpu-visual",
    paste: "paste-visual", cooler: "cooler-visual", aio: "aio-visual",
    ram: "ram-visual", m2: "m2-visual", psu: "psu-visual",
    ssd: "ssd-visual", hdd: "hdd-visual", gpu: "gpu-visual", fan: "fan-visual",
    screws: "screws-visual",
    "cable-eps": "cable-eps-visual", "cable-atx": "cable-atx-visual",
    "cable-pcie": "cable-pcie-visual", "cable-sata-data": "cable-sata-data-visual",
    "cable-sata-power": "cable-sata-power-visual", manage: "cable-sata-power-visual",
    "fp-pin": "fp-pin-visual", "cable-fan": "cable-fan-visual",
    usbf: "usbf-visual", audiof: "audiof-visual", sidepanel: "sidepanel-visual",
    monitor: "monitor-visual", keyboard: "keyboard-visual", mouse: "mouse-visual"
  };
  const el = document.createElement("div");
  el.className = clases[type] || "ssd-visual";
  return el;
}

/* =================================================================
   ARRASTRAR Y SOLTAR
   ================================================================= */
function startDrag(event, componentId, card) {
  const component = getComponent(componentId);

  if (placed.has(componentId)) { selectComponent(componentId); return; }
  if (component.group && groupSatisfied(component.group)) {
    selectComponent(componentId);
    showToast("Ya elegiste la otra opción de refrigeración. Reinicia el montaje si quieres cambiarla.");
    return;
  }
  if (!depsMet(component)) {
    selectComponent(componentId);
    showToast("Aún no toca esta pieza. " + nextPendingDepText(component));
    return;
  }
  if (event.button !== undefined && event.button !== 0) return;

  event.preventDefault();
  selectComponent(componentId);
  card.classList.add("dragging-card");

  const ghost = document.createElement("div");
  ghost.className = "drag-ghost";
  ghost.appendChild(createVisual(component.type));
  document.body.appendChild(ghost);

  moveGhost(ghost, event.clientX, event.clientY);
  updateDropPreview(component, event.clientX, event.clientY);

  function onMove(e) {
    moveGhost(ghost, e.clientX, e.clientY);
    updateDropPreview(component, e.clientX, e.clientY);
  }
  function onUp(e) {
    document.removeEventListener("pointermove", onMove);
    document.removeEventListener("pointerup", onUp);
    ghost.remove();
    card.classList.remove("dragging-card");
    clearDropPreview();
    checkDrop(component, e.clientX, e.clientY);
  }
  document.addEventListener("pointermove", onMove);
  document.addEventListener("pointerup", onUp);
}

function moveGhost(ghost, x, y) { ghost.style.left = x + "px"; ghost.style.top = y + "px"; }

function checkDrop(component, x, y) {
  // Trampa didáctica del monitor: si lo sueltan en el video de la PLACA (teniendo GPU)
  if (component.id === "monitor" && depsMet(component)) {
    const trampa = document.querySelector('.slot[data-target="video-mobo"]');
    if (trampa && isPointInsideSlot(x, y, trampa, 34)) {
      flashWrong(trampa);
      showError("Ese puerto no dará imagen",
        "Conectaste el monitor al puerto de video de la placa madre. Como el equipo tiene una tarjeta gráfica dedicada, la placa desactiva su salida y toda la imagen pasa por la GPU: el monitor se quedaría en negro con el aviso «sin señal». Los puertos de video de la placa solo funcionan cuando el procesador tiene gráficos integrados. Conecta el cable a una salida de la tarjeta gráfica, en la parte baja del panel trasero.");
      return;
    }
  }

  const targetSlot = getTargetSlot(component);

  if (!depsMet(component)) { showError("Falta un paso previo", nextPendingDepText(component)); return; }

  if (targetSlot && isPointInsideSlot(x, y, targetSlot, getTolerance(component))) {
    installComponent(component, targetSlot);
    return;
  }

  const nearest = getNearestSlot(x, y);
  if (nearest) {
    flashWrong(nearest);
    const nt = nearest.dataset.target;
    const belongsTo = TARGET_TO_NAME[nt];
    let extra = "";
    if (belongsTo && belongsTo !== component.name) extra = ` Ese lugar (${SLOT_LABELS[nt] || nt}) es para: ${belongsTo}.`;
    showError("Esa pieza no va ahí", component.wrong + extra);
  } else {
    showError("Fuera de lugar", component.wrong + " Acerca el centro de la pieza al slot correcto resaltado.");
  }
}

function getTargetSlot(component) {
  return document.querySelector(`.slot[data-target="${component.target}"]`);
}

/* Margen de acierto al soltar (los periféricos son finos porque los puertos están juntos) */
function getTolerance(component) {
  const tol = {
    standoffs: 90, mobo: 90, cpu: 55, paste: 50, cooler: 75, aio: 75,
    ram: 75, m2: 60, gpu: 75, psu: 75, ssd: 65, hdd: 70, fan: 75, screws: 70,
    "cable-eps": 60, "cable-atx": 60, "cable-pcie": 60,
    "cable-sata-data": 60, "cable-sata-power": 60,
    "fp-pin": 46, "cable-fan": 50, usbf: 55, audiof: 55, manage: 80, sidepanel: 100,
    monitor: 30, keyboard: 30, mouse: 30
  };
  return tol[component.type] || 65;
}

/* ¿El punto (x,y) donde solté cae dentro (o cerca) del slot?
   Tomamos el rectángulo del slot en pantalla y le sumamos un margen
   ('tolerance') para que no haya que apuntar con precisión perfecta. */
function isPointInsideSlot(x, y, slot, tolerance) {
  const r = slot.getBoundingClientRect();
  return x >= r.left - tolerance && x <= r.right + tolerance &&
         y >= r.top - tolerance && y <= r.bottom + tolerance;
}

/* Devuelve el slot MÁS CERCANO al punto donde se soltó (para poder
   avisar "esa pieza no va en ese hueco"). Calcula la distancia al centro
   de cada slot y se queda con la menor, si está a menos de 200px. */
function getNearestSlot(x, y) {
  const slots = [...document.querySelectorAll(".slot")].filter(s => {
    const r = s.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });
  let nearest = null, best = Infinity;
  slots.forEach(slot => {
    const r = slot.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const d = Math.hypot(x - cx, y - cy);
    if (d < best) { best = d; nearest = slot; }
  });
  return best < 200 ? nearest : null;
}

function updateDropPreview(component, x, y) {
  clearDropPreview();
  const targetSlot = getTargetSlot(component);
  if (targetSlot && isPointInsideSlot(x, y, targetSlot, getTolerance(component))) {
    targetSlot.classList.add("drop-ready");
    return;
  }
  const nearest = getNearestSlot(x, y);
  if (nearest) nearest.classList.add("drop-wrong");
}

function clearDropPreview() {
  document.querySelectorAll(".slot").forEach(s => s.classList.remove("drop-ready", "drop-wrong"));
}

/* =================================================================
   INSTALACIÓN (con su animación de encaje)
   ================================================================= */
function installComponent(component, slot) {
  if (placed.has(component.id)) return;

  if (component.type === "screws") {
    const tool = document.createElement("div");
    tool.className = "tool-screwdriver";
    tool.innerHTML = "<span class='sd-handle'></span><span class='sd-shaft'></span><span class='sd-tip'></span>";
    slot.appendChild(tool);
    setTimeout(() => tool.remove(), 900);

    if (component.id === "screwMobo") {
      motherboard.classList.add("screwing");
      setTimeout(() => motherboard.classList.remove("screwing"), 850);
    } else {
      const marks = document.createElement("div");
      marks.className = "screw-marks tightening";
      marks.innerHTML = "<i></i><i></i><i></i><i></i>";
      slot.appendChild(marks);
      setTimeout(() => marks.classList.remove("tightening"), 850);
    }
    slot.classList.add("screwed");

  } else if (component.target === "mobo-tray") {
    motherboard.classList.remove("not-mounted");
    slot.dataset.installedId = component.id;
    slot.classList.add("occupied", "correct-flash");
    setTimeout(() => slot.classList.remove("correct-flash"), 700);

  } else if (component.target === "case-close") {
    slot.dataset.installedId = component.id;
    slot.classList.add("occupied", "correct-flash");
    setTimeout(() => slot.classList.remove("correct-flash"), 700);
    if (sidePanelGlass) { sidePanelGlass.hidden = false; sidePanelGlass.classList.add("show"); }

  } else {
    const installed = document.createElement("div");
    installed.className = "installed-component";
    installed.appendChild(createVisual(component.type));
    slot.innerHTML = "";
    slot.appendChild(installed);
    slot.dataset.installedId = component.id;
    slot.classList.add("occupied", "correct-flash", "installing");
    setTimeout(() => slot.classList.remove("installing"), 650);
    setTimeout(() => slot.classList.remove("correct-flash"), 700);

    if (component.id === "aio") {
      pcCase.classList.add("liquid-cooling");
      if (!document.getElementById("aioRadiator")) {
        const r = document.createElement("div");
        r.id = "aioRadiator";
        r.className = "aio-radiator";
        r.innerHTML = "<div class='aio-fan'></div><div class='aio-fan'></div><div class='aio-fan'></div>" +
          "<span class='aio-tube tube-a'></span><span class='aio-tube tube-b'></span>";
        pcCase.appendChild(r);
      }
    }
  }

  placed.add(component.id);
  if (component.id === "cpu") pcCase.classList.add("cpu-ready");

  renderParts();
  renderGuide();
  updateUI();
  selectComponent(component.id);
  playInstallSound(component);


  showToast(component.type === "screws" ? `🔩 ${component.name} listo.` : `✅ ${component.name} instalado correctamente.`);

  if (effectivePlaced() === effectiveTotal()) finishBuild();
}

function flashWrong(slot) {
  slot.classList.add("wrong-flash");
  setTimeout(() => slot.classList.remove("wrong-flash"), 650);
}

function finishBuild() {
  if (powerBtn) powerBtn.hidden = false;
  phaseText.textContent = "¡Ensamblaje completo!";
  showToast("🎉 ¡PC ensamblada! Pulsa “Encender PC” para hacer el POST.");
}

/* =================================================================
   GUÍA · INFO · UI
   ================================================================= */
function renderGuide() {
    if (!stepGuide) { refrescarContexto(); return; }
  const currentId = getCurrentComponentId();
  stepGuide.innerHTML = "";
  components.forEach(c => {
    const done = placed.has(c.id);
    const skipped = !done && c.group && groupSatisfied(c.group);
    if (skipped) return;

    const item = document.createElement("div");
    item.className = "guide-item";
    if (done) item.className += " done";
    else if (c.id === currentId) item.className += " current";
    item.innerHTML = `<span class="gi-n"><span class="gi-text-n">${c.step}</span></span><span>${c.name}</span>`;
    item.addEventListener("click", () => selectComponent(c.id));
    stepGuide.appendChild(item);
  });
  refrescarContexto();   // actualiza panel de aprendizaje + índice + destino
}

/* Pequeña ayuda: arma la tabla de la ficha técnica */
function tablaSpecs(specs) {
  if (!specs) return "";
  return `<table class="spec-table"><tbody>` +
    specs.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join("") + `</tbody></table>`;
}

function selectComponent(componentId) {
  selectedId = componentId;
  document.querySelectorAll(".part-card").forEach(card =>
    card.classList.toggle("selected", card.dataset.id === componentId));

  const c = getComponent(componentId);
  let status;
  if (placed.has(c.id)) status = "Instalado ✓";
  else if (c.group && groupSatisfied(c.group)) status = "Alternativa no usada (elegiste la otra refrigeración)";
  else if (depsMet(c)) status = "Listo para instalar";
  else status = "Bloqueado — " + nextPendingDepText(c);

  const specsHtml = SPECS[c.id]
    ? `<div class="spec-sheet"><h4>Ficha técnica</h4>${tablaSpecs(SPECS[c.id])}</div>` : "";

  if (infoBox) infoBox.innerHTML = `
    <h3>${c.name}</h3>
    <p>${c.info}</p>
    ${specsHtml}
    <p><strong>Va en:</strong> ${SLOT_LABELS[c.target] || c.target}</p>
    <p><strong>Estado:</strong> ${status}</p>`;

  mostrarLearnDePieza(c);   // panel contextual de la pieza seleccionada
}

function showDefaultInfo() {
  if (infoBox) infoBox.innerHTML = `
    <p>Selecciona o arrastra un componente para ver su descripción y dónde se instala.</p>
    <p>Sigue el orden de la guía. En el paso 6 eliges refrigeración por <strong>aire</strong> o <strong>líquida</strong>.</p>
    <p>🔍 <strong>Tip:</strong> haz clic en una pieza ya instalada dentro del gabinete para ver su <strong>ficha técnica</strong>.</p>`;
}

function updateUI() {
  const n = effectivePlaced(), total = effectiveTotal();
  progressLabel.textContent = `Ensamblaje: ${n} / ${total} pasos`;
  progressBar.style.width = (n / total * 100) + "%";
  const cur = getCurrentComponent();
  if (cur) phaseText.textContent = `${cur.step}. ${cur.name}`;
  else if (n === total) phaseText.textContent = "¡Ensamblaje completo!";
}

function highlightNextStep() {
  const cur = getCurrentComponent();
  if (!cur) { showToast("No quedan pasos pendientes."); return; }
  selectComponent(cur.id);
  const slot = getTargetSlot(cur);
  if (slot) { slot.classList.add("next-step"); setTimeout(() => slot.classList.remove("next-step"), 3200); }
  showToast(`Siguiente paso: ${cur.name} → ${SLOT_LABELS[cur.target] || cur.target}.`);
}

/* =================================================================
   EXPLICACIÓN CONTEXTUAL  (teoría ANTES de instalar)
   Panel de aprendizaje del paso actual, burbuja de instrucción,
   índice de categorías y resaltado permanente del destino.
   ================================================================= */
const CATEGORIAS = [
  { n: "Preparación del chasis", ids: ["standoffs", "mobo", "screwMobo"] },
  { n: "Procesador y refrigeración", ids: ["cpu", "paste", "cooler", "aio", "cpuFan"] },
  { n: "Memoria y almacenamiento", ids: ["ram1", "ram2", "m2", "ssd", "hdd", "screwDrives"] },
  { n: "Energía", ids: ["psu", "screwPsu", "eps", "atx", "pcie", "sataPower"] },
  { n: "Expansión y ventilación", ids: ["gpu", "screwGpu", "fanFront", "fanRear", "screwFans"] },
  { n: "Conexiones del panel frontal", ids: ["sataData", "pwrSw", "rstSw", "hddLed", "pwrLed", "usbFront", "audioFront"] },
  { n: "Cierre del equipo", ids: ["manage", "sidePanel", "screwPanel"] },
  { n: "Periféricos", ids: ["keyboard", "mouse", "monitor"] }
];

const INSTRUCCIONES = {
  standoffs: "Atornilla los separadores en la bandeja siguiendo el patrón ATX.",
  mobo: "Apoya la placa sobre los separadores, alineando el I/O shield con la parte trasera.",
  screwMobo: "Atornilla la placa en cada separador sin apretar de más.",
  cpu: "Levanta la palanca del socket y alinea el triángulo dorado del CPU con el de la placa.",
  paste: "Aplica un punto de pasta del tamaño de un guisante en el centro del procesador.",
  cooler: "Asienta el disipador sobre la pasta y fíjalo con sus sujetadores.",
  aio: "Coloca el bloque de la bomba sobre el CPU; el radiador se fija arriba del gabinete.",
  cpuFan: "Conecta el cable del ventilador al cabezal CPU_FAN, junto al socket.",
  ram1: "Abre los seguros, alinea la muesca y presiona hasta oír el clic.",
  ram2: "Coloca el segundo módulo en B2 para activar el doble canal.",
  m2: "Inserta el SSD en ángulo, bájalo y fíjalo con su tornillo.",
  psu: "Coloca la fuente en su compartimento inferior, con el ventilador hacia abajo.",
  screwPsu: "Fija la fuente con sus cuatro tornillos por la parte trasera.",
  ssd: "Coloca el SSD de 2.5\" en su bahía.",
  hdd: "Monta el disco de 3.5\" en la jaula de discos.",
  screwDrives: "Atornilla ambos discos para que no vibren.",
  gpu: "Inserta la GPU en el PCIe x16 hasta oír el clic del seguro.",
  screwGpu: "Atornilla el bracket de la GPU al chasis.",
  fanFront: "Monta el ventilador frontal con la flecha apuntando hacia dentro.",
  fanRear: "Monta el ventilador trasero con la flecha apuntando hacia fuera.",
  screwFans: "Fija cada ventilador con sus cuatro tornillos largos.",
  eps: "Conecta el EPS de 8 pines en la esquina superior izquierda de la placa.",
  atx: "Conecta el ATX de 24 pines en el borde derecho hasta que haga clic.",
  pcie: "Conecta el cable PCIe a los conectores de energía de la GPU.",
  sataData: "Lleva el cable plano SATA del disco a un puerto SATA de la placa.",
  sataPower: "Conecta la alimentación SATA de la fuente a los discos.",
  pwrSw: "Coloca el Power SW en su par de pines del F_PANEL. No tiene polaridad.",
  rstSw: "Coloca el Reset SW en su par de pines. Tampoco tiene polaridad.",
  hddLed: "Es un LED: respeta la polaridad, el positivo va en su pin marcado.",
  pwrLed: "También es un LED: coloca el positivo en el pin correcto o no encenderá.",
  usbFront: "Conecta el cable USB del gabinete a su cabezal en la placa.",
  audioFront: "Conecta el audio frontal al cabezal HD Audio (AAFP).",
  manage: "Pasa los cables por detrás de la bandeja y sujétalos con cinchos.",
  sidePanel: "Coloca el panel lateral en su sitio.",
  screwPanel: "Atornilla el panel y cierra el gabinete.",
  keyboard: "Conecta el teclado a un puerto USB del panel trasero.",
  mouse: "Conecta el mouse a otro puerto USB libre.",
  monitor: "Conecta el monitor a una salida de la tarjeta gráfica, no a la placa."
};

/* Panel del PASO ACTUAL */
function pintarLearn() {
  if (!learnPanel) return;
  const c = getCurrentComponent();

  if (!c) {
    learnPanel.innerHTML =
      `<div class="learn-head">ENSAMBLAJE COMPLETO</div>
       <div class="learn-body"><p>Todos los pasos están cubiertos. Pulsa <strong>Encender PC</strong> para ejecutar el POST y verificar el equipo.</p></div>`;
    if (bubble) bubble.innerHTML = `<span class="instr-ico">✅</span><span>Ensamblaje terminado. Ya puedes encender el equipo.</span>`;
    return;
  }

  learnPanel.innerHTML =
    `<div class="learn-head">ANTES DE INSTALAR · PASO ${c.step}</div>
     <h3>${c.name}</h3>
     <div class="learn-body">
       <p>${c.info}</p>
       <p class="learn-where">📍 Va en: <strong>${SLOT_LABELS[c.target] || c.target}</strong></p>
       ${tablaSpecs(SPECS[c.id])}
     </div>`;

  if (bubble) bubble.innerHTML =
    `<span class="instr-ico">🛠️</span><span>${INSTRUCCIONES[c.id] || ("Coloca " + c.name + " en " + (SLOT_LABELS[c.target] || c.target) + ".")}</span>`;
}

/* Panel de una pieza SELECCIONADA (consulta o "aún no toca") */
function mostrarLearnDePieza(c) {
  if (!learnPanel) return;
  const actual = getCurrentComponentId();
  if (!c || c.id === actual || placed.has(c.id)) { pintarLearn(); return; }

  const listo = depsMet(c);
  learnPanel.innerHTML =
    `<div class="learn-head">${listo ? "CONSULTA · PASO " + c.step : "AÚN NO TOCA · PASO " + c.step}</div>
     <h3>${c.name}</h3>
     <div class="learn-body">
       <p>${c.info}</p>
       <p class="learn-where">📍 Va en: <strong>${SLOT_LABELS[c.target] || c.target}</strong></p>
       ${listo ? "" : `<p class="learn-where">🔒 ${nextPendingDepText(c)}</p>`}
       ${tablaSpecs(SPECS[c.id])}
     </div>`;
}

/* Índice de categorías con avance por grupo */
function pintarIndice() {
  if (!catIndex) return;
  const actual = getCurrentComponentId();
  catIndex.innerHTML = "";
  CATEGORIAS.forEach(cat => {
    const piezas = cat.ids.map(getComponent)
      .filter(c => c && !(c.group && groupSatisfied(c.group) && !placed.has(c.id)));
    if (!piezas.length) return;

    const hechas = piezas.filter(c => placed.has(c.id)).length;
    const completa = hechas === piezas.length;
    const activa = piezas.some(c => c.id === actual);

    const el = document.createElement("div");
    el.className = "cat-item" + (completa ? " done" : "") + (activa ? " active" : "");
    el.innerHTML = `<span class="ci-dot">${completa ? "✓" : "•"}</span><span>${cat.n}</span><span style="margin-left:auto">${hechas}/${piezas.length}</span>`;
    catIndex.appendChild(el);
  });
}

/* NOTA: el resaltado automático del slot destino se retiró a propósito.
   Antes se marcaba siempre el hueco correcto (clase 'target-now'), lo que
   volvía inútil el botón "Resaltar siguiente paso" y hacía que el usuario
   solo soltara donde brillaba. Ahora debe SABER dónde va cada pieza; el
   botón sigue disponible como pista puntual y el panel explica CÓMO ponerla. */
function refrescarContexto() { pintarLearn(); pintarIndice(); }

/* =================================================================
   HELPERS de dependencias / conteo
   -----------------------------------------------------------------
   Estas funciones cortas son el "cerebro" de las reglas del armado:
   deciden qué pieza sigue, cuáles están bloqueadas y cuánto llevas.
   ================================================================= */
function getComponent(id) { return components.find(c => c.id === id); }

/* Lista de dependencias de una pieza, siempre como arreglo. */
function depsList(component) {
  if (!component.dependsOn) return [];
  return Array.isArray(component.dependsOn) ? component.dependsOn : [component.dependsOn];
}
function isGroupToken(d) { return typeof d === "string" && d.indexOf("group:") === 0; }
function groupSatisfied(g) { return g ? components.some(c => c.group === g && placed.has(c.id)) : false; }
function depMet(d) { return isGroupToken(d) ? groupSatisfied(d.slice(6)) : placed.has(d); }
function depsMet(component) { return depsList(component).every(depMet); }

function nextPendingDepText(component) {
  const pending = depsList(component).filter(d => !depMet(d))
    .map(d => isGroupToken(d) ? "la refrigeración" : getComponent(d).name);
  if (!pending.length) return "Ya puedes instalarla.";
  return "Primero instala: " + pending.join(", ") + ".";
}

function getCurrentComponent() {
  return components.find(c => !placed.has(c.id) && !(c.group && groupSatisfied(c.group))) || null;
}
function getCurrentComponentId() { const c = getCurrentComponent(); return c ? c.id : null; }

/* Total y colocadas contando el grupo de refrigeración como UN paso
   (aire y líquida son la misma etapa, aunque haya dos piezas posibles). */
function effectiveTotal() {
  const seen = new Set(); let t = 0;
  components.forEach(c => {
    if (c.group) { if (!seen.has(c.group)) { seen.add(c.group); t++; } } else t++;
  });
  return t;
}
function effectivePlaced() {
  const seen = new Set(); let n = 0;
  components.forEach(c => {
    if (!placed.has(c.id)) return;
    if (c.group) { if (!seen.has(c.group)) { seen.add(c.group); n++; } } else n++;
  });
  return n;
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(showToast.t);
  showToast.t = setTimeout(() => toast.classList.remove("show"), 2800);
}

function showError(title, body) {
  sfxError();
  errorTitle.textContent = title;
  errorBody.textContent = body;
  errorModal.hidden = false;
}

/* Ficha técnica centrada al colocar una pieza */
function showSpecModal(component) {
  const isScrew = component.type === "screws";
  specTitle.textContent = component.name;
  specRole.textContent = component.info || "";

  if (SPECS[component.id]) {
    specBody.innerHTML = `<div class="spec-sheet"><h4>Ficha técnica</h4>${tablaSpecs(SPECS[component.id])}</div>`;
  } else {
    specBody.innerHTML = `<div class="spec-sheet"><h4>Función</h4><p class="spec-func">${component.short || component.info || ""}</p></div>`;
  }

  if (component.id === "mobo" || component.id === "cpu") {
    specExtra.textContent = CHIPSET.note; specExtra.hidden = false;
  } else { specExtra.hidden = true; specExtra.textContent = ""; }

  specVisual.innerHTML = "";
  specVisual.appendChild(createVisual(component.type));
  specVisual.classList.toggle("is-screw", isScrew);
  specModal.hidden = false;
}

/* =================================================================
   SONIDOS (Web Audio, sin archivos externos)
   -----------------------------------------------------------------
   No cargamos archivos .mp3: generamos los sonidos por programación.
   · _noise() crea "ruido" (como un clic o un chasquido) filtrándolo.
   · _blip() crea un tono puro (un pitido) con un oscilador.
   Los demás (sfxClick, sfxPlug, ...) combinan esos dos para lograr
   el sonido de cada acción. Es opcional: si el navegador no deja, no pasa nada.
   ================================================================= */
let _actx = null, soundOn = true;
function actx() {
  if (!_actx) { const A = window.AudioContext || window.webkitAudioContext; if (A) _actx = new A(); }
  return _actx;
}
["pointerdown", "keydown", "touchstart"].forEach(ev =>
  window.addEventListener(ev, () => { const a = actx(); if (a && a.state === "suspended") a.resume(); }, { passive: true }));

function _noise(dur, type, freq, gain) {
  const a = actx(); if (!a || !soundOn) return;
  const n = Math.max(1, (a.sampleRate * dur) | 0);
  const b = a.createBuffer(1, n, a.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = a.createBufferSource(); s.buffer = b;
  const f = a.createBiquadFilter(); f.type = type; f.frequency.value = freq;
  const g = a.createGain();
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0008, a.currentTime + dur);
  s.connect(f); f.connect(g); g.connect(a.destination); s.start();
}
function _blip(freq, dur, type, gain) {
  const a = actx(); if (!a || !soundOn) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type || "square"; o.frequency.value = freq;
  g.gain.setValueAtTime(gain || 0.12, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0008, a.currentTime + dur);
  o.connect(g); g.connect(a.destination);
  o.start(); o.stop(a.currentTime + dur + 0.02);
}
function sfxClick() { _noise(0.05, "highpass", 2600, 0.22); _blip(1900, 0.04, "square", 0.05); }
function sfxPlug()  { _noise(0.10, "lowpass", 650, 0.26); _blip(150, 0.09, "sine", 0.12); }
function sfxScrew() { for (let i = 0; i < 5; i++) setTimeout(() => _noise(0.03, "bandpass", 1500, 0.18), i * 70); }
function sfxError() { _blip(220, 0.18, "sawtooth", 0.14); }
function sfxPower() {
  _blip(320, 0.12, "sawtooth", 0.10);
  setTimeout(() => _blip(520, 0.12, "sawtooth", 0.10), 90);
  setTimeout(() => _blip(780, 0.18, "triangle", 0.12), 180);
  setTimeout(() => _blip(1040, 0.55, "sine", 0.10), 300);
  setTimeout(() => _noise(1.2, "lowpass", 1000, 0.09), 120);
}
function playInstallSound(component) {
  if (component.type === "screws") sfxScrew();
  else if (component.type === "fp-pin" || component.type === "manage" || String(component.type).indexOf("cable") === 0) sfxPlug();
  else sfxClick();
}
function toggleSound() {
  soundOn = !soundOn;
  if (soundBtn) { soundBtn.classList.toggle("active", soundOn); soundBtn.textContent = soundOn ? "🔊 Sonido" : "🔇 Sonido"; }
  showToast(soundOn ? "Sonido activado." : "Sonido silenciado.");
}

/* =================================================================
   CÁMARA 360°, ZOOM, AUTO-GIRO, CAPAS
   -----------------------------------------------------------------
   No hay 3D "real": es un truco de CSS. La escena tiene transform con
   rotateX/rotateZ/scale y aquí solo cambiamos esos números:
   · applyTransform() aplica la rotación/zoom/desplazamiento actuales.
   · setupOrbit() escucha el mouse: arrastrar = girar, rueda = zoom,
     clic derecho/shift = desplazar (pan).
   · tickAuto() gira solo, poquito en cada cuadro, si el modo auto está activo.
   ================================================================= */
function applyTransform() {
  pcCase.style.transform = `translate(${panX}px, ${panY}px) rotateX(${rotX}deg) rotateZ(${rotZ}deg) scale(${zoom})`;
}
function changeView(view) {
  const p = PRESETS[view]; if (!p) return;
  rotX = p[0]; rotZ = p[1]; zoom = p[2]; panX = -200; panY = 0;
  applyTransform();
  document.querySelectorAll(".view-btn[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === view));
}
function setupOrbit() {
  boardScene.addEventListener("contextmenu", e => e.preventDefault());
  boardScene.addEventListener("pointerdown", e => {
    if (e.target.closest("button")) return;
    boardScene._lx = e.clientX; boardScene._ly = e.clientY;
    if (e.button === 2 || e.button === 1 || e.shiftKey || e.ctrlKey) { panningBoard = true; boardScene.classList.add("panning"); }
    else { draggingBoard = true; boardScene.classList.add("grabbing"); }
    pcCase.classList.add("no-trans");
  });
  window.addEventListener("pointermove", e => {
    if (panningBoard) {
      panX += (e.clientX - boardScene._lx); panY += (e.clientY - boardScene._ly);
      boardScene._lx = e.clientX; boardScene._ly = e.clientY; applyTransform(); return;
    }
    if (!draggingBoard) return;
    rotZ += (e.clientX - boardScene._lx) * 0.45;
    rotX -= (e.clientY - boardScene._ly) * 0.40;
    rotX = Math.max(-85, Math.min(89, rotX));
    boardScene._lx = e.clientX; boardScene._ly = e.clientY; applyTransform();
  });
  window.addEventListener("pointerup", () => {
    if (!draggingBoard && !panningBoard) return;
    draggingBoard = false; panningBoard = false;
    boardScene.classList.remove("grabbing", "panning"); pcCase.classList.remove("no-trans");
  });
  boardScene.addEventListener("wheel", e => {
    e.preventDefault();
    const rect = boardScene.getBoundingClientRect();
    const ex = e.clientX - (rect.left + rect.width / 2);
    const ey = e.clientY - (rect.top + rect.height / 2);
    const oldZoom = zoom;
    let newZoom = Math.max(0.32, Math.min(2.2, zoom + (e.deltaY < 0 ? 0.08 : -0.08)));
    const f = newZoom / oldZoom;
    panX = ex - f * (ex - panX); panY = ey - f * (ey - panY);
    zoom = newZoom; applyTransform();
  }, { passive: false });
}
function tickAuto() { if (autoOn && !draggingBoard) { rotZ += 0.16; applyTransform(); } requestAnimationFrame(tickAuto); }
function toggleAuto() { autoOn = !autoOn; autoBtn.classList.toggle("active", autoOn); }
function toggleLayers() {
  exploded = !exploded;
  pcCase.classList.toggle("exploded", exploded);
  layersBtn.classList.toggle("active", exploded);
  showToast(exploded ? "Vista en capas: arrastra para verla en 3D." : "Vista normal.");
}

/* =================================================================
   ENCENDIDO (RGB + efecto de luz)
   ================================================================= */
function powerOn() {
  if (powerBtn) powerBtn.hidden = true;
  sfxPower();
  boardScene.classList.add("power-dim");
  pcCase.classList.add("igniting");
  zoom = Math.min(2.2, zoom * 1.06); applyTransform();

  setTimeout(() => pcCase.classList.add("lit-fans"), 150);
  setTimeout(() => pcCase.classList.add("lit-ram"), 470);
  setTimeout(() => pcCase.classList.add("lit-gpu"), 780);
  setTimeout(() => {
    pcCase.classList.add("powered");
    boardScene.classList.remove("power-dim");
    if (poweredBadge) poweredBadge.hidden = false;
    powerFX();
    showToast("⚡ Sistema encendido. Iluminación RGB y ventiladores en marcha.");
  }, 1050);
  setTimeout(() => pcCase.classList.remove("igniting"), 1750);
}

/* Efecto visual del encendido dibujado en un <canvas>: un destello,
   unos anillos que se expanden y partículas ("motas") que suben.
   Cada cuadro se borra y se vuelve a dibujar con requestAnimationFrame,
   hasta que todo se desvanece. Es puramente decorativo. */
function powerFX() {
  const c = confettiCanvas, x = c.getContext("2d");
  c.width = innerWidth; c.height = innerHeight;
  const cx = innerWidth / 2, cy = innerHeight / 2.25;
  const cols = ["#52ffb8", "#6bbdff", "#b98cff", "#8affd6", "#7ed7ff"];
  const motes = Array.from({ length: 48 }, () => ({
    x: cx + (Math.random() - .5) * 170, y: cy + (Math.random() - .5) * 130,
    vx: (Math.random() - .5) * 0.8, vy: -(Math.random() * 1.7 + 0.6),
    r: Math.random() * 3 + 1.2, c: cols[(Math.random() * cols.length) | 0], life: 1, sway: Math.random() * 6.28
  }));
  const rings = [{ r: 12, a: 0.65, col: "#6bbdff" }, { r: 12, a: 0.55, col: "#b98cff" }, { r: 12, a: 0.45, col: "#52ffb8" }];
  let flash = 0.9;
  (function run() {
    x.clearRect(0, 0, c.width, c.height);
    if (flash > 0.02) {
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, 460);
      g.addColorStop(0, `rgba(255,255,255,${flash * 0.5})`); g.addColorStop(1, "rgba(255,255,255,0)");
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); flash *= 0.9;
    }
    rings.forEach((ri, i) => {
      ri.r += 6 + i * 1.6; ri.a *= 0.966;
      x.beginPath(); x.arc(cx, cy, ri.r, 0, Math.PI * 2);
      x.strokeStyle = ri.col; x.globalAlpha = Math.max(ri.a, 0);
      x.lineWidth = 3; x.shadowBlur = 18; x.shadowColor = ri.col; x.stroke();
      x.globalAlpha = 1; x.shadowBlur = 0;
    });
    let alive = false;
    motes.forEach(p => {
      p.sway += 0.05; p.x += p.vx + Math.sin(p.sway) * 0.3; p.y += p.vy; p.vy *= 0.995; p.life -= 0.006;
      if (p.life > 0) {
        alive = true; x.globalAlpha = Math.max(p.life, 0);
        x.fillStyle = p.c; x.shadowBlur = 12; x.shadowColor = p.c;
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, Math.PI * 2); x.fill();
        x.globalAlpha = 1; x.shadowBlur = 0;
      }
    });
    if (alive || rings.some(r => r.a > 0.02) || flash > 0.02) requestAnimationFrame(run);
    else x.clearRect(0, 0, c.width, c.height);
  })();
}

/* =================================================================
   PANTALLA DE ARRANQUE
   ================================================================= */
function runBoot() {
  const msgs = ["Cargando módulos...", "Detectando hardware...", "Preparando piezas...", "Listo ✓"];
  let p = 0, mi = 0;
  const t = setInterval(() => {
    p += Math.random() * 18 + 8; if (p >= 100) p = 100;
    bootFill.style.width = p + "%";
    const i = Math.min(msgs.length - 1, Math.floor(p / 26));
    if (i !== mi) { mi = i; bootLog.textContent = msgs[i]; }
    if (p >= 100) { clearInterval(t); setTimeout(() => bootScreen.classList.add("hide"), 350); }
  }, 200);
}

/* =================================================================
   EVENTOS
   ================================================================= */
highlightBtn.addEventListener("click", highlightNextStep);
resetBtn.addEventListener("click", initBuild);
document.querySelectorAll(".view-btn[data-view]").forEach(b => b.addEventListener("click", () => changeView(b.dataset.view)));
autoBtn.addEventListener("click", toggleAuto);
layersBtn.addEventListener("click", toggleLayers);
centerBtn.addEventListener("click", () => changeView("iso"));
if (soundBtn) soundBtn.addEventListener("click", toggleSound);
powerBtn.addEventListener("click", powerOn);
document.getElementById("xrayBtn").addEventListener("click", function () {
  pcCase.classList.toggle("xray"); this.classList.toggle("active");
});
errorClose.addEventListener("click", () => { errorModal.hidden = true; });
errorModal.addEventListener("click", e => { if (e.target === errorModal) errorModal.hidden = true; });
specClose.addEventListener("click", () => { specModal.hidden = true; });
specModal.addEventListener("click", e => { if (e.target === specModal) specModal.hidden = true; });

/* Clic en una pieza YA instalada -> muestra su ficha técnica */
boardScene.addEventListener("click", e => {
  const slot = e.target.closest(".slot");
  if (!slot) return;
  const id = slot.dataset.installedId;
  if (!id) return;
  if (!(slot.classList.contains("occupied") || slot.classList.contains("screwed"))) return;
  selectComponent(id);
  slot.classList.add("inspecting");
  setTimeout(() => slot.classList.remove("inspecting"), 900);
  if (infoBox && infoBox.scrollIntoView) infoBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

setupOrbit();
applyTransform();
requestAnimationFrame(tickAuto);
runBoot();
initBuild();


/* =================================================================
   =============   MÓDULOS DIDÁCTICOS (Servicio Social)   ==========
   1 Teoría · 2 Catálogo · 4 Compatibilidad+Diagnóstico
   5 Autoevaluación · 6 Glosario  +  Menú principal
   -----------------------------------------------------------------
   Todo esto va DENTRO de una función que se ejecuta sola: (function(){ ... })();
   Eso se llama IIFE y sirve para que las variables de los módulos
   (CATALOG, POOL, etc.) NO se mezclen con las del ensamblaje de arriba.
   Cada módulo tiene su propia función renderX() que "pinta" su pantalla.
   ================================================================= */
(function () {

  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

  /* ---------------- Navegación entre módulos ---------------- */
  function setupModuleNav() {
    const btns = document.querySelectorAll(".modnav-btn");
    btns.forEach(b => b.addEventListener("click", () => {
      btns.forEach(x => x.classList.toggle("is-active", x === b));
      document.querySelectorAll(".module").forEach(m => m.classList.toggle("is-active", m.id === b.dataset.mod));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
  }

  /* =================================================================
     MÓDULO 1 · TEORÍA  (3 apartados: Arquitectura · Memoria · Componentes)
     ================================================================= */
  const VN = [
    { t: "Entrada", d: "Dispositivos que introducen datos al sistema (teclado, mouse, sensores). Convierten la acción del usuario o del entorno en datos que el CPU puede procesar." },
    { t: "CPU (UC + ALU + Registros)", d: "La Unidad Central de Proceso ejecuta las instrucciones. Integra la Unidad de Control (coordina), la ALU (opera) y los Registros (memoria ultrarrápida interna)." },
    { t: "Salida", d: "Dispositivos que entregan resultados (monitor, impresora, bocinas). Transforman los datos procesados en información para el usuario." },
    { t: "Memoria principal (RAM)", d: "Guarda datos e instrucciones del programa en ejecución. El CPU la lee y escribe constantemente; es volátil (se borra al apagar)." },
    { t: "Buses del sistema", d: "Canales que comunican CPU, memoria y E/S. Se dividen en bus de datos, bus de direcciones y bus de control." }
  ];
  const SUBCPU = [
    { t: "Unidad de Control (UC)", d: "Interpreta cada instrucción y coordina a las demás unidades mediante señales de control; decide qué se hace y cuándo." },
    { t: "ALU (Unidad Aritmético-Lógica)", d: "Realiza operaciones aritméticas (suma, resta) y lógicas (AND, OR, comparaciones)." },
    { t: "Registros", d: "Memoria ultrarrápida dentro del CPU para datos inmediatos: contador de programa (PC), registro de instrucción (IR), acumulador, etc." }
  ];
  const BUSES = [
    { t: "Bus de datos", d: "Transporta la información (los valores). Su ancho en bits define cuántos datos se mueven a la vez (8, 16, 32, 64 bits)." },
    { t: "Bus de direcciones", d: "Indica la posición de memoria a leer o escribir. Su ancho define cuánta memoria se puede direccionar (p. ej. 32 bits ≈ 4 GB)." },
    { t: "Bus de control", d: "Lleva señales de coordinación: lectura/escritura, reloj, interrupciones y estado." }
  ];
  const CYCLE = [
    { t: "1 · Búsqueda (Fetch)", d: "La Unidad de Control lee de la memoria la siguiente instrucción, usando el contador de programa (PC)." },
    { t: "2 · Decodificación (Decode)", d: "La UC interpreta qué operación es y qué operandos necesita." },
    { t: "3 · Ejecución (Execute)", d: "La ALU u otra unidad realiza la operación indicada." },
    { t: "4 · Escritura (Write-back)", d: "El resultado se guarda en un registro o en memoria y el PC avanza a la siguiente instrucción." }
  ];
  const MEM = [
    { t: "Registros", v: "≈ <1 ns", s: "bytes", r: "Dentro del CPU; lo más rápido y lo más caro." },
    { t: "Caché L1 / L2 / L3", v: "≈ 1–10 ns", s: "KB – MB", r: "Guarda datos frecuentes cerca del CPU para no ir siempre a la RAM." },
    { t: "Memoria RAM", v: "≈ 50–100 ns", s: "GB", r: "Memoria de trabajo del programa en ejecución; volátil." },
    { t: "SSD NVMe", v: "≈ 10–100 µs", s: "cientos de GB – TB", r: "Almacenamiento permanente muy rápido (bus PCIe)." },
    { t: "Disco duro (HDD)", v: "≈ 5–10 ms", s: "TB", r: "Almacenamiento masivo, permanente y económico." }
  ];
  const THEORY = [
    { ico: "🔲", col: "#6bbdff", t: "Tarjeta madre", tag: "El punto de encuentro de todo",
      def: "Plataforma que interconecta todos los componentes y define gran parte de la compatibilidad.",
      points: ["Socket", "Chipset", "Ranuras RAM", "PCIe/SATA", "BIOS/UEFI"],
      clave: "Si el socket o el tipo de RAM no coinciden con la placa, el componente no funciona.",
      chk: { q: "¿Qué elemento de la placa determina qué CPU es compatible?", a: "El socket (y el chipset)." } },
    { ico: "⚙️", col: "#ffb86b", t: "Procesador (CPU)", tag: "Ejecuta las instrucciones",
      def: "Ejecuta el ciclo de instrucción y coordina las operaciones del sistema.",
      points: ["Núcleos/hilos", "Frecuencia", "Caché", "TDP", "Socket"],
      clave: "Más núcleos y frecuencia = más rendimiento, pero más calor (TDP) que disipar.",
      chk: { q: "¿Qué unidad del CPU realiza las operaciones aritméticas y lógicas?", a: "La ALU." } },
    { ico: "🧬", col: "#8affd6", t: "Memoria RAM", tag: "Mesa de trabajo temporal",
      def: "Memoria volátil que guarda datos e instrucciones en uso; se borra al apagar.",
      points: ["Volátil", "Capacidad", "Velocidad", "DDR4/DDR5", "Dual channel"],
      clave: "Dos módulos en A2/B2 activan el dual channel y mejoran el ancho de banda.",
      chk: { q: "¿La RAM conserva los datos al apagar la PC?", a: "No: es volátil." } },
    { ico: "💾", col: "#b98cff", t: "Almacenamiento", tag: "Memoria permanente",
      def: "Conserva la información aunque se apague. Es memoria secundaria, distinta de la RAM.",
      points: ["HDD", "SSD SATA", "SSD NVMe", "Capacidad", "Velocidad"],
      clave: "Un SSD NVMe puede ser mucho más rápido que un HDD al arrancar y cargar.",
      chk: { q: "¿Qué es más rápido: HDD o SSD NVMe?", a: "El SSD NVMe, por mucho." } },
    { ico: "🎮", col: "#ff7ad1", t: "GPU", tag: "Motor gráfico",
      def: "Procesa gráficos, video y cálculos en paralelo. Integrada (en CPU) o dedicada.",
      points: ["VRAM", "Consumo", "PCIe x16", "Salidas de video"],
      clave: "Sin GPU dedicada ni gráficos integrados, no hay imagen en pantalla.",
      chk: { q: "¿Qué memoria usa una GPU dedicada?", a: "Su VRAM propia." } },
    { ico: "🔌", col: "#ffe66b", t: "Fuente de poder", tag: "Energía del sistema",
      def: "Transforma la corriente y distribuye energía estable a todos los componentes.",
      points: ["Potencia (W)", "80+", "Modular", "ATX/EPS/PCIe/SATA"],
      clave: "Si los watts no alcanzan para CPU + GPU, el equipo se apaga o no enciende.",
      chk: { q: "¿Qué conector alimenta el CPU?", a: "El EPS de 8 pines." } },
    { ico: "🖥️", col: "#7ed7ff", t: "Gabinete", tag: "Estructura y flujo de aire",
      def: "Aloja y protege; su factor de forma define qué placa cabe y cómo circula el aire.",
      points: ["ATX/mATX/ITX", "Espacio GPU", "Radiadores", "Ventilación"],
      clave: "Una placa ATX no entra en un gabinete que sólo admite ITX.",
      chk: { q: "¿Qué determina el factor de forma del gabinete?", a: "El tamaño de placa (y GPU) que admite." } },
    { ico: "❄️", col: "#52ffb8", t: "Enfriamiento", tag: "Control de temperatura",
      def: "Disipadores/ventiladores (aire) o refrigeración líquida que extraen el calor.",
      points: ["Aire vs AIO", "Disipación (W)", "CPU_FAN", "Flujo de aire"],
      clave: "Si el disipador no cubre el TDP del CPU, hay throttling o daño.",
      chk: { q: "¿A qué cabezal se conecta el ventilador del disipador?", a: "Al CPU_FAN." } },
    { ico: "⌨️", col: "#a0b0d6", t: "Periféricos", tag: "Interacción con el usuario",
      def: "Dispositivos de entrada, salida o mixtos que comunican al usuario con la PC.",
      points: ["Entrada", "Salida", "USB/HDMI/DP", "Audio"],
      clave: "Con GPU dedicada, el monitor se conecta a la salida de la GPU, no a la placa.",
      chk: { q: "¿El teclado es dispositivo de entrada o salida?", a: "De entrada." } },
    { ico: "⚡", col: "#ff9b9b", t: "Arranque (POST/BIOS)", tag: "De apagado a escritorio",
      def: "El firmware ejecuta el POST, inicializa el hardware vía BIOS/UEFI y carga el SO.",
      points: ["POST", "BIOS/UEFI", "Detección HW", "Carga del SO"],
      clave: "Un fallo de POST (RAM, CPU, video) impide el arranque; suele avisarse con beeps/LEDs.",
      chk: { q: "¿Qué hace el POST?", a: "Un autodiagnóstico del hardware al encender." } }
  ];

  let teoTab = "arq";

  /* Inyecta una sola vez los estilos de este apartado (diagrama simple con
     animación suave). Se hace desde el JS para que se vea bien sin importar
     en qué archivo CSS estén el resto de los estilos. */
  function injectTeoStyles() {
    if (document.getElementById("teoStyles")) return;
    const css = `
    .t3-wrap{display:grid;gap:18px;max-width:920px;margin:0 auto}
    .t3-card{background:var(--bg-panel,#161821);border:1px solid var(--border,#2a2e3d);border-radius:16px;padding:20px 22px}
    .t3-h{margin:0 0 4px;font-size:20px;color:#fff}
    .t3-subh{margin:0 0 4px;font-size:17px;color:#fff}
    .t3-desc{margin:0 0 14px;color:var(--text-dim,#9aa3bd);font-size:14px;line-height:1.55}
    .t3-desc strong{color:#cdd7f5;font-weight:600}

    /* Diagrama SVG de von Neumann */
    .t3-svg{display:block;width:100%;max-width:600px;height:auto;margin:6px auto 2px}
    .t3-wire{stroke:#4a90b8;stroke-width:3;stroke-linecap:round;stroke-dasharray:5 9;animation:t3flow 1.1s linear infinite}
    @keyframes t3flow{to{stroke-dashoffset:-14}}
    .t3-svg .t3-bus-rect{fill:rgba(126,215,255,.12);stroke:#7ed7ff;stroke-width:1.5}
    .t3-node{cursor:pointer}
    .t3-node rect{fill:#191c27;stroke:var(--border,#2a2e3d);stroke-width:1.5;transition:stroke .2s,fill .2s}
    .t3-node:hover rect{stroke:#7ed7ff}
    .t3-node.sel rect{stroke:var(--nc,#7ed7ff);stroke-width:2.5}
    .t3-ico{font-size:26px}
    .t3-name{fill:#eaf0ff;font-size:14px;font-weight:700}
    .t3-label{fill:#04121e;font-size:12px;font-weight:800;letter-spacing:1px}
    .t3-cpu-glow{fill:#ffb86b;opacity:0;animation:t3pulse 2.6s ease-in-out infinite}
    @keyframes t3pulse{0%,100%{opacity:0}50%{opacity:.16}}

    /* Recuadro de detalle */
    .t3-detail{margin-top:8px;border:1px solid var(--border,#2a2e3d);border-left:3px solid #7ed7ff;border-radius:12px;
      background:rgba(126,215,255,.06);padding:13px 15px;min-height:66px}
    .t3-dtitle{display:flex;align-items:center;gap:8px;color:#fff;font-weight:700;font-size:15px}
    .t3-dot{width:11px;height:11px;border-radius:50%;flex:0 0 auto}
    .t3-detail p{margin:6px 0 0;color:#cdd7f5;font-size:14px;line-height:1.55}

    /* Ciclo de instrucción */
    .t3-steps{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px}
    .t3-step{display:flex;gap:12px;align-items:flex-start;padding:13px 14px;border-radius:12px;background:#191c27;
      border:1px solid var(--border,#2a2e3d);animation:t3in .5s ease both}
    .t3-step-n{width:28px;height:28px;flex:0 0 auto;border-radius:50%;display:grid;place-items:center;
      font-weight:800;font-size:13px;color:#04121e;background:#7ed7ff}
    .t3-step h4{margin:0 0 3px;font-size:13.5px;color:#fff}
    .t3-step p{margin:0;color:#c7d2f5;font-size:12.5px;line-height:1.4}
    @keyframes t3in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}

    /* Jerarquía de memoria */
    .t3-mem{display:grid;gap:10px}
    .t3-lvl{border:1px solid var(--border,#2a2e3d);border-left:4px solid var(--c);border-radius:12px;background:#191c27;
      padding:13px 15px;animation:t3in .5s ease both}
    .t3-lvl-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px}
    .t3-lvl-top strong{color:#fff;font-size:14.5px}
    .t3-lvl-v{color:var(--c);font-weight:700;font-size:13px;white-space:nowrap}
    .t3-lvl p{margin:5px 0 4px;color:#c7d2f5;font-size:13px;line-height:1.45}
    .t3-lvl-cap{color:var(--text-dim,#9aa3bd);font-size:12px}

    /* Componentes */
    .t3-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}
    .t3-comp{padding:16px;border-radius:14px;background:#191c27;border:1px solid var(--border,#2a2e3d);
      border-top:3px solid var(--c);animation:t3in .5s ease both}
    .t3-comp-ico{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;font-size:22px;margin-bottom:10px;
      background:color-mix(in srgb,var(--c) 16%,transparent)}
    .t3-comp h4{margin:0 0 2px;font-size:15px;color:#fff}
    .t3-comp-tag{display:block;margin-bottom:8px;font-size:12px;color:var(--c)}
    .t3-comp p{margin:0;color:#c7d2f5;font-size:13px;line-height:1.5}

    @media(prefers-reduced-motion:reduce){
      .t3-wire,.t3-cpu-glow,.t3-step,.t3-lvl,.t3-comp{animation:none}
    }
    `;
    const st = document.createElement("style");
    st.id = "teoStyles";
    st.textContent = css;
    document.head.appendChild(st);
  }

  function renderTheory() {
    injectTeoStyles();
    const host = document.getElementById("modTeoria");
    host.innerHTML =
      `<h2 class="mod-head">1 · Introducción teórica</h2>
       <p class="mod-sub">Una introducción visual a cómo funciona una computadora. Elige un apartado.</p>
       <div class="subtabs">
         <button class="subtab is-active" data-t="arq">🧠 Arquitectura</button>
         <button class="subtab" data-t="mem">🗂️ Jerarquía de memoria</button>
         <button class="subtab" data-t="comp">🧩 Componentes</button>
       </div>
       <div id="teoContent"></div>`;
    host.querySelectorAll(".subtab").forEach(b => b.addEventListener("click", () => { teoTab = b.dataset.t; paintTeo(); }));
    paintTeo();
  }
  function paintTeo() {
    document.querySelectorAll("#modTeoria .subtab").forEach(b => b.classList.toggle("is-active", b.dataset.t === teoTab));
    const c = document.getElementById("teoContent");
    if (teoTab === "arq") renderArq(c);
    else if (teoTab === "mem") renderMem(c);
    else renderComp(c);
  }

  /* Recuadro de detalle: título con punto de color + descripción. */
  function setDetail(el, title, desc, color) {
    el.innerHTML = `<span class="t3-dtitle"><span class="t3-dot" style="background:${color}"></span>${title}</span><p>${desc}</p>`;
  }

  /* ---------- Arquitectura: diagrama SVG animado + ciclo ---------- */
  function renderArq(c) {
    c.innerHTML =
      `<div class="t3-wrap">
         <div class="t3-card">
           <h2 class="t3-h">¿Cómo funciona una computadora?</h2>
           <p class="t3-desc">Sigue el modelo de <strong>von Neumann</strong>: los datos entran, el <strong>CPU</strong> los procesa con ayuda de la <strong>memoria</strong>, y salen los resultados. Fíjate cómo fluye la información por los cables, y toca un bloque para leer qué hace.</p>
           <svg class="t3-svg" viewBox="0 0 640 372" role="img" aria-label="Diagrama de von Neumann">
             <rect class="t3-cpu-glow" x="239" y="24" width="162" height="122" rx="16"></rect>
             <line class="t3-wire" x1="170" y1="85" x2="245" y2="85"></line>
             <line class="t3-wire" x1="395" y1="85" x2="470" y2="85"></line>
             <line class="t3-wire" x1="320" y1="140" x2="320" y2="185"></line>
             <line class="t3-wire" x1="320" y1="229" x2="320" y2="275"></line>
             <g class="t3-node" data-k="bus"><rect class="t3-bus-rect" x="20" y="185" width="600" height="44" rx="12"></rect><text class="t3-label" x="320" y="212" text-anchor="middle">BUS DEL SISTEMA</text></g>
             <g class="t3-node" data-k="in"><rect x="20" y="40" width="150" height="90" rx="12"></rect><text class="t3-ico" x="95" y="84" text-anchor="middle">⌨️</text><text class="t3-name" x="95" y="114" text-anchor="middle">Entrada</text></g>
             <g class="t3-node" data-k="cpu"><rect x="245" y="30" width="150" height="110" rx="14"></rect><text class="t3-ico" x="320" y="82" text-anchor="middle">⚙️</text><text class="t3-name" x="320" y="114" text-anchor="middle">CPU</text></g>
             <g class="t3-node" data-k="out"><rect x="470" y="40" width="150" height="90" rx="12"></rect><text class="t3-ico" x="545" y="84" text-anchor="middle">🖥️</text><text class="t3-name" x="545" y="114" text-anchor="middle">Salida</text></g>
             <g class="t3-node" data-k="mem"><rect x="245" y="275" width="150" height="80" rx="12"></rect><text class="t3-ico" x="320" y="314" text-anchor="middle">🧬</text><text class="t3-name" x="320" y="342" text-anchor="middle">Memoria (RAM)</text></g>
           </svg>
           <div class="t3-detail" id="t3det"></div>
         </div>

         <div class="t3-card">
           <h3 class="t3-subh">El ciclo de instrucción</h3>
           <p class="t3-desc" style="margin-bottom:12px">El CPU repite estos cuatro pasos, muy rápido y en orden:</p>
           <div class="t3-steps" id="t3steps"></div>
         </div>
       </div>`;

    const det = c.querySelector("#t3det");
    const map = { in: { i: 0, c: "#6bbdff" }, cpu: { i: 1, c: "#ffb86b" }, out: { i: 2, c: "#6bbdff" }, mem: { i: 3, c: "#8affd6" }, bus: { i: 4, c: "#7ed7ff" } };

    setDetail(det, "El modelo de von Neumann", "Una sola memoria guarda los datos y las instrucciones; el CPU las lee y ejecuta una por una. Toca cualquier bloque del diagrama para ver su función.", "#7ed7ff");

    c.querySelectorAll(".t3-node").forEach(n => n.addEventListener("click", () => {
      const m = map[n.dataset.k];
      c.querySelectorAll(".t3-node").forEach(x => x.classList.remove("sel"));
      n.classList.add("sel"); n.style.setProperty("--nc", m.c);
      setDetail(det, VN[m.i].t, VN[m.i].d, m.c);
    }));

    const steps = c.querySelector("#t3steps");
    CYCLE.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "t3-step"; d.style.animationDelay = (i * 90) + "ms";
      d.innerHTML = `<span class="t3-step-n">${i + 1}</span><div><h4>${s.t.replace(/^\d+\s*·\s*/, "")}</h4><p>${s.d}</p></div>`;
      steps.appendChild(d);
    });
  }

  /* ---------- Jerarquía de memoria ---------- */
  function renderMem(c) {
    const colors = ["#52ffb8", "#7ed7ff", "#6bbdff", "#b98cff", "#ff9b9b"];
    const rows = MEM.map((m, i) =>
      `<div class="t3-lvl" style="--c:${colors[i % colors.length]};animation-delay:${i * 70}ms">
         <div class="t3-lvl-top"><strong>${m.t}</strong><span class="t3-lvl-v">${m.v}</span></div>
         <p>${m.r}</p>
         <span class="t3-lvl-cap">Capacidad típica: ${m.s}</span>
       </div>`).join("");
    c.innerHTML =
      `<div class="t3-wrap"><div class="t3-card">
         <h2 class="t3-h">Jerarquía de memoria</h2>
         <p class="t3-desc">No toda la memoria es igual. Cuanto más arriba en la lista, más <strong>rápida</strong> (y más cara y pequeña). De la más veloz a la más grande:</p>
         <div class="t3-mem">${rows}</div>
       </div></div>`;
  }

  /* ---------- Componentes ---------- */
  function renderComp(c) {
    const cards = THEORY.map((it, i) =>
      `<div class="t3-comp" style="--c:${it.col};animation-delay:${i * 50}ms">
         <div class="t3-comp-ico">${it.ico}</div>
         <h4>${it.t}</h4><span class="t3-comp-tag">${it.tag}</span>
         <p>${it.def}</p>
       </div>`).join("");
    c.innerHTML =
      `<div class="t3-wrap"><div class="t3-card">
         <h2 class="t3-h">Los componentes</h2>
         <p class="t3-desc">Estas son las piezas principales de una computadora y para qué sirve cada una.</p>
         <div class="t3-grid">${cards}</div>
       </div></div>`;
  }

  /* =================================================================
     MÓDULO 2 · CATÁLOGO
     ================================================================= */
  const CATALOG = [
    { name: "Gabinete", vis: "case", emoji: "🖥️", resumen: "Estructura, protección y factor de forma.",
      qa: { quees: "El chasis que aloja y protege todos los componentes.", funcion: "Soporte físico, organización del espacio y flujo de aire.", comunicacion: "Aloja la placa y sujeta fuente, discos y ventiladores.", carac: "Factor de forma, espacio para GPU/radiadores, bahías.", errores: "Elegir un gabinete que no admite el tamaño de la placa o GPU.", incompat: "Placa ATX en gabinete sólo-ITX: no entra.", rend: "Buen flujo de aire = temperaturas bajas y sin throttling." },
      tabla: { cols: ["Formato", "Admite placas", "Notas"], rows: [["Full/Mid Tower", "ATX y menores", "Mejor flujo y espacio"], ["MicroATX", "microATX e ITX", "Compacto"], ["Mini-ITX", "solo ITX", "Muy compacto"]] },
      elegir: ["Que admita tu tarjeta madre", "Espacio suficiente para la GPU y el disipador", "Buen flujo de aire y filtros de polvo"] },
    { name: "Fuente de poder", vis: "psu", emoji: "🔌", resumen: "Convierte y distribuye la energía.",
      qa: { quees: "Transforma la corriente en voltajes para la PC.", funcion: "Entrega energía estable a placa, CPU, GPU y discos.", comunicacion: "Cables ATX 24, EPS 8 (CPU), PCIe (GPU) y SATA (discos).", carac: "Potencia (W), certificación 80+, modular, conectores.", errores: "Fuente de baja potencia o de mala calidad.", incompat: "Watts insuficientes: se apaga o no enciende.", rend: "Holgada = estable; justa = apagones bajo carga." },
      tabla: { cols: ["Certificación 80+", "Eficiencia aprox.", "Nivel"], rows: [["Bronze", "82–85%", "Básica"], ["Gold", "87–90%", "Recomendada"], ["Platinum", "90–92%", "Premium"]] },
      elegir: ["Potencia con ~30% de margen sobre el consumo", "Que traiga los conectores de CPU y GPU necesarios", "Modular para mejor cableado y flujo de aire"] },
    { name: "Tarjeta madre", vis: "mobo", emoji: "🔲", resumen: "Plataforma de interconexión.",
      qa: { quees: "La placa que conecta todos los componentes.", funcion: "Comunica CPU, RAM, almacenamiento y expansión.", comunicacion: "Define socket, ranuras RAM, PCIe, SATA y cabezales.", carac: "Socket, chipset, tipo de RAM, factor de forma, BIOS/UEFI.", errores: "Socket distinto al del CPU.", incompat: "AM4 no entra en LGA1700; DDR5 no entra en placa DDR4.", rend: "El chipset define líneas PCIe, velocidad de RAM y overclock." },
      tabla: { cols: ["Formato", "Tamaño", "Ranuras (aprox.)"], rows: [["ATX", "Grande", "4 RAM, varias PCIe"], ["microATX", "Mediano", "2–4 RAM"], ["Mini-ITX", "Pequeño", "2 RAM, 1 PCIe"]] },
      elegir: ["Socket y chipset acordes al CPU", "Formato acorde al gabinete", "Puertos, PCIe y M.2 que necesites"] },
    { name: "Procesador (CPU)", vis: "cpu", emoji: "⚙️", resumen: "Ejecuta las instrucciones.",
      qa: { quees: "El 'cerebro' que ejecuta las instrucciones.", funcion: "Procesa datos y coordina las operaciones.", comunicacion: "Habla con la RAM y el resto vía buses de la placa.", carac: "Núcleos/hilos, frecuencia, caché, TDP y socket.", errores: "No poner pasta térmica o socket incompatible.", incompat: "Si el socket no coincide, no encaja.", rend: "Más núcleos/frecuencia = más rendimiento; el TDP exige enfriamiento." },
      tabla: { cols: ["Socket", "Marca", "Ejemplo", "RAM"], rows: [["AM4", "AMD", "Ryzen 5000", "DDR4"], ["AM5", "AMD", "Ryzen 7000", "DDR5"], ["LGA1700", "Intel", "12–14ª gen", "DDR4/DDR5"]] },
      elegir: ["El socket debe coincidir con la placa", "Núcleos/hilos según la carga (juego, edición, cálculo)", "Vigilar el TDP y el enfriamiento requerido"] },
    { name: "Memoria RAM", vis: "ram", emoji: "🧬", resumen: "Memoria temporal de trabajo.",
      qa: { quees: "Memoria volátil de acceso rápido.", funcion: "Guarda temporalmente lo que el CPU usa.", comunicacion: "Se comunica con el CPU por el bus de memoria.", carac: "Capacidad, velocidad, tecnología DDR y canales.", errores: "Una sola ranura (sin dual channel) o módulos incompatibles.", incompat: "DDR4 no entra en placa DDR5 (muesca distinta).", rend: "Más RAM y dual channel mejoran multitarea." },
      tabla: { cols: ["Tecnología", "Voltaje", "Velocidades típicas"], rows: [["DDR3", "1.5 V", "1333–1866 MHz"], ["DDR4", "1.2 V", "2400–3600 MHz"], ["DDR5", "1.1 V", "4800–6400+ MHz"]] },
      elegir: ["Debe coincidir con la placa (DDR4 ≠ DDR5)", "Dos módulos para activar dual channel", "16 GB como mínimo recomendado hoy"] },
    { name: "Almacenamiento", vis: "ssd", emoji: "💾", resumen: "Guarda la información permanentemente.",
      qa: { quees: "Donde se conserva el SO, programas y archivos.", funcion: "Almacena datos de forma permanente.", comunicacion: "M.2/NVMe (PCIe) o SATA (datos + poder).", carac: "Tipo (HDD/SATA/NVMe), capacidad, velocidad.", errores: "No conectar el cable de datos o de poder.", incompat: "Sin almacenamiento no hay dónde instalar el SO.", rend: "Un NVMe acelera enormemente el arranque y la carga." },
      tabla: { cols: ["Tipo", "Interfaz", "Velocidad aprox."], rows: [["HDD", "SATA", "~150 MB/s"], ["SSD SATA", "SATA III", "~550 MB/s"], ["SSD NVMe", "PCIe", "2000–7000 MB/s"]] },
      elegir: ["NVMe para el sistema operativo y programas", "HDD para almacenamiento masivo económico", "Capacidad según tu necesidad real"] },
    { name: "GPU", vis: "gpu", emoji: "🎮", resumen: "Procesa gráficos e imágenes.",
      qa: { quees: "Unidad de procesamiento gráfico, integrada o dedicada.", funcion: "Genera y acelera imágenes, video y cálculo paralelo.", comunicacion: "Ranura PCIe x16 y cable PCIe de poder.", carac: "VRAM, consumo (W), interfaz PCIe, salidas de video.", errores: "No conectar el PCIe de poder o fuente insuficiente.", incompat: "Sin GPU ni iGPU, no hay imagen.", rend: "Clave en juegos, edición, 3D e IA; a más VRAM/potencia, más capacidad." },
      tabla: { cols: ["Tipo", "VRAM", "Consumo", "Uso"], rows: [["Integrada", "comparte RAM", "baja", "Oficina/multimedia"], ["Gama media", "8 GB", "~115 W", "Juegos 1080p"], ["Gama alta", "16–24 GB", "~300–450 W", "4K, IA, 3D"]] },
      elegir: ["VRAM según resolución y uso", "Verificar consumo vs potencia de la fuente", "Tamaño físico vs espacio del gabinete"] },
    { name: "Sistema de enfriamiento", vis: "cooler", emoji: "❄️", resumen: "Controla la temperatura.",
      qa: { quees: "Disipadores/ventiladores (aire) o líquida (AIO).", funcion: "Extrae el calor del CPU y del gabinete.", comunicacion: "Ventilador/bomba al cabezal CPU_FAN.", carac: "Disipación (W), tamaño, tipo (aire/líquida).", errores: "Disipador insuficiente para el TDP o mal montado.", incompat: "Si no disipa el TDP del CPU, se sobrecalienta.", rend: "Buen enfriamiento evita throttling." },
      tabla: { cols: ["Tipo", "Disipación", "Notas"], rows: [["Stock", "~65 W", "Incluido con el CPU"], ["Torre de aire", "~150–220 W", "Silencioso y económico"], ["Líquida AIO", "~250 W+", "Mejor en CPUs potentes"]] },
      elegir: ["Debe superar el TDP del CPU", "Altura del disipador vs gabinete", "Espacio para el radiador si es AIO"] },
    { name: "Periféricos", vis: null, emoji: "⌨️", resumen: "Entrada y salida del usuario.",
      qa: { quees: "Dispositivos externos: monitor, teclado, mouse.", funcion: "Permiten la interacción usuario–computadora.", comunicacion: "USB, video (HDMI/DP) y audio.", carac: "Tipo (entrada/salida/mixto) e interfaz.", errores: "Conectar el monitor a la placa teniendo GPU dedicada.", incompat: "Sin monitor no se ve la salida.", rend: "No afectan el cómputo, sí la experiencia." },
      tabla: { cols: ["Tipo", "Ejemplos"], rows: [["Entrada", "Teclado, mouse, escáner"], ["Salida", "Monitor, impresora, bocinas"], ["Mixto", "Pantalla táctil, diadema con micrófono"]] },
      elegir: ["Interfaz compatible (USB, HDMI/DP)", "Según la tarea: oficina, diseño o juego"] }
  ];

  function renderCatalog() {
    const host = document.getElementById("modCatalogo");
    host.innerHTML =
      `<h2 class="mod-head">2 · Catálogo de componentes</h2>
       <p class="mod-sub">Ficha de cada componente con sus <strong>subtipos</strong>, una <strong>tabla comparativa</strong> y <strong>criterios de selección</strong>. Toca una tarjeta para abrir su ficha.</p>
       <div class="card-grid" id="catGrid"></div>`;
    const grid = host.querySelector("#catGrid");
    CATALOG.forEach(c => {
      const card = document.createElement("div");
      card.className = "cat-card";
      card.innerHTML = (c.vis ? `<div class="cat-visual"></div>` : `<div class="cat-visual" style="font-size:46px">${c.emoji}</div>`) +
        `<h3>${c.emoji} ${c.name}</h3><p>${c.resumen}</p>`;
      if (c.vis) card.querySelector(".cat-visual").appendChild(createVisual(c.vis));
      card.addEventListener("click", () => openCatalogDetail(c));
      grid.appendChild(card);
    });
  }

  function openCatalogDetail(c) {
    const m = id => document.getElementById(id);
    m("specTitle").textContent = c.name;
    m("specRole").textContent = c.resumen;
    const sv = m("specVisual"); sv.innerHTML = "";
    if (c.vis) sv.appendChild(createVisual(c.vis)); else sv.innerHTML = `<div style="font-size:52px">${c.emoji}</div>`;
    const q = c.qa;
    let html =
      `<div class="qa-block">
        <div class="qa"><span class="q">¿Qué es?</span><span class="a">${q.quees}</span></div>
        <div class="qa"><span class="q">¿Qué función cumple?</span><span class="a">${q.funcion}</span></div>
        <div class="qa"><span class="q">¿Cómo se comunica?</span><span class="a">${q.comunicacion}</span></div>
        <div class="qa"><span class="q">¿Qué características revisar?</span><span class="a">${q.carac}</span></div>
        <div class="qa"><span class="q">Errores comunes</span><span class="a">${q.errores}</span></div>
        <div class="qa"><span class="q">¿Qué pasa si no es compatible?</span><span class="a">${q.incompat}</span></div>
        <div class="qa"><span class="q">Impacto en el rendimiento</span><span class="a">${q.rend}</span></div>
      </div>`;
    if (c.tabla) {
      html += `<div class="spec-sheet"><h4>Tipos y comparativa</h4><table class="cmp-table"><thead><tr>` +
        c.tabla.cols.map(x => `<th>${x}</th>`).join("") + `</tr></thead><tbody>` +
        c.tabla.rows.map(r => `<tr>` + r.map(x => `<td>${x}</td>`).join("") + `</tr>`).join("") + `</tbody></table></div>`;
    }
    if (c.elegir) {
      html += `<div class="spec-sheet"><h4>¿Cómo elegirlo?</h4><ul class="pick-list">` +
        c.elegir.map(x => `<li>${x}</li>`).join("") + `</ul></div>`;
    }
    m("specBody").innerHTML = html;
    m("specExtra").hidden = true;
    m("specModal").hidden = false;
  }

  /* =================================================================
     MÓDULO 4 · COMPATIBILIDAD (rigurosa) + DIAGNÓSTICO
     Reglas: socket, tipo/capacidad de RAM, overclock, factor de forma,
     longitud de GPU, altura del disipador, potencia y conectores de la
     fuente, enfriamiento vs TDP, almacenamiento, video y cuello de botella.
     ================================================================= */
  const PARTS = [
    { key: "case", label: "Gabinete", opts: [
      { n: "Full/Mid Tower ATX", supports: ["ATX", "mATX", "ITX"], maxGpu: 360, maxCooler: 170 },
      { n: "MicroATX", supports: ["mATX", "ITX"], maxGpu: 300, maxCooler: 155 },
      { n: "Mini-ITX", supports: ["ITX"], maxGpu: 250, maxCooler: 120 } ] },
    { key: "chipset", label: "Chipset", opts: [
      { n: "AMD A520 · AM4 · DDR4", socket: "AM4", ram: "DDR4", ramMax: 128, oc: false, pcie: "3.0", gama: "Básico" },
      { n: "AMD B550 · AM4 · DDR4", socket: "AM4", ram: "DDR4", ramMax: 128, oc: true, pcie: "4.0", gama: "Medio" },
      { n: "AMD X570 · AM4 · DDR4", socket: "AM4", ram: "DDR4", ramMax: 128, oc: true, pcie: "4.0", gama: "Alto" },
      { n: "AMD X670 · AM5 · DDR5", socket: "AM5", ram: "DDR5", ramMax: 128, oc: true, pcie: "5.0", gama: "Alto" },
      { n: "Intel B660 · LGA1700 · DDR5", socket: "LGA1700", ram: "DDR5", ramMax: 128, oc: false, pcie: "4.0", gama: "Medio" },
      { n: "Intel Z790 · LGA1700 · DDR5", socket: "LGA1700", ram: "DDR5", ramMax: 192, oc: true, pcie: "5.0", gama: "Alto" } ] },
    { key: "mobo", label: "Formato de placa", opts: [
      { n: "ATX (4 ranuras RAM)", ff: "ATX", ramMax: 192, slots: 4 },
      { n: "microATX (4 ranuras RAM)", ff: "mATX", ramMax: 128, slots: 4 },
      { n: "Mini-ITX (2 ranuras RAM)", ff: "ITX", ramMax: 64, slots: 2 } ] },
    { key: "cpu", label: "Procesador", opts: [
      { n: "Ryzen 5 5600 · AM4 (65W)", socket: "AM4", tdp: 65, igpu: false, tier: 2, oc: false },
      { n: "Ryzen 7 5700G · AM4 · iGPU (65W)", socket: "AM4", tdp: 65, igpu: true, tier: 2, oc: false },
      { n: "Ryzen 7 7700 · AM5 · iGPU (65W)", socket: "AM5", tdp: 65, igpu: true, tier: 3, oc: false },
      { n: "Intel i5-13400 · LGA1700 · iGPU (65W)", socket: "LGA1700", tdp: 65, igpu: true, tier: 2, oc: false },
      { n: "Intel i7-13700K · LGA1700 (125W)", socket: "LGA1700", tdp: 125, igpu: true, tier: 4, oc: true } ] },
    { key: "ram", label: "Memoria RAM", opts: [
      { n: "16GB DDR4 3200", type: "DDR4", gb: 16 },
      { n: "32GB DDR4 3600", type: "DDR4", gb: 32 },
      { n: "16GB DDR5 5600", type: "DDR5", gb: 16 },
      { n: "64GB DDR5 6000", type: "DDR5", gb: 64 } ] },
    { key: "cooler", label: "Enfriamiento", opts: [
      { n: "(sin disipador)", tdp: 0, h: 0 },
      { n: "Disipador stock (65W · 45mm)", tdp: 65, h: 45 },
      { n: "Torre de aire (220W · 160mm)", tdp: 220, h: 160 },
      { n: "Líquida AIO 240 (250W · radiador)", tdp: 250, h: 50 } ] },
    { key: "gpu", label: "Tarjeta gráfica", opts: [
      { n: "(usar gráficos integrados)", present: false, tdp: 0, len: 0, conn: 0, tier: 1 },
      { n: "GTX 1650 (75W · 200mm · 0×8pin)", present: true, tdp: 75, len: 200, conn: 0, tier: 2 },
      { n: "RTX 4070 (200W · 300mm · 1×8pin)", present: true, tdp: 200, len: 300, conn: 1, tier: 3 },
      { n: "RTX 4090 (450W · 340mm · 3×8pin)", present: true, tdp: 450, len: 340, conn: 3, tier: 5 } ] },
    { key: "storage", label: "Almacenamiento", opts: [
      { n: "SSD NVMe 1TB", present: true, nvme: true },
      { n: "SSD SATA 512GB", present: true, nvme: false },
      { n: "HDD 2TB", present: true, nvme: false },
      { n: "(ninguno)", present: false, nvme: false } ] },
    { key: "psu", label: "Fuente de poder", opts: [
      { n: "450W · 1×PCIe 8pin", w: 450, pcie: 1 },
      { n: "650W · 2×PCIe 8pin", w: 650, pcie: 2 },
      { n: "850W · 3×PCIe 8pin", w: 850, pcie: 3 },
      { n: "1000W · 4×PCIe 8pin", w: 1000, pcie: 4 } ] }
  ];
  const sel = {};

  function specText(key, o) {
    switch (key) {
      case "case": return `Placas ${o.supports.join("/")} · GPU ≤ ${o.maxGpu}mm · disipador ≤ ${o.maxCooler}mm`;
      case "chipset": return `Socket ${o.socket} · ${o.ram} · PCIe ${o.pcie} · ${o.oc ? "permite" : "sin"} overclock · gama ${o.gama}`;
      case "mobo": return `Formato ${o.ff} · ${o.slots} ranuras · RAM máx ${o.ramMax}GB`;
      case "cpu": return `${o.socket} · TDP ${o.tdp}W · ${o.igpu ? "con iGPU" : "SIN iGPU"}${o.oc ? " · desbloqueado" : ""} · nivel ${o.tier}`;
      case "ram": return `${o.type} · ${o.gb}GB`;
      case "cooler": return o.tdp === 0 ? "Sin sistema de enfriamiento" : `Disipa ${o.tdp}W · alto ${o.h}mm`;
      case "gpu": return o.present ? `Dedicada · ${o.tdp}W · ${o.len}mm · ${o.conn}×8pin · nivel ${o.tier}` : "Integrada (usa el iGPU del CPU)";
      case "storage": return o.present ? (o.nvme ? "SSD NVMe (bus PCIe)" : "Unidad SATA") : "Sin unidad";
      case "psu": return `${o.w}W · ${o.pcie}×PCIe 8pin`;
    }
    return "";
  }

  function renderConfig() {
    const host = document.getElementById("modCompat");
    host.innerHTML =
      `<h2 class="mod-head">4 · Reglas de compatibilidad</h2>
       <p class="mod-sub">Arma tu equipo eligiendo un modelo por componente. Al <strong>Probar encendido</strong> se validan la compatibilidad <em>física</em> (socket, RAM, factor de forma, longitud de GPU, altura del disipador), la <em>eléctrica/térmica</em> (potencia y conectores de la fuente, enfriamiento) y los <em>requisitos de funcionamiento</em>, con la explicación de cada regla y una nota de <strong>cuello de botella</strong>.</p>
       <div class="config-wrap">
         <div class="panel"><h2>Configuración</h2><div id="configRows"></div>
           <button id="testBtn" class="primary-btn">⏻ Probar encendido</button>
           <div class="summary" id="cfgSummary"></div>
         </div>
         <div class="panel diag-panel"><h2>Diagnóstico</h2><div id="diagOut"><p class="small-text">Elige tus componentes y pulsa “Probar encendido”. Verás por qué es (o no) compatible.</p></div></div>
       </div>`;
    const rows = host.querySelector("#configRows");
    PARTS.forEach(p => {
      sel[p.key] = 0;
      const row = document.createElement("div");
      row.className = "config-row2";
      row.innerHTML = `<label>${p.label}</label><select data-key="${p.key}">${p.opts.map((o, i) => `<option value="${i}">${o.n}</option>`).join("")}</select>
        <span class="spec-chip" data-chip="${p.key}">${specText(p.key, p.opts[0])}</span>`;
      row.querySelector("select").addEventListener("change", e => {
        sel[p.key] = +e.target.value;
        row.querySelector(".spec-chip").textContent = specText(p.key, p.opts[sel[p.key]]);
        updateSummary();
      });
      rows.appendChild(row);
    });
    host.querySelector("#testBtn").addEventListener("click", runDiagnosis);
    updateSummary();
  }

  function opt(key) { const p = PARTS.find(x => x.key === key); return p.opts[sel[key]]; }
  function needWatts() { const c = opt("cpu"), g = opt("gpu"); return 120 + c.tdp + g.tdp; }

  function updateSummary() {
    const cpu = opt("cpu"), gpu = opt("gpu");
    const need = needWatts();
    const rec = Math.ceil((need * 1.3) / 50) * 50;
    document.getElementById("cfgSummary").innerHTML =
      `<h3>Resumen técnico</h3>
       <table class="spec-table"><tbody>${PARTS.map(p => `<tr><td>${p.label}</td><td>${specText(p.key, opt(p.key))}</td></tr>`).join("")}</tbody></table>
       <h3 style="margin-top:12px">Consumo estimado</h3>
       <table class="spec-table"><tbody>
         <tr><td>Base (placa, discos, ventiladores)</td><td>120 W</td></tr>
         <tr><td>CPU</td><td>${cpu.tdp} W</td></tr>
         <tr><td>GPU</td><td>${gpu.tdp} W</td></tr>
         <tr><td><strong>Total estimado</strong></td><td><strong>~${need} W</strong></td></tr>
         <tr><td>Fuente recomendada</td><td>≥ ${rec} W (≈30% de margen)</td></tr>
       </tbody></table>`;
  }

  function runDiagnosis() {
    const out = document.getElementById("modCompat").querySelector("#diagOut");
    const cpu = opt("cpu"), mobo = opt("mobo"), ram = opt("ram"), cooler = opt("cooler"),
          gpu = opt("gpu"), storage = opt("storage"), psu = opt("psu"), casev = opt("case"), chip = opt("chipset");
    const ramMax = Math.min(chip.ramMax, mobo.ramMax);
    const groups = [];

    const fis = [];
    fis.push(cpu.socket === chip.socket
      ? { s: "ok", t: `Socket compatible (${cpu.socket}).`, w: "El chipset determina el socket de la placa, y el CPU debe coincidir con él." }
      : { s: "bad", t: `CPU incompatible: socket ${cpu.socket} ≠ ${chip.socket} del chipset ${chip.n.split(" ·")[0]}.`, w: "Cada chipset se fabrica para un socket concreto: un Ryzen AM4 no entra en una placa Intel LGA1700." });
    fis.push(ram.type === chip.ram
      ? { s: "ok", t: `RAM ${ram.type} compatible con el chipset.`, w: "El controlador de memoria del chipset define si la placa acepta DDR4 o DDR5." }
      : { s: "bad", t: `RAM no detectada: el chipset admite ${chip.ram} y elegiste ${ram.type}.`, w: "DDR4 y DDR5 tienen la muesca en distinta posición: no son intercambiables." });
    fis.push(ram.gb <= ramMax
      ? { s: "ok", t: `Capacidad de RAM dentro del límite (${ram.gb} ≤ ${ramMax} GB).`, w: "El límite real es el menor entre lo que admite el chipset y las ranuras del formato." }
      : { s: "bad", t: `Demasiada RAM: ${ram.gb} GB supera el máximo de esta combinación (${ramMax} GB).`, w: `El chipset admite hasta ${chip.ramMax} GB y el formato ${mobo.ff} llega a ${mobo.ramMax} GB con sus ${mobo.slots} ranuras.` });
    fis.push(!cpu.oc || chip.oc
      ? { s: "ok", t: cpu.oc ? `El chipset ${chip.gama.toLowerCase()} permite overclock del CPU desbloqueado.` : "Configuración de frecuencias correcta.", w: "Solo los chipsets de gama alta (Z, X) permiten subir la frecuencia del procesador." }
      : { s: "info", t: `Overclock no disponible: el CPU está desbloqueado pero el chipset no lo permite.`, w: "El equipo funciona, pero pagaste por un CPU desbloqueado que no podrás aprovechar. Sería mejor un chipset Z790 o X." });
    fis.push(casev.supports.indexOf(mobo.ff) !== -1
      ? { s: "ok", t: `Factor de forma correcto: placa ${mobo.ff} entra en el gabinete.`, w: "El gabinete debe soportar el tamaño de la placa (ATX > microATX > ITX)." }
      : { s: "bad", t: `La placa (${mobo.ff}) no cabe en el gabinete.`, w: "Un gabinete pequeño no admite placas más grandes." });
    if (gpu.present) fis.push(gpu.len <= casev.maxGpu
      ? { s: "ok", t: `La GPU (${gpu.len}mm) cabe en el gabinete (≤ ${casev.maxGpu}mm).`, w: "Las tarjetas largas requieren gabinetes con suficiente espacio." }
      : { s: "bad", t: `La GPU (${gpu.len}mm) es más larga que el máximo del gabinete (${casev.maxGpu}mm).`, w: "Si la GPU no cabe, no se puede instalar." });
    fis.push(cooler.h <= casev.maxCooler
      ? { s: "ok", t: `El disipador (${cooler.h}mm) cabe (≤ ${casev.maxCooler}mm).`, w: "La altura del disipador de aire está limitada por el ancho del gabinete." }
      : { s: "bad", t: `El disipador (${cooler.h}mm) es más alto que el máximo del gabinete (${casev.maxCooler}mm).`, w: "Un disipador muy alto choca con el panel lateral." });
    groups.push({ title: "Compatibilidad física", checks: fis });

    const ele = [];
    const need = needWatts();
    if (psu.w < need) ele.push({ s: "bad", t: `Fuente insuficiente: pide ~${need} W y la fuente da ${psu.w} W.`, w: "La suma de consumos no debe superar la potencia de la fuente." });
    else if (psu.w < need * 1.25) ele.push({ s: "info", t: `Fuente justa: ${psu.w} W para ~${need} W.`, w: "Funciona, pero se recomienda ~30% de margen para picos y eficiencia." });
    else ele.push({ s: "ok", t: `Fuente adecuada: ${psu.w} W para ~${need} W.`, w: "Con margen suficiente el sistema es estable bajo carga." });
    if (gpu.present) ele.push(psu.pcie >= gpu.conn
      ? { s: "ok", t: `Conectores PCIe suficientes (${psu.pcie} ≥ ${gpu.conn} que pide la GPU).`, w: "La GPU necesita cables PCIe de 8 pines desde la fuente." }
      : { s: "bad", t: `Faltan conectores: la GPU pide ${gpu.conn}×8pin y la fuente tiene ${psu.pcie}.`, w: "Sin los conectores PCIe correctos la GPU no recibe energía." });
    if (cooler.tdp === 0)
      ele.push({ s: "bad", t: `Sin enfriamiento: el procesador no tiene disipador y genera ${cpu.tdp} W de calor.`, w: "Sin disipador el CPU alcanza su temperatura crítica en segundos y la placa corta la energía para protegerlo." });
    else
      ele.push(cooler.tdp >= cpu.tdp
      ? { s: "ok", t: `Enfriamiento suficiente para ${cpu.tdp} W.`, w: "El disipador debe poder disipar al menos el TDP del CPU." }
      : { s: "bad", t: `Enfriamiento insuficiente: disipa ${cooler.tdp} W y el CPU genera ${cpu.tdp} W.`, w: "Un disipador corto provoca throttling o sobrecalentamiento." });
    groups.push({ title: "Compatibilidad eléctrica y térmica", checks: ele });

    const req = [];
    req.push(storage.present
      ? { s: "ok", t: "Almacenamiento presente.", w: "Se necesita al menos una unidad para instalar el sistema operativo." }
      : { s: "bad", t: "Sin almacenamiento: no hay dónde instalar el SO.", w: "Sin disco, el equipo no puede arrancar un sistema operativo." });
    req.push((gpu.present || cpu.igpu)
      ? { s: "ok", t: gpu.present ? "Video por GPU dedicada." : "Video por gráficos integrados del CPU.", w: "Se necesita una salida de video: GPU dedicada o iGPU del CPU." }
      : { s: "bad", t: "Sin video: el CPU no tiene iGPU y no hay GPU.", w: "Sin fuente de video no hay imagen en pantalla." });
    groups.push({ title: "Requisitos de funcionamiento", checks: req });

    const notes = [];
    if (gpu.present) {
      const diff = gpu.tier - cpu.tier;
      if (diff >= 2) notes.push({ s: "info", t: "Posible cuello de botella: el CPU podría quedarse corto frente a una GPU tan potente.", w: "Un CPU muy inferior limita el rendimiento que la GPU puede entregar." });
      else if (diff <= -2) notes.push({ s: "info", t: "El CPU supera con holgura a la GPU: la gráfica será el límite.", w: "Equilibra el presupuesto: podrías subir de GPU." });
      else notes.push({ s: "ok", t: "CPU y GPU están razonablemente equilibrados.", w: "Un buen balance evita cuellos de botella." });
    }
    if (notes.length) groups.push({ title: "Balance de rendimiento", checks: notes });

    const fail = groups.flatMap(g => g.checks).some(c => c.s === "bad");
    let html = `<div class="diag-verdict ${fail ? "bad" : "ok"}">${fail ? "❌ LA PC NO ARRANCA — corrige los errores marcados" : "✅ SISTEMA FUNCIONAL — POST correcto"}</div>`;
    groups.forEach(g => {
      html += `<h3 class="diag-group">${g.title}</h3>`;
      html += g.checks.map(c => {
        const ic = c.s === "ok" ? "✓" : (c.s === "bad" ? "✕" : "!");
        return `<div class="diag-line ${c.s}"><strong>${ic}</strong><span>${c.t}<br><em class="why">${c.w}</em></span></div>`;
      }).join("");
    });
    out.innerHTML = html;
  }

  /* =================================================================
     MÓDULO 5 · AUTOEVALUACIÓN
     ================================================================= */
  const POOL = [
    { type: "mc", q: "¿Qué componente ejecuta las instrucciones del sistema?", opts: ["El procesador (CPU)", "La memoria RAM", "La fuente de poder", "El gabinete"], correct: 0, fb: "El CPU es el 'cerebro': ejecuta el ciclo de instrucción." },
    { type: "mc", q: "¿Qué debe coincidir entre el CPU y la tarjeta madre?", opts: ["El socket", "El color", "La marca de la RAM", "El tamaño del gabinete"], correct: 0, fb: "El socket del CPU debe coincidir con el de la placa o no encaja." },
    { type: "mc", q: "Si la fuente no tiene suficiente potencia, lo más probable es que…", opts: ["El sistema no encienda o se apague bajo carga", "La RAM aumente", "Mejore el rendimiento", "No pase nada"], correct: 0, fb: "Una fuente insuficiente provoca apagones o que no encienda." },
    { type: "mc", q: "¿Cuál es el almacenamiento más rápido?", opts: ["SSD NVMe", "HDD 5400 RPM", "Disquete", "Cinta magnética"], correct: 0, fb: "El SSD NVMe (PCIe) es mucho más rápido que SATA y que un HDD." },
    { type: "mc", q: "Aparece “RAM no detectada”. ¿Qué revisas primero?", opts: ["Que la RAM sea del tipo correcto (DDR) y esté bien encajada", "La tarjeta gráfica", "El gabinete", "El mouse"], correct: 0, fb: "El mensaje apunta a la memoria: tipo DDR correcto y bien asentada." },
    { type: "mc", q: "¿Qué componente define el socket, el chipset y el tipo de RAM soportado?", opts: ["La tarjeta madre", "La GPU", "La fuente", "El disipador"], correct: 0, fb: "La tarjeta madre es la plataforma que define la compatibilidad." },
    { type: "mc", q: "¿En qué ranura se instala una GPU dedicada?", opts: ["PCIe x16", "Ranura de RAM", "Puerto SATA", "Socket del CPU"], correct: 0, fb: "La GPU va en la ranura PCIe x16." },
    { type: "mc", q: "¿Qué conector alimenta específicamente al CPU?", opts: ["EPS de 8 pines", "ATX de 24 pines", "SATA", "USB"], correct: 0, fb: "El EPS 8-pin alimenta el CPU; el ATX 24-pin alimenta la placa." },
    { type: "mc", q: "¿Cómo se activa el dual channel en la RAM?", opts: ["Con 2 módulos en las ranuras A2/B2", "Con un solo módulo grande", "Overclocking del CPU", "Instalando más discos"], correct: 0, fb: "Dos módulos en A2/B2 activan el dual channel." },
    { type: "mc", q: "¿Qué indica el TDP de un procesador?", opts: ["El calor/potencia que debe disipar el enfriamiento", "Los terabytes de disco", "La velocidad de internet", "El número de puertos USB"], correct: 0, fb: "El TDP orienta cuánta disipación necesita el CPU." },
    { type: "mc", q: "¿Qué hace el POST al encender la PC?", opts: ["Un autodiagnóstico del hardware", "Instala programas", "Formatea el disco", "Sube archivos a la nube"], correct: 0, fb: "El POST verifica el hardware básico antes de arrancar el SO." },
    { type: "mc", q: "Si no aplicas pasta térmica al CPU, ¿qué ocurre?", opts: ["Mala transferencia de calor y sobrecalentamiento", "Más FPS", "Más RAM", "Nada"], correct: 0, fb: "La pasta mejora la transferencia de calor CPU→disipador." },
    { type: "mc", q: "¿Cuál es el factor de forma de placa más grande?", opts: ["ATX", "microATX", "Mini-ITX", "Nano-ITX"], correct: 0, fb: "ATX > microATX > Mini-ITX en tamaño." },
    { type: "mc", q: "Tu CPU no tiene gráficos integrados y no hay imagen. ¿Qué haces?", opts: ["Instalar una GPU dedicada", "Cambiar el mouse", "Quitar un disco", "Subir el brillo del monitor"], correct: 0, fb: "Sin iGPU necesitas una GPU dedicada para tener video." },
    { type: "mc", q: "La VRAM pertenece a…", opts: ["La GPU", "El CPU", "La fuente", "El gabinete"], correct: 0, fb: "La VRAM es la memoria dedicada de la tarjeta gráfica." },
    { type: "mc", q: "¿Qué cable lleva los DATOS de un SSD SATA a la placa?", opts: ["Cable SATA de datos", "Cable PCIe", "Cable EPS", "Cable HDMI"], correct: 0, fb: "El SATA de datos conecta el disco con un puerto SATA de la placa." },
    { type: "tf", q: "La memoria RAM conserva los datos aunque se apague la computadora.", correct: false, fb: "Falso: la RAM es volátil; se borra al apagar." },
    { type: "tf", q: "Un CPU sin gráficos integrados necesita una GPU para dar video.", correct: true, fb: "Verdadero: sin iGPU ni GPU no hay imagen." },
    { type: "tf", q: "El SSD NVMe se instala en una ranura M.2 y usa el bus PCIe.", correct: true, fb: "Verdadero: NVMe aprovecha PCIe por la ranura M.2." },
    { type: "tf", q: "Una fuente de más watts siempre da más rendimiento.", correct: false, fb: "Falso: da margen y estabilidad, no más rendimiento por sí sola." },
    { type: "tf", q: "microATX es un formato de placa más grande que ATX.", correct: false, fb: "Falso: ATX es más grande que microATX." },
    { type: "tf", q: "El ventilador del disipador se conecta al cabezal CPU_FAN.", correct: true, fb: "Verdadero: así la placa controla sus RPM." },
    { type: "order", q: "Ordena los pasos del ensamble:", items: ["Colocar separadores (standoffs)", "Montar la tarjeta madre", "Instalar el CPU", "Colocar la RAM", "Cerrar el gabinete"], correct: [0, 1, 2, 3, 4], fb: "Primero la base y la placa, luego CPU/RAM, y al final se cierra." },
    { type: "order", q: "Ordena la secuencia de arranque:", items: ["Presionar el botón de encendido", "POST (autodiagnóstico)", "BIOS/UEFI inicializa el hardware", "Carga del sistema operativo", "Escritorio listo"], correct: [0, 1, 2, 3, 4], fb: "Power → POST → BIOS/UEFI → SO → escritorio." },
    { type: "order", q: "Ordena la ruta de los datos al abrir un programa:", items: ["Almacenamiento (SSD/HDD)", "Memoria RAM", "Procesador (CPU)", "Salida en pantalla"], correct: [0, 1, 2, 3], fb: "Del disco a la RAM, la procesa el CPU y se muestra en pantalla." },
    { type: "match", q: "Relaciona cada componente con su función:", terms: ["CPU", "RAM", "SSD", "GPU"], answers: ["Ejecuta instrucciones", "Memoria temporal de trabajo", "Almacenamiento permanente", "Procesa gráficos"], fb: "CPU→ejecuta, RAM→temporal, SSD→permanente, GPU→gráficos." },
    { type: "match", q: "Relaciona cada conector con lo que alimenta/conecta:", terms: ["EPS 8-pin", "ATX 24-pin", "PCIe", "SATA"], answers: ["Alimenta el CPU", "Alimenta la placa madre", "Alimenta la GPU", "Datos/energía de discos"], fb: "EPS→CPU, ATX→placa, PCIe→GPU, SATA→discos." },
    { type: "match", q: "Relaciona el concepto con su ejemplo:", terms: ["Memoria volátil", "Memoria permanente", "Dispositivo de entrada", "Dispositivo de salida"], answers: ["RAM", "SSD", "Teclado", "Monitor"], fb: "Volátil→RAM, permanente→SSD, entrada→teclado, salida→monitor." },
    { type: "match", q: "Relaciona cada característica con su componente:", terms: ["Socket", "VRAM", "Watts (W)", "DDR4/DDR5"], answers: ["CPU / placa", "GPU", "Fuente de poder", "Memoria RAM"], fb: "Socket→CPU/placa, VRAM→GPU, Watts→fuente, DDR→RAM." }
  ];

  const N_QUIZ = 12;
  let QUIZ = [], qi = 0, score = 0, answered = false;

  function renderQuizHome() {
    const host = document.getElementById("modQuiz");
    host.innerHTML =
      `<h2 class="mod-head">5 · Autoevaluación</h2>
       <p class="mod-sub">${N_QUIZ} preguntas aleatorias de un banco de ${POOL.length}, de varios tipos (opción múltiple, verdadero/falso, ordenamiento y relación de columnas) con retroalimentación inmediata. Cada intento es distinto.</p>
       <div class="quiz-wrap" id="quizWrap"></div>`;
    QUIZ = shuffle(POOL.slice()).slice(0, N_QUIZ);
    qi = 0; score = 0;
    renderQuestion();
  }

  function renderQuestion() {
    answered = false;
    const wrap = document.getElementById("quizWrap");
    if (qi >= QUIZ.length) return renderQuizResult();
    const item = QUIZ[qi];
    const typeName = { mc: "Opción múltiple", tf: "Verdadero / Falso", order: "Ordenamiento", match: "Relación de columnas" }[item.type];
    let body = "";

    if (item.type === "mc") {
      const order = shuffle(item.opts.map((_, i) => i));
      body = `<div class="q-options">` + order.map(i => `<button class="q-opt" data-i="${i}">${item.opts[i]}</button>`).join("") + `</div>`;
    } else if (item.type === "tf") {
      body = `<div class="q-options"><button class="q-opt" data-i="true">Verdadero</button><button class="q-opt" data-i="false">Falso</button></div>`;
    } else if (item.type === "order") {
      const idxs = shuffle(item.items.map((_, i) => i));
      if (idxs.every((v, k) => v === item.correct[k])) { const t = idxs[0]; idxs[0] = idxs[1]; idxs[1] = t; }
      body = `<p class="small-text" style="margin:0 0 10px">Usa ▲▼ para acomodar en el orden correcto.</p><div id="orderList">` +
        idxs.map(i => `<div class="q-order-item" data-i="${i}"><span>${item.items[i]}</span><span class="ord-btns"><button data-d="-1">▲</button><button data-d="1">▼</button></span></div>`).join("") + `</div>`;
    } else if (item.type === "match") {
      const optOrder = shuffle(item.answers.map((_, j) => j));
      const optsHtml = optOrder.map(j => `<option value="${j}">${item.answers[j]}</option>`).join("");
      body = item.terms.map((t, i) => `<div class="q-match-row"><span class="m-term">${t}</span><select data-i="${i}"><option value="-1">— elige —</option>${optsHtml}</select></div>`).join("");
    }

    wrap.innerHTML =
      `<div class="quiz-progress">Pregunta ${qi + 1} de ${QUIZ.length} · Aciertos: ${score}</div>
       <div class="q-card">
         <span class="q-type">${typeName}</span>
         <p class="q-text">${item.q}</p>
         ${body}
         <div id="qFeedback"></div>
         <div class="q-actions">
           <button id="qCheck" class="primary-btn" style="width:auto">Comprobar</button>
           <button id="qNext" class="view-btn" style="display:none">Siguiente ▸</button>
         </div>
       </div>`;

    if (item.type === "mc" || item.type === "tf") {
      wrap.querySelectorAll(".q-opt").forEach(b => b.addEventListener("click", () => {
        if (answered) return;
        wrap.querySelectorAll(".q-opt").forEach(x => { x.removeAttribute("data-picked"); x.style.outline = ""; });
        b.dataset.picked = "1"; b.style.outline = "2px solid #7ed7ff";
      }));
    }
    if (item.type === "order") {
      wrap.querySelectorAll(".ord-btns button").forEach(b => b.addEventListener("click", () => {
        if (answered) return;
        const list = wrap.querySelector("#orderList"), row = b.closest(".q-order-item"), d = +b.dataset.d;
        if (d === -1 && row.previousElementSibling) list.insertBefore(row, row.previousElementSibling);
        if (d === 1 && row.nextElementSibling) list.insertBefore(row.nextElementSibling, row);
      }));
    }
    wrap.querySelector("#qCheck").addEventListener("click", () => checkAnswer(item, wrap));
    wrap.querySelector("#qNext").addEventListener("click", () => { qi++; renderQuestion(); });
  }

  function feedback(wrap, ok, text) {
    const fb = wrap.querySelector("#qFeedback");
    fb.className = "q-feedback " + (ok ? "ok" : "bad");
    fb.innerHTML = (ok ? "✅ ¡Correcto! " : "❌ Revisa: ") + text;
    wrap.querySelector("#qCheck").style.display = "none";
    wrap.querySelector("#qNext").style.display = "inline-block";
    answered = true;
    if (ok) score++;
  }

  function checkAnswer(item, wrap) {
    if (answered) return;
    if (item.type === "mc" || item.type === "tf") {
      const picked = wrap.querySelector('.q-opt[data-picked="1"]');
      if (!picked) return showToast("Elige una opción.");
      wrap.querySelectorAll(".q-opt").forEach(b => b.classList.add("disabled"));
      if (item.type === "mc") {
        const i = +picked.dataset.i;
        wrap.querySelectorAll(".q-opt").forEach(b => { if (+b.dataset.i === item.correct) b.classList.add("correct"); });
        if (i !== item.correct) picked.classList.add("wrong");
        feedback(wrap, i === item.correct, item.fb);
      } else {
        const val = picked.dataset.i === "true";
        wrap.querySelectorAll(".q-opt").forEach(b => { if ((b.dataset.i === "true") === item.correct) b.classList.add("correct"); });
        if (val !== item.correct) picked.classList.add("wrong");
        feedback(wrap, val === item.correct, item.fb);
      }
    } else if (item.type === "order") {
      const order = [...wrap.querySelectorAll(".q-order-item")].map(r => +r.dataset.i);
      feedback(wrap, order.every((v, idx) => v === item.correct[idx]), item.fb);
    } else if (item.type === "match") {
      const rows = [...wrap.querySelectorAll(".q-match-row select")];
      if (rows.some(s => s.value === "-1")) return showToast("Relaciona todas las filas.");
      rows.forEach((s, i) => { s.style.borderColor = (+s.value === i) ? "#52ffb8" : "#ff6262"; });
      feedback(wrap, rows.every((s, i) => +s.value === i), item.fb);
    }
  }

  function renderQuizResult() {
    const wrap = document.getElementById("quizWrap");
    const pct = Math.round(score / QUIZ.length * 100);
    const msg = pct >= 80 ? "¡Excelente! Dominas la arquitectura de la PC." :
                pct >= 50 ? "Bien, pero repasa la teoría y el catálogo." :
                            "Conviene repasar los módulos 1 y 2 y volver a intentar.";
    wrap.innerHTML =
      `<div class="q-card quiz-result">
         <div class="score">${score} / ${QUIZ.length}</div>
         <p style="font-size:20px;margin:6px 0 4px">${pct}% de aciertos</p>
         <p class="small-text" style="margin-bottom:16px">${msg}</p>
         <button id="qRetry" class="primary-btn" style="width:auto">Reintentar (nuevas preguntas)</button>
       </div>`;
    wrap.querySelector("#qRetry").addEventListener("click", renderQuizHome);
  }

  /* =================================================================
     MÓDULO 6 · Biblioteca
     ================================================================= */
  
  let Biblioteca = {};

  /* El catálogo vive en biblioteca/catalogo.json:
     para agregar un componente solo añade una entrada allí. */
  async function cargarCatalogo() {
    if (Object.keys(Biblioteca).length) return;

    const respuesta = await fetch("./biblioteca/catalogo.json");

    if (!respuesta.ok) {
      throw new Error("No se pudo cargar biblioteca/catalogo.json");
    }

    Biblioteca = await respuesta.json();
  }


/* ================================================================
   COMPONENTES CSS DE LA BIBLIOTECA
   ================================================================ */

const BIBLIOTECA_CSS_CARGADOS = new Set();


async function cargarComponenteCSS(nombre) {
  if (!BIBLIOTECA_CSS_CARGADOS.has(nombre)) {
    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = `./biblioteca/${nombre}.css`;
    link.dataset.bibliotecaCss = nombre;

    document.head.appendChild(link);

    await new Promise((resolve, reject) => {
      link.onload = resolve;
      link.onerror = () =>
        reject(new Error(`No se pudo cargar biblioteca/${nombre}.css`));
    });

    BIBLIOTECA_CSS_CARGADOS.add(nombre);
  }

  const respuesta = await fetch(`./biblioteca/${nombre}.html`);

  if (!respuesta.ok) {
    throw new Error(`No se pudo cargar biblioteca/${nombre}.html`);
  }

  return await respuesta.text();
}

function activarControlesCSS(contenedor) {
  const viewport = contenedor.querySelector(".flip-viewport");
  const inner = contenedor.querySelector(".flip-inner");

  if (!viewport || !inner) return;

  let rotacionY = 0;
  let rotacionX = 0;
  let escala = 1;

  let arrastrando = false;
  let inicioX = 0;
  let inicioY = 0;

  inner.style.animation = "none";

  function actualizar() {
    inner.style.transform =
      `rotateX(${rotacionX}deg) ` +
      `rotateY(${rotacionY}deg) ` +
      `scale(${escala})`;
  }

  viewport.addEventListener("pointerdown", (e) => {
    arrastrando = true;

    inicioX = e.clientX;
    inicioY = e.clientY;

    viewport.setPointerCapture(e.pointerId);
    viewport.style.cursor = "grabbing";
  });

  viewport.addEventListener("pointermove", (e) => {
    if (!arrastrando) return;

    const movimientoX = e.clientX - inicioX;
    const movimientoY = e.clientY - inicioY;

    rotacionY += movimientoX * 0.5;
    rotacionX -= movimientoY * 0.5;

    inicioX = e.clientX;
    inicioY = e.clientY;

    actualizar();
  });

  function terminarArrastre(e) {
    arrastrando = false;
    viewport.style.cursor = "grab";

    try {
      viewport.releasePointerCapture(e.pointerId);
    } catch {}
  }

  viewport.addEventListener("pointerup", terminarArrastre);
  viewport.addEventListener("pointercancel", terminarArrastre);
  viewport.addEventListener("pointerleave", () => {
    if (arrastrando) {
      arrastrando = false;
      viewport.style.cursor = "grab";
    }
  });

  viewport.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      if (e.deltaY < 0) {
        escala += 0.1;
      } else {
        escala -= 0.1;
      }

      escala = Math.max(0.5, Math.min(2, escala));

      actualizar();
    },
    { passive: false }
  );

  viewport.style.cursor = "grab";
  viewport.style.touchAction = "none";

  actualizar();
}


/* ================================================================
   OBTENER VISUAL DEL COMPONENTE
   ================================================================ */

async function obtenerVisualBiblioteca(component) {
  const modelo = Biblioteca[component.id];

  if (!modelo) {
    throw new Error(
      `No existe el componente ${component.id} en Biblioteca`
    );
  }

  if (modelo.tipo === "css") {
    return await cargarComponenteCSS(modelo.archivo);
  }

  if (!modelo.modelo) {
    throw new Error(
      `El componente ${component.id} no tiene un modelo definido`
    );
  }

  return `
    <model-viewer
      src="${modelo.modelo}"
      camera-controls
      auto-rotate
      shadow-intensity="1"
      exposure="1"
      interaction-prompt="none"
      alt="${component.name}">
    </model-viewer>
  `;
}


/* ================================================================
   BIBLIOTECA
   ================================================================ */

async function renderGlossary() {

  try {
    await cargarCatalogo();
  } catch (error) {
    console.error(error);
    document.getElementById("modGloss").innerHTML =
      `<div class="biblioteca-empty"><p>No se pudo cargar el catálogo.</p><small>${error.message}</small></div>`;
    return;
  }


  const host =
    document.getElementById("modGloss");


  const piezas = Object.entries(Biblioteca).map(([id, modelo]) => {
    const componente = getComponent(id);

    return componente || {
      id: id,
      name: modelo.nombre || id,
      short: modelo.descripcion || "Componente de la biblioteca.",
      info: modelo.descripcion || "Sin descripción disponible."
    };
  });


  const categorias = [
    "Todos",
    ...new Set(Object.values(Biblioteca).map(m => m.categoria))
  ];

  const botonesFiltro = categorias.map(c => `
    <button
      class="biblioteca-filter${c === "Todos" ? " active" : ""}"
      data-cat="${c}">
      ${c}
    </button>
  `).join("");


  host.innerHTML = `

    <div class="biblioteca-head">

      <div>

        <h2 class="mod-head">
          Biblioteca 3D
        </h2>

        <p class="mod-sub">
          Explora los componentes de una PC mediante
          modelos tridimensionales interactivos.
        </p>

      </div>


      <input
        id="bibliotecaSearch"
        class="biblioteca-search"
        type="text"
        placeholder="Buscar componente..."
      >

    </div>


    <div class="biblioteca-filtros">

      ${botonesFiltro}


    </div>


    <div
      id="bibliotecaViewer"
      class="biblioteca-viewer"
      hidden>
    </div>


    <div
      id="bibliotecaGrid"
      class="biblioteca-grid">
    </div>

  `;


  const grid =
    host.querySelector(
      "#bibliotecaGrid"
    );


  const viewer =
    host.querySelector(
      "#bibliotecaViewer"
    );


  const search =
    host.querySelector(
      "#bibliotecaSearch"
    );


  let categoriaActual = "Todos";


  /* ================================================================
     PINTAR TARJETAS
     ================================================================ */

  async function pintarBiblioteca() {

    const texto =
      search.value
        .toLowerCase()
        .trim();


    const filtradas =
      piezas.filter(c => {

        const modelo =
          Biblioteca[c.id];


        const coincideTexto =
          !texto ||

          c.name
            .toLowerCase()
            .includes(texto) ||

          c.short
            .toLowerCase()
            .includes(texto);


        const coincideCategoria =
          categoriaActual === "Todos" ||

          modelo.categoria ===
            categoriaActual;


        return (
          coincideTexto &&
          coincideCategoria
        );

      });


    grid.innerHTML = "";


    if (!filtradas.length) {

      grid.innerHTML = `

        <div class="biblioteca-empty">

          <p>
            No se encontraron componentes.
          </p>

        </div>

      `;

      return;

    }


    for (const c of filtradas) {

      const modelo =
        Biblioteca[c.id];


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "biblioteca-card";


      card.innerHTML = `

        <div class="biblioteca-card-model">

          <div class="biblioteca-loading">
            Cargando...
          </div>

        </div>


        <div class="biblioteca-card-body">

          <span class="biblioteca-category">
            ${modelo.categoria}
          </span>


          <h3>
            ${c.name}
          </h3>


          <p>
            ${c.short}
          </p>


          <button
            class="biblioteca-open"
            data-id="${c.id}">
            Ver modelo
          </button>

        </div>

      `;


      grid.appendChild(card);


      try {

        const visual =
          await obtenerVisualBiblioteca(c);


        card.querySelector(
          ".biblioteca-card-model"
        ).innerHTML = visual;


      } catch (error) {

        console.error(error);


        card.querySelector(
          ".biblioteca-card-model"
        ).innerHTML = `

          <div class="biblioteca-empty">

            <p>
              No se pudo cargar el componente.
            </p>

          </div>

        `;

      }


      card
        .querySelector(
          ".biblioteca-open"
        )
        .addEventListener(
          "click",
          () => {

            abrirModeloBiblioteca(c);

          }
        );

    }

  }


  /* ================================================================
     Visor grande
     ================================================================ */

  async function abrirModeloBiblioteca(component) {
  const modelo = Biblioteca[component.id];

  if (!modelo) {
    console.error("No existe en Biblioteca:", component.id);
    return;
  }

  viewer.hidden = false;

  viewer.innerHTML = `
    <div class="biblioteca-viewer">
      <button
        type="button"
        id="cerrarBibliotecaViewer"
        class="biblioteca-close">
        ×
      </button>

      <div
        id="bibliotecaVisualGrande"
        class="biblioteca-visual-grande">
      </div>

      <div class="biblioteca-viewer-info">
        <h2>${component.name}</h2>
        <p>${component.short || ""}</p>
      </div>
    </div>
  `;

  try {
    const visual = await obtenerVisualBiblioteca(component);

    const contenedor =
      viewer.querySelector("#bibliotecaVisualGrande");

    if (!contenedor) {
      throw new Error(
        "No se encontró el contenedor del modelo."
      );
    }

    contenedor.innerHTML = visual;

    if (modelo.tipo === "css") {
      activarControlesCSS(contenedor);
    }
  } catch (error) {
    console.error(
      "Error al abrir el modelo:",
      error
    );

    const contenedor =
      viewer.querySelector("#bibliotecaVisualGrande");

    if (contenedor) {
      contenedor.innerHTML = `
        <div class="biblioteca-empty">
          <p>No se pudo cargar el componente.</p>
          <small>${error.message}</small>
        </div>
      `;
    }
  }

  const botonCerrar =
    viewer.querySelector("#cerrarBibliotecaViewer");

  if (botonCerrar) {
    botonCerrar.addEventListener("click", () => {
      viewer.hidden = true;
      viewer.innerHTML = "";
    });
  }
}


  /* ================================================================
     BUSCADOR
     ================================================================ */

  search.addEventListener(
    "input",
    pintarBiblioteca
  );


  /* ================================================================
     FILTROS
     ================================================================ */

  host
    .querySelectorAll(
      ".biblioteca-filter"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          host
            .querySelectorAll(
              ".biblioteca-filter"
            )
            .forEach(b =>
              b.classList.remove(
                "active"
              )
            );


          button.classList.add(
            "active"
          );


          categoriaActual =
            button.dataset.cat;


          pintarBiblioteca();

        }
      );

    });


  /* ================================================================
     INICIO
     ================================================================ */

  pintarBiblioteca();

}

  /* ---------------- Arranque de módulos ---------------- */
  setupModuleNav();
  renderTheory();
  renderCatalog();
  renderConfig();
  renderQuizHome();
  renderGlossary();

  /* =================================================================
     MENÚ PRINCIPAL (inicio con tarjetas)
     · Oculta la barra de módulos de arriba y deja SOLO 🏠 Inicio.
     ================================================================= */
  if (!document.querySelector('link[data-pb-home]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "./home.css"; link.setAttribute("data-pb-home", "1");
    document.head.appendChild(link);
  }

  const MODES = [
    { mod: "modEnsamble", icon: "🖥️", color: "#3aa0ff", title: "Ensamblaje", desc: "Arma tu PC paso a paso arrastrando cada componente a su lugar." },
    { mod: "modTeoria",   icon: "🎓", color: "#3ddc84", title: "Modo estudio", desc: "Aprende la arquitectura de la computadora de forma interactiva." },
    { mod: "modCatalogo", icon: "🧩", color: "#b98cff", title: "Catálogo", desc: "Explora cada componente: tipos, comparativas y cómo elegirlo." },
    { mod: "modDiag",     icon: "🩺", color: "#ff8c42", title: "Diagnóstico de errores", desc: "Enciende equipos con fallas, lee los síntomas del POST y repáralos." },
    { mod: "modCompat",   icon: "⚙️", color: "#ffb340", title: "Compatibilidad", desc: "Configura un equipo y comprueba si enciende, con el porqué de cada regla." },
    { mod: "modQuiz",     icon: "📝", color: "#ff5d6c", title: "Autoevaluación", desc: "Pon a prueba lo aprendido con un cuestionario que cambia cada intento." },
    { mod: "modGloss",    icon: "📚", color: "#33c9ff", title: "Biblioteca", desc: "Explora componentes de PC mediante modelos 3D interactivos." }
  ];

  function buildHome() {
    const app = document.querySelector(".app");
    if (!app || document.getElementById("homeRoot")) return;

    const cardsHTML = MODES.map(m => `
      <button class="pb-card" style="--c:${m.color}" data-goto="${m.mod}" type="button">
        <span class="pb-card-ico">${m.icon}</span>
        <h3>${m.title}</h3>
        <p>${m.desc}</p>
        <span class="pb-card-go" aria-hidden="true">→</span>
      </button>`).join("");

    const root = document.createElement("div");
    root.id = "homeRoot";
    root.innerHTML = `
      <aside class="pb-side">
        <div class="pb-avatar">👤</div>
        <div class="pb-user"><h2>Estudiante</h2><span>Nivel 1</span></div>
        <div class="pb-progress">
          <div class="pb-progress-top"><span>Progreso del montaje</span><strong id="pbProgPct">0%</strong></div>
          <div class="pb-bar"><span id="pbProgFill"></span></div>
        </div>
      </aside>
      <main class="pb-main">
        <div class="pb-hero"><div class="pb-logo-chip">🔧</div><h1>PC<b>Builder</b></h1></div>
        <div class="pb-divider">Elige un modo para comenzar</div>
        <div class="pb-cards">${cardsHTML}</div>
      </main>`;
    app.prepend(root);

    root.querySelectorAll("[data-goto]").forEach(el => el.addEventListener("click", () => openMode(el.dataset.goto)));

    // Botón 🏠 Inicio dentro de la barra de módulos + ocultar los demás botones
    const nav = document.getElementById("modNav");
    if (nav) {
      if (!document.getElementById("pbHomeBtn")) {
        const b = document.createElement("button");
        b.id = "pbHomeBtn"; b.className = "modnav-btn"; b.type = "button";
        b.innerHTML = "🏠 Inicio";
        b.addEventListener("click", goHome);
        nav.prepend(b);
      }
      // Deja solo el botón de Inicio visible en la barra de arriba
      nav.querySelectorAll(".modnav-btn").forEach(b => { if (b.id !== "pbHomeBtn") b.style.display = "none"; });
    }

    goHome();
  }

  function openMode(modId) {
    document.body.classList.remove("pb-home-active");
    document.querySelectorAll(".modnav-btn").forEach(b => b.classList.toggle("is-active", b.dataset.mod === modId));
    document.querySelectorAll(".module").forEach(m => m.classList.toggle("is-active", m.id === modId));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goHome() {
    document.body.classList.add("pb-home-active");
    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateProgress() {
    let pct = 0;
    try {
      if (typeof effectivePlaced === "function" && typeof effectiveTotal === "function") {
        const total = effectiveTotal();
        if (total > 0) pct = Math.round((effectivePlaced() / total) * 100);
      }
    } catch (e) {}
    const fill = document.getElementById("pbProgFill");
    const lbl = document.getElementById("pbProgPct");
    if (fill) fill.style.width = pct + "%";
    if (lbl) lbl.textContent = pct + "%";
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", buildHome);
  else buildHome();

})();


/* =================================================================
   =========   MÓDULO 3 · DIAGNÓSTICO DE ERRORES (POST)   =========
   Laboratorio: se enciende un equipo con una falla, el alumno observa
   los síntomas (beeps/LED/pantalla), deduce la CAUSA y aplica el ARREGLO.
   -----------------------------------------------------------------
   Va en su propia IIFE (aparte de los otros módulos) para mantener su
   estado —lote de casos, caso actual, aciertos— bien separado.
   Flujo de un caso:  runPost → askCause → askFix → closeCase → siguiente.
   ================================================================= */
(function () {
  const host = document.getElementById("modDiag");
  if (!host) return;

  /* Cada caso: equipo, síntoma visible, señal POST, causa, arreglo y teoría. */
  const CASES = [
    { id: "ram", nombre: "Equipo A", falla: "Sin imagen y pitidos largos repetidos",
      post: { pantalla: "negra", beeps: "1 pitido largo repetido", led: "DRAM (rojo) encendido" },
      causa: "La memoria RAM está mal asentada o no es compatible.",
      opcionesCausa: ["Memoria RAM mal instalada o incompatible", "Disco duro dañado", "Falta el sistema operativo", "El monitor está apagado"],
      fix: "Reasentar la RAM en A2/B2 hasta oír el clic y verificar que sea del tipo correcto (DDR).",
      opcionesFix: ["Reasentar la RAM y verificar su tipo (DDR)", "Formatear el disco", "Reinstalar Windows", "Cambiar el cable HDMI"],
      teoria: "El POST prueba la RAM antes que nada. El LED DRAM y un pitido largo repetido son el código típico de fallo de memoria: sin RAM válida el CPU no puede continuar." },

    { id: "cpu", nombre: "Equipo B", falla: "Los ventiladores giran un instante y se apaga",
      post: { pantalla: "negra", beeps: "sin pitidos", led: "CPU (rojo) encendido" },
      causa: "Falta el cable de alimentación EPS del CPU (8 pines).",
      opcionesCausa: ["Falta el cable EPS de 8 pines del CPU", "La RAM está llena", "El teclado no responde", "Falta el driver de la GPU"],
      fix: "Conectar el EPS de 8 pines en el cabezal superior izquierdo de la placa.",
      opcionesFix: ["Conectar el cable EPS del CPU", "Actualizar el navegador", "Cambiar el mouse", "Desfragmentar el disco"],
      teoria: "El CPU se alimenta por el conector EPS, aparte del ATX de 24 pines. Sin EPS, la placa intenta arrancar y corta de inmediato (encendido de un segundo) y marca el LED de CPU." },

    { id: "psu", nombre: "Equipo C", falla: "No enciende absolutamente nada",
      post: { pantalla: "negra", beeps: "ninguno", led: "todos apagados" },
      causa: "La fuente no entrega energía: interruptor apagado o ATX de 24 pines desconectado.",
      opcionesCausa: ["Fuente apagada o ATX 24-pin desconectado", "El monitor está en otra entrada", "La RAM es lenta", "El SSD está lleno"],
      fix: "Encender el interruptor de la fuente y conectar el ATX de 24 pines a la placa.",
      opcionesFix: ["Encender la fuente y conectar el ATX 24-pin", "Bajar el brillo", "Cambiar de navegador", "Borrar archivos temporales"],
      teoria: "Sin el ATX de 24 pines (o con la fuente apagada) la placa no recibe energía principal: no hay LEDs, ni ventiladores, ni POST. Es el primer punto a revisar cuando 'no enciende nada'." },

    { id: "storage", nombre: "Equipo D", falla: "Enciende pero dice 'No bootable device'",
      post: { pantalla: "mensaje: No bootable device", beeps: "1 pitido corto (POST OK)", led: "ninguno" },
      causa: "El disco con el sistema operativo no está conectado o no se detecta.",
      opcionesCausa: ["El disco del SO no está conectado/detectado", "La GPU está floja", "La RAM es insuficiente", "El disipador está sucio"],
      fix: "Conectar los cables SATA de datos y de poder del disco (o revisar el M.2) y fijar el orden de arranque.",
      opcionesFix: ["Conectar datos+poder del disco y revisar el orden de arranque", "Cambiar la fuente", "Reasentar la GPU", "Aplicar pasta térmica"],
      teoria: "Un pitido corto indica POST correcto: el hardware básico funciona. 'No bootable device' significa que no encuentra un disco con SO; casi siempre es un cable SATA suelto o el orden de arranque." },

    { id: "cooling", nombre: "Equipo E", falla: "Arranca y se apaga a los segundos; se siente caliente",
      post: { pantalla: "a veces llega al logo y se apaga", beeps: "1 corto y luego apagado", led: "CPU (temperatura)" },
      causa: "Falta pasta térmica o el disipador está mal montado (sobrecalentamiento).",
      opcionesCausa: ["Disipador mal montado / sin pasta térmica", "Falta RAM", "El cable HDMI está flojo", "El SSD está lleno"],
      fix: "Aplicar pasta térmica y montar bien el disipador; conectar su ventilador al CPU_FAN.",
      opcionesFix: ["Aplicar pasta y asentar el disipador + CPU_FAN", "Cambiar el monitor", "Reinstalar el SO", "Añadir otro disco"],
      teoria: "Si el CPU supera su temperatura crítica, la placa lo apaga para protegerlo. Sin pasta o con el disipador flojo, la temperatura se dispara en segundos: apagones al arrancar." },

    { id: "video", nombre: "Equipo F", falla: "POST correcto pero la pantalla dice 'Sin señal'",
      post: { pantalla: "Sin señal", beeps: "1 pitido corto (POST OK)", led: "VGA (blanco) parpadea" },
      causa: "El monitor está conectado a la placa teniendo una GPU dedicada instalada.",
      opcionesCausa: ["El monitor está conectado a la placa, no a la GPU", "El teclado está desconectado", "La fuente es de pocos watts", "El disco está dañado"],
      fix: "Pasar el cable de video a una salida de la tarjeta gráfica.",
      opcionesFix: ["Conectar el monitor a la salida de la GPU", "Cambiar la RAM", "Reinstalar drivers de red", "Cambiar el gabinete"],
      teoria: "Con una GPU dedicada, las salidas de video de la placa se desactivan (salvo que se configure lo contrario). Por eso hay POST pero 'sin señal': el cable está en el puerto equivocado." },

    { id: "monitor", nombre: "Equipo G", falla: "Todo enciende pero el monitor sigue en negro",
      post: { pantalla: "negra (monitor)", beeps: "1 pitido corto (POST OK)", led: "ninguno" },
      causa: "El monitor está apagado o en una entrada (HDMI/DP) equivocada.",
      opcionesCausa: ["Monitor apagado o en la entrada equivocada", "Falta el procesador", "La RAM está incompleta", "El EPS está suelto"],
      fix: "Encender el monitor y seleccionar la entrada correcta (source: HDMI/DP).",
      opcionesFix: ["Encender el monitor y elegir la entrada correcta", "Reasentar el CPU", "Añadir más RAM", "Conectar el EPS"],
      teoria: "Un POST correcto con la torre encendida apunta al periférico: el monitor debe estar encendido y con la fuente de entrada (source) correcta seleccionada." },

    { id: "eps", nombre: "Equipo H", falla: "Enciende, LED de placa fijo, sin POST",
      post: { pantalla: "negra", beeps: "ninguno", led: "CPU (rojo) fijo" },
      causa: "Cable EPS del CPU parcialmente conectado (solo 4 de 8 pines).",
      opcionesCausa: ["El EPS del CPU está a medias (4/8 pines)", "El monitor está en negro", "Falta el disco duro", "El USB frontal está suelto"],
      fix: "Insertar por completo el conector EPS de 8 pines hasta el clic.",
      opcionesFix: ["Insertar completo el EPS de 8 pines", "Cambiar el HDMI", "Formatear el SSD", "Reinstalar el mouse"],
      teoria: "Un EPS a medias entrega energía insuficiente al VRM del CPU: la placa enciende pero no completa el POST y deja el LED de CPU fijo." },

    { id: "ok", nombre: "Equipo I", falla: "Un pitido corto y llega al sistema operativo",
      post: { pantalla: "logo y arranque del SO", beeps: "1 pitido corto", led: "ninguno" },
      causa: "No hay falla: el POST fue exitoso y el equipo arranca correctamente.",
      opcionesCausa: ["No hay falla: arranque correcto", "La RAM está mal", "Falta el video", "La fuente es insuficiente"],
      fix: "Ninguna acción: el sistema está sano y operativo.",
      opcionesFix: ["No hacer nada: el equipo está sano", "Reasentar la RAM", "Conectar el EPS", "Cambiar la fuente"],
      teoria: "Un único pitido corto es la señal de POST correcto en la mayoría de placas: todo el hardware esencial respondió y se procede a cargar el sistema operativo." }
  ];

  const N_CASOS = 6;
  let lote = [], idx = 0, aciertos = 0;
  let casoCausaOk = false;   // ¿acertó la causa del caso actual?

  function startLab() {
    lote = CASES.slice();
    for (let i = lote.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [lote[i], lote[j]] = [lote[j], lote[i]]; }
    lote = lote.slice(0, N_CASOS);
    idx = 0; aciertos = 0;
    renderCase();
  }

  function renderCase() {
    if (idx >= lote.length) return renderReport();
    casoCausaOk = false;
    const c = lote[idx];
    host.innerHTML =
      `<h2 class="mod-head">3 · Diagnóstico de errores</h2>
       <p class="mod-sub">Enciende un equipo con una posible falla, observa los síntomas del POST, deduce la <strong>causa</strong> y aplica el <strong>arreglo</strong>. Caso ${idx + 1} de ${lote.length} · Aciertos: ${aciertos}</p>
       <div class="diag-lab">
         <div class="panel post-screen" id="postScreen">
           <div class="post-top"><span class="post-name">${c.nombre}</span><button class="primary-btn" id="postBtn" style="width:auto">⏻ Encender</button></div>
           <div class="post-body" id="postBody"><p class="small-text">Pulsa “Encender” para ejecutar el POST y observar los síntomas.</p></div>
         </div>
         <div class="panel" id="diagQ"><p class="small-text">Primero enciende el equipo y observa qué ocurre.</p></div>
       </div>`;
    host.querySelector("#postBtn").addEventListener("click", () => runPost(c));
  }

  function runPost(c) {
    const body = host.querySelector("#postBody");
    const btn = host.querySelector("#postBtn");
    btn.disabled = true; btn.textContent = "Ejecutando…";
    body.innerHTML = `<div class="post-line">Iniciando POST…</div>`;
    if (typeof sfxPower === "function") try { sfxPower(); } catch (e) {}

    const lines = [
      "Comprobando fuente de poder…",
      "Detectando CPU…",
      "Contando memoria RAM…",
      "Inicializando video…",
      "Buscando dispositivo de arranque…"
    ];
    let i = 0;
    const t = setInterval(() => {
      body.insertAdjacentHTML("beforeend", `<div class="post-line">${lines[i]}</div>`);
      i++;
      if (i >= lines.length) {
        clearInterval(t);
        setTimeout(() => {
          const ok = c.id === "ok";
          if (!ok && typeof sfxError === "function") try { sfxError(); } catch (e) {}
          body.insertAdjacentHTML("beforeend",
            `<div class="post-result ${ok ? "ok" : "bad"}">
               <div class="post-blink ${ok ? "" : "red"}"></div>
               <div>
                 <strong>${c.falla}</strong>
                 <ul class="post-signals">
                   <li>🖥️ Pantalla: ${c.post.pantalla}</li>
                   <li>🔊 Pitidos: ${c.post.beeps}</li>
                   <li>💡 LED de la placa: ${c.post.led}</li>
                 </ul>
               </div>
             </div>`);
          btn.textContent = "POST ejecutado"; 
          askCause(c);
        }, 380);
      }
    }, 430);
  }

  function block(titulo, ayuda, opciones, onPick) {
    const q = host.querySelector("#diagQ");
    q.innerHTML = `<h2>${titulo}</h2><p class="small-text">${ayuda}</p><div class="diag-opts"></div><div id="diagFb"></div>`;
    const wrap = q.querySelector(".diag-opts");
    const orden = opciones.map((o, i) => ({ o, i }));
    for (let i = orden.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [orden[i], orden[j]] = [orden[j], orden[i]]; }
    orden.forEach(({ o, i }) => {
      const b = document.createElement("button");
      b.className = "diag-opt"; b.textContent = o;
      b.addEventListener("click", () => { if (!b.disabled) onPick(i, wrap, b); });
      wrap.appendChild(b);
    });
  }

  function askCause(c) {
    block("Paso 1 · ¿Cuál es la causa?",
      "Con base en los síntomas del POST, elige la explicación más probable.",
      c.opcionesCausa, (elegido, wrap, btn) =>
        wireOptions(wrap, btn, elegido, c.opcionesCausa[0], "causa", c.causa, () => askFix(c)));
  }

  function askFix(c) {
    block("Paso 2 · ¿Cómo se arregla?",
      "Ya identificaste la causa. Ahora elige la acción correcta para solucionarla.",
      c.opcionesFix, (elegido, wrap, btn) =>
        wireOptions(wrap, btn, elegido, c.opcionesFix[0], "fix", c.fix, () => closeCase(c)));
  }

  /* La opción correcta siempre es la de índice 0 del arreglo original.
     'elegido' es ese índice original del botón pulsado. */
  function wireOptions(wrap, btn, elegido, textoCorrecto, paso, explicacion, next) {
    const fb = host.querySelector("#diagFb");
    const btns = [...wrap.querySelectorAll(".diag-opt")];
    btns.forEach(b => b.disabled = true);

    const bien = (elegido === 0);
    btns.forEach(b => { if (b.textContent === textoCorrecto) b.classList.add("correct"); });
    if (!bien) btn.classList.add("wrong");

    if (paso === "causa") casoCausaOk = bien;
    else if (bien && casoCausaOk) aciertos++;   // el caso cuenta si acertó causa Y arreglo

    fb.className = "q-feedback " + (bien ? "ok" : "bad");
    fb.innerHTML = (bien ? "✅ Correcto. " : "❌ No es lo más probable. ") + explicacion;

    const cont = document.createElement("button");
    cont.className = "view-btn"; cont.style.marginTop = "12px"; cont.textContent = "Continuar ▸";
    cont.addEventListener("click", next);
    fb.appendChild(cont);
  }

  function closeCase(c) {
    // Mostrar teoría del caso antes de pasar al siguiente
    const q = host.querySelector("#diagQ");
    q.innerHTML =
      `<h2>¿Por qué ocurre?</h2>
       <div class="clave" style="--accent:#7ed7ff">${c.teoria}</div>
       <div class="q-feedback ok" style="margin-top:12px"><strong>Causa:</strong> ${c.causa}<br><strong>Solución:</strong> ${c.fix}</div>
       <button class="primary-btn" id="nextCase" style="width:auto;margin-top:14px">${idx + 1 >= lote.length ? "Ver resultados" : "Siguiente equipo ▸"}</button>`;
    q.querySelector("#nextCase").addEventListener("click", () => { idx++; renderCase(); });
  }

  function renderReport() {
    const pct = Math.round(aciertos / lote.length * 100);
    host.innerHTML =
      `<h2 class="mod-head">3 · Diagnóstico de errores</h2>
       <div class="q-card quiz-result">
         <div class="score">${aciertos} / ${lote.length}</div>
         <p style="font-size:20px;margin:6px 0 4px">${pct}% de diagnósticos correctos</p>
         <p class="small-text" style="margin-bottom:16px">${pct >= 80 ? "¡Gran técnico! Identificas fallas de POST con soltura." : pct >= 50 ? "Bien. Repasa los códigos de POST (beeps y LEDs) para afinar." : "Repasa el módulo de teoría y los síntomas del POST."}</p>
         <button id="labRetry" class="primary-btn" style="width:auto">Nuevos casos</button>
       </div>`;
    host.querySelector("#labRetry").addEventListener("click", startLab);
  }

  startLab();
})();
