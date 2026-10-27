/* =====================================================================
   DATOS TOMADOS DEL PROYECTO ORIGINAL (PC_Builder_Simulador/script.js)
   ---------------------------------------------------------------------
   Estos bloques se copiaron SIN CAMBIOS del script original, para que el
   juego reutilice tu contenido didáctico:
     · components ...... los 38 pasos de ensamblaje (info, wrong, deps)
     · SLOT_LABELS ..... nombre visible de cada ranura
     · SPECS ........... fichas técnicas por pieza
     · INSTRUCCIONES ... instrucción corta de cada paso
     · MEM / CYCLE ..... jerarquía de memoria y ciclo de instrucción
     · THEORY .......... teoría de cada componente
     · CATALOG ......... catálogo con preguntas y respuestas
     · POOL ............ banco de preguntas de autoevaluación
     · CASES ........... casos de diagnóstico POST
   El juego (juego.js) NO modifica estos datos: los adapta en tiempo de
   ejecución. Si corriges un texto aquí, se refleja en todo el juego.
   ===================================================================== */

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
