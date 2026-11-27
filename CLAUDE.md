# Engineering Concepts

## Flujo de trabajo: trunk-based

- Trabaja y haz commit **directamente sobre `main`**. No crees ramas de funcionalidad ni pull requests.
- Commits pequeños; cada uno debe dejar `main` desplegable (Netlify publica cada push a `main` en producción).
- Ejecuta `npm run verify` antes de hacer push.

Contexto del producto y la arquitectura: `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`.
