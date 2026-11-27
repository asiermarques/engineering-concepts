# Engineering Concepts

Static site (Astro + React islands) for reading engineering concepts and checking understanding with challenges. See `docs/PRODUCT.md` and `docs/ARCHITECTURE.md`.

```bash
npm install
npm run dev          # development server
npm run build        # build + content validation (fails if a translation is missing or a concept has < 3 challenges)
npm test             # unit and component tests (Vitest)
npx playwright install chromium   # once
npm run test:e2e     # e2e (builds dist/ and serves it)
npm run verify       # tests + build: run before every push
```

Trunk-based workflow: work and push directly to `main` (no branches or PRs); every push deploys to production on Netlify. See `docs/ARCHITECTURE.md`.

Adding a concept: create `src/content/concepts/{en,es}/<topic>/<id>.mdx` and `src/content/challenges/{en,es}/<id>.yaml` (same concept, challenge and option ids in both locales).
