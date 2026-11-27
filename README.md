# Engineering Concepts

Sitio estático (Astro + islas React) para leer conceptos de ingeniería y comprobar su comprensión con retos. Ver `docs/PRODUCT.md` y `docs/ARCHITECTURE.md`.

```bash
npm install
npm run dev          # desarrollo
npm run build        # build + validación de contenido (falla si falta una traducción o hay < 3 retos por concepto)
npm test             # tests unitarios y de componentes (Vitest)
npx playwright install chromium   # una vez
npm run test:e2e     # e2e (construye dist/ y lo sirve)
npm run verify       # tests + build: ejecutar antes de cada push
```

Flujo trunk-based: se trabaja y se hace push directamente a `main` (sin ramas ni PRs); cada push despliega a producción en Netlify. Ver `docs/ARCHITECTURE.md`.

Añadir un concepto: crear `src/content/concepts/{en,es}/<tema>/<id>.mdx` y `src/content/challenges/{en,es}/<id>.yaml` (mismos ids de concepto, reto y opción en ambos idiomas).
