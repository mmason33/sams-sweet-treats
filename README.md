# Sam's Sweet Treats & Coffee

Single-page marketing/info site for the coffee & treat trailer, plus a TV menu and an admin menu editor. React + Vite + TypeScript + Tailwind, backed by Firebase (Firestore + Auth), deployed to GitHub Pages.

## Routes
Clean paths via `BrowserRouter` (a `404.html` SPA fallback makes deep links/refreshes work on GitHub Pages):
- `/` — public home + interactive menu
- `/tv` — landscape menu for the trailer TV (not linked publicly)
- `/admin` — auth-protected Firestore menu editor

## Develop
```bash
npm install
npm run dev      # local dev server
npm run test     # watch tests (npm run test -- run for CI mode)
npm run build    # type-check + production build to dist/
```

## Firebase setup
Enable Email/Password auth, create the admin user, create Firestore, and publish `firestore.rules`. Seed sample data:
```bash
ADMIN_EMAIL=<admin> ADMIN_PASSWORD=<password> npx tsx scripts/seed.ts
```

## Deploy
Pushing to `main` runs `.github/workflows/deploy.yml` (test → build → GitHub Pages).
In the repo: **Settings → Pages → Source: GitHub Actions**.

## Base path & custom domain
The production build is based under the GitHub Pages project path
(`https://mmason33.github.io/sams-sweet-treats/`). This is set in one place,
`BUILD_BASE` in `vite.config.ts`, and the router `basename` follows it
automatically via `import.meta.env.BASE_URL`. Dev/preview run at the root.

When connecting the Squarespace domain (served at the root):
1. Set `BUILD_BASE = '/'` in `vite.config.ts`.
2. Set `pathSegmentsToKeep = 0` in `public/404.html`.
3. Add a `public/CNAME` file containing the bare domain (e.g. `samssweet.com`).
4. Configure DNS per GitHub's Pages docs.
