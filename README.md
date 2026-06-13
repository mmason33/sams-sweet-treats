# Sam's Sweet Treats & Coffee

Single-page marketing/info site for the coffee & treat trailer, plus a TV menu and an admin menu editor. React + Vite + TypeScript + Tailwind, backed by Firebase (Firestore + Auth), deployed to GitHub Pages.

## Routes
- `/` — public home + interactive menu (`#/`)
- `/tv` — landscape menu for the trailer TV (`#/tv`, not linked publicly)
- `/admin` — auth-protected Firestore menu editor (`#/admin`)

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

## Custom domain (later)
When connecting the Squarespace domain, add a `public/CNAME` file containing the bare domain (e.g. `samssweet.com`) and configure DNS per GitHub's Pages docs. The Vite `base: './'` setting already supports both the project-page URL and a custom domain.
