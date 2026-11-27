# Diseño

Dirección: **"level select" de consola retro**. La lectura va primero: tipografía hiperlegible, columna de lectura tranquila y alto contraste. La sensación de juego vive en el *chrome*: tipografía pixel en títulos, sombras duras desplazadas, contadores tipo HUD, teclas A/B/C y un mapa de conceptos.

Todo está en `src/styles/global.css`, con tokens en `:root` (tema claro "cartucho") y `prefers-color-scheme: dark` (tema "consola nocturna").

## Tipografía

Fuentes autoalojadas con `@fontsource-variable/*` (sin Google Fonts, por la regla de privacidad de PRODUCT.md).

| Token | Fuente | Uso |
| --- | --- | --- |
| `--font-body` | Atkinson Hyperlegible Next | Texto, enunciados, explicaciones, etiquetas pequeñas en mayúsculas |
| `--font-mono` | Atkinson Hyperlegible Mono | Código, **todos los números** (Concepto 04/13, Resultado, pasos de la Versión estática) y teclas A/B/C |
| `--font-display` | Pixelify Sans | Solo `h1`/`h2`, botones, logo y selector de idioma, **siempre en mayúsculas y minúsculas** |

Regla: Pixelify Sans no se usa para cifras, letras sueltas ni texto en mayúsculas: ahí `B`/`8`, `C`/`O`, `2`/`8` y `5`/`S` se confunden.

## Color

- `--color-accent` (amarillo moneda): acción principal, concepto actual, Resultado. Texto encima con `--color-on-accent`; como color de texto sobre fondo usar `--color-accent-ink`.
- `--color-link` / `--color-focus`: enlaces y foco (contorno de 3 px).
- `--color-ok`, `--color-bad`, `--color-warn` (+ `-bg`): correcta, incorrecta, opción correcta no seleccionada. Siempre acompañados de icono y texto, nunca solo color.
- `--color-screen` / `--color-on-screen`: panel oscuro del Resultado en ambos temas.

## Componentes

- **Paneles**: borde de 2 px y `--shadow-hard` (desplazamiento de `--px`, sin desenfoque). Esquinas rectas.
- **Botones**: amarillos con sombra dura; al pulsar se "hunden" (`translate` + sombra 0).
- **Tarjetas de tema** (`.topic-card`): portada con un "cartucho" por tema (franja amarilla, número de ranura en mono, nº de conceptos); toda la tarjeta es el enlace.
- **Mapa del tema** (`.stage-map`): conceptos numerados sobre un raíl punteado; toda la tarjeta es el enlace.
- **HUD del concepto** (`.hud`): posición `04/13` y una barra de segmentos que indica la posición, no el progreso.
- **Evaluación**: zona con trama diagonal; barra segmentada de respondidas (verde/rojo), etiqueta "Pregunta n/N", teclas A/B/C en preguntas de una respuesta y casillas pixel en las de varias; panel final con el Resultado y estrellas decorativas.
- **Versión estática**: tabla tipo "repetición" con los pasos numerados en mono.

## Movimiento

Entradas escalonadas en la portada y el mapa, sello (`stamp`) en el veredicto y el Resultado, sacudida en la opción incorrecta. Todo se desactiva con `prefers-reduced-motion`.

## Pendiente para la gamificación

XP, niveles, rachas y logros deben reutilizar estos patrones: cifras en `--font-mono`, recompensas en `--color-accent` y paneles con sombra dura. El Estado del concepto puede pintarse en el número del mapa (`.stage__num`) y en los segmentos del HUD.
