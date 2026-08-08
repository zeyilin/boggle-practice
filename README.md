# Boggle Practice

A solo Boggle practice PWA — timed games, an untimed Zen mode, a board solver, and spaced-repetition review of boards you struggled on. Fully client-side and offline-first: word lists ship as static assets and are loaded into a trie inside a Web Worker (which also solves boards off the main thread), and all data lives in IndexedDB.

Built with Next.js (App Router, static export), React, TypeScript, and Tailwind CSS v4. See [SPEC.md](SPEC.md) for the full product spec and [CLAUDE.md](CLAUDE.md) for the developer guide.

## Development

```bash
npm install
npm run dev          # dev server at http://localhost:3000 (service worker disabled)
npm test             # vitest unit tests
npm run lint         # eslint
npm run build        # static export → out/
```

The normalized word lists in `public/dictionaries/` are checked in. To rebuild them from raw source lists, run `npm run compile-dicts`.

## Deployment — Cloudflare Pages (pages.dev)

The site deploys as a static export to Cloudflare Pages via GitHub integration: every push to `main` builds and deploys automatically, and other branches get preview deployments.

One-time setup (Cloudflare dashboard):

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**.
2. **Create application** → **Pages** tab → **Connect to Git**.
3. Sign in to GitHub and select this repository (install the Cloudflare Pages GitHub App if prompted).
4. **Begin setup**, then configure:
   - **Project name**: `boggle-practice` (becomes `boggle-practice.pages.dev`)
   - **Production branch**: `main`
   - **Framework preset**: `Next.js (Static HTML Export)` — or `None`
   - **Build command**: `npm run build`
   - **Build output directory**: `out`
5. **Save and Deploy**.

Supporting files in this repo:

- `.node-version` pins Node 22 for Pages CI builds.
- `public/_headers` is copied into `out/` and sets Cache-Control rules (`/sw.js` is never cached; hashed `/_next/static/*` assets are immutable).

No `wrangler.toml` is used — for a Git-integrated Pages project the dashboard settings are the source of truth, and a wrangler file containing `pages_build_output_dir` would silently take over that configuration.
