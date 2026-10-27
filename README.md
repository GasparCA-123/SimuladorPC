# PC Builder · Simulador de Ensamblaje + Academy

Proyecto original (Teoría, Catálogo, Ensamble, Compatibilidad, Autoevaluación,
Diagnóstico y Glosario/Biblioteca) **sin cambios**: `script.js` y `style.css`
son exactamente los originales.

## Qué se agregó
- `academy/` → el juego «PC Builder Academy» (pedidos de clientes, tienda con
  presupuesto, armado paso a paso, diagnóstico de fallas, niveles).
  Reutiliza la teoría, el catálogo, el banco de preguntas y los casos de
  diagnóstico del proyecto original (`academy/datos-repo.js`).
- `index.html` → 3 adiciones, marcadas con comentarios:
  1. botón `🎮 Academy` en la barra de módulos,
  2. la sección `#modAcademy` (un iframe que carga `academy/index.html`),
  3. un script puente al final que agrega la tarjeta **Academy** al menú de inicio.

## Teoría y evaluación
- Dentro del juego hay botones **Teoría**, **Autoevaluación** e **Inicio** que
  llevan a los módulos originales del simulador.
- El panel lateral del inicio muestra el progreso del alumno en Academy
  (nivel, equipos armados, reparados y % de práctica acertada).
- Antes de cada pedido el juego muestra una lección corta (tomada de la teoría
  original) y al terminar hace una pregunta de repaso.

## Cómo abrirlo
Con un servidor local (la Biblioteca original usa `fetch`):

    python3 -m http.server 8000     # y abrir http://localhost:8000
