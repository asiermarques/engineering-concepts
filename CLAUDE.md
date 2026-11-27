# Engineering Concepts

## Language

- Write all docs, instructions, code, comments and commit messages in **English**.
- Site content and UI strings exist in both locales (`en`, `es`); only those are written in Spanish.

## Workflow: trunk-based

- Work and commit **directly on `main`**. Do not create feature branches or pull requests.
- Keep commits small; each one must leave `main` deployable (Netlify deploys every push to `main` to production).
- Run `npm run verify` before pushing.

Product and architecture context: `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`. Terms: `docs/UBIQUITOUS_LANGUAGE.md`.
