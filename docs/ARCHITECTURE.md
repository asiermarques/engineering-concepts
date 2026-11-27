# Arquitectura

## Resumen

Sitio **estático** generado con **Astro** y desplegado en **Netlify**. El contenido (conceptos y retos) vive como ficheros en el repositorio y se valida en tiempo de build. La interactividad (retos, simuladores, progreso, gamificación) se implementa como **islas React** que se hidratan solo donde hacen falta. **No hay backend**: todo el estado de la persona se guarda en su navegador.

```
repo (MDX/YAML)  ──build──▶  HTML estático + islas React  ──▶  Netlify CDN
                                                     │
                                                     ▼
                                     navegador: almacenamiento local (progreso)
```

## Decisiones principales

| Decisión | Elección | Motivo |
| --- | --- | --- |
| Framework | Astro + `@astrojs/react` + `@astrojs/mdx` | Sitio de contenido con poco JS; islas solo para lo interactivo; SEO para un sitio público. |
| Lenguaje | TypeScript estricto | Esquemas de contenido y de progreso tipados. |
| Contenido | Content collections de Astro (loader `glob`) con esquemas Zod | Añadir contenido = añadir ficheros; el build falla si un concepto o reto está mal formado. |
| Estado de la persona | Almacenamiento del navegador | Sin cuentas ni backend (ver PRODUCT.md). |
| i18n | Rutas por idioma (`/es/…`, `/en/…`) con el i18n de Astro | Español e inglés desde la primera versión. |
| Hosting | Netlify, despliegue de producción en cada push a `main` | Gratis para este uso; sin previews por rama (ver Flujo de trabajo). |
| Flujo de trabajo | Trunk-based: commits pequeños directamente sobre `main` | Integración continua real, sin ramas de larga vida ni merges. |

## Organización del código

Estructura orientada a funcionalidades (vertical slices): cada funcionalidad agrupa sus componentes, lógica y tests.

```
src/
  content.config.ts        # definición de colecciones y esquemas Zod
  content/
    topics/<locale>/<topic>.md                  # presentación del tema
    concepts/<locale>/<topic>/<concept>.mdx
    challenges/<locale>/<concept>.yaml          # { concept, challenges: [...] }
  features/
    concept-reading/       # layout, páginas del tema/concepto, navegación anterior/siguiente, esquema de concepto
    challenges/            # esquema, corrección, estado y UI (isla React) de la Evaluación
    content-validation/    # reglas entre ficheros (traducciones, mínimo de retos) y carga validada
    simulators/            # Versión estática (StaticWalkthrough.astro); simuladores React en el futuro
    progress/              # repositorio de progreso en el navegador (pendiente)
    gamification/          # XP, niveles, rachas, logros, repaso espaciado (lógica pura, pendiente)
  i18n/ui.ts               # cadenas de interfaz por idioma y utilidades de idioma
  pages/index.astro        # `/` sirve la portada (tarjetas de temas) en inglés
  pages/[locale]/index.astro
  pages/[locale]/topics/[topic].astro
  pages/[locale]/concepts/[id].astro
tests/e2e/                 # Playwright
scripts/serve-dist.mjs     # servidor estático de dist/ para e2e
```

Las URLs son `/` (portada en inglés), `/<locale>/` (portada: una tarjeta por tema), `/<locale>/topics/<tema>/` (presentación y mapa del tema) y `/<locale>/concepts/<id>/`, donde `<tema>` e `<id>` son ids estables, iguales en todos los idiomas. Se construyen con `src/features/concept-reading/paths.ts`.

## Modelo de contenido

- **Tema** → lista ordenada de **conceptos**.
- **Concepto**: MDX con frontmatter (id estable, título, tema, orden, nivel de dificultad, conceptos previos, resumen). Puede embeber simuladores como componentes.
- **Reto**: datos (YAML o frontmatter) con un id estable, el concepto al que pertenece, el tipo y los datos propios de su tipo; incluye siempre una explicación de la respuesta.
- Los ids de concepto y de reto son **estables e iguales en todos los idiomas**: el progreso se guarda por id y no debe romperse al editar textos ni al cambiar de idioma.
- Un concepto, reto o tema sin traducción **rompe el build** (requisito 001, BR-001).
- Los retos de un concepto viven en un único fichero `challenges/<locale>/<concept>.yaml`, con un esquema discriminado por `type` (hoy solo `multiple-choice`). Que una pregunta admita varias opciones se deduce del número de opciones correctas.
- Cada opción lleva un id estable igual en todos los idiomas; así el build comprueba que la opción correcta coincide entre idiomas.

### Validación en build

1. **Por fichero**: esquemas Zod de las colecciones (`objetivo de aprendizaje` obligatorio, al menos una opción correcta, explicación por opción…).
2. **Entre ficheros**: `features/content-validation/validateContent.ts` (función pura) comprueba traducciones, mínimo de 3 retos por concepto, ids duplicados, referencias a conceptos inexistentes y coherencia de opciones entre idiomas. `loadContent.ts` la ejecuta desde las páginas y lanza un único error con **todas** las violaciones.

## Estado en el navegador

- Un único módulo (`features/progress`) encapsula la lectura y escritura; el resto del código no accede directamente al almacenamiento.
- El estado guardado lleva un **número de versión del esquema** y migraciones, para poder evolucionar el modelo de gamificación sin perder el progreso existente.
- Si el almacenamiento no está disponible o devuelve datos corruptos, la aplicación funciona con estado en memoria y no falla.
- La lógica de gamificación (XP, niveles, rachas, repaso espaciado) son **funciones puras** sobre el estado, sin dependencias de React ni del navegador, para poder probarlas de forma aislada. Las fechas se inyectan, no se leen del reloj dentro de la lógica.

## Calidad

- Tests unitarios para la lógica pura (gamificación, evaluación de retos, migraciones de progreso).
- Validación del contenido en build mediante los esquemas de las colecciones.
- Tests end-to-end de los flujos principales (leer un concepto, completar un reto, conservar el progreso al recargar).
- Herramientas: **Vitest** (lógica pura y componentes React con Testing Library + jsdom, ficheros `*.test.ts(x)` junto al código) y **Playwright** (`tests/e2e`, contra `dist/` servido por `scripts/serve-dist.mjs`, porque `astro preview` se desacopla a segundo plano y no se puede supervisar desde Playwright).
- Comandos: `npm test`, `npm run test:e2e`, `npm run build`, `npm run verify` (tests + build, antes de cada push).
- La **Evaluación** es una isla `client:only="react"`: sin JavaScript solo se muestra un aviso (`<noscript>`).
- El estado de la Evaluación está solo en memoria (sin almacenamiento) hasta el requisito de progreso.

## Flujo de trabajo (trunk-based)

- Se trabaja **directamente sobre `main`**: sin ramas de funcionalidad ni pull requests.
- Commits **pequeños y frecuentes**; cada commit deja `main` desplegable.
- Antes de hacer push: `npm run verify` (tests unitarios + build con validación de contenido).
- CI (`.github/workflows/ci.yml`) ejecuta lo mismo en cada push a `main`; si falla, arreglarlo es lo primero.
- Netlify publica en producción cada push a `main`. El trabajo a medio hacer no se oculta en una rama: se sube en pasos que no rompen nada o se deja sin enlazar desde la navegación hasta que esté listo.
- Para comprobar un despliegue: `E2E_BASE_URL=<url> npm run test:e2e`.

## Restricciones

- Sin servidor ni funciones serverless; nada de secretos en el cliente.
- Sin scripts de analítica o tracking de terceros.
  - Excepción aceptada de forma provisional: en el plan gratuito, Netlify inyecta en cada página su script `/.netlify/scripts/hud` (badge y barra de herramientas del propietario), que no se puede desactivar. No forma parte del código del sitio. Revisar si se cambia de plan o de proveedor.
- Accesibilidad: los retos y simuladores deben poder usarse con teclado y tener texto alternativo para lo visual.
- Rendimiento: las páginas de lectura deben funcionar sin JavaScript; solo los retos y simuladores lo necesitan.
