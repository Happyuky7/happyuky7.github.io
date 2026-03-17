# Portfolio V1 (React + Vite)

Personal portfolio website built with **React + TypeScript + Vite**, with:

- Multi-language routes (e.g. `/en`, `/es`, `/ja`, …)
- A blog + projects section
- Static SEO generation during build
- DEV-only editors (hidden in production) to manage blog posts, projects, tags and assets

## Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- React Router
- Markdown rendering (GFM + KaTeX + code highlighting)

## Getting started

Requirements:
- Node.js 20+

Install and run locally:

```bash
npm ci
npm run dev
```

Then open the URL printed by Vite (default port in this repo is `5177`).

## Scripts

- `npm run dev` — starts Vite in dev mode (also generates sitemap/robots first)
- `npm run build` — production build (TypeScript build + Vite build + static SEO generation)
- `npm run preview` — previews the production build locally
- `npm run lint` — ESLint

## GitHub Pages deployment

This repo includes a GitHub Actions workflow that deploys the `dist/` output to **GitHub Pages**.

- Workflow: `.github/workflows/deploy-pages.yml`
- Trigger: push to `master` or `main`, or manual run
- Output folder: `dist`

### Base path / custom domain

The workflow auto-configures these build env vars:

- `VITE_BASE`
- `SITE_URL`
- `VITE_SITE_URL`

Rules:
- If `public/CNAME` exists, it assumes a **custom domain** and sets `VITE_BASE=/`.
- Otherwise it assumes **repository pages** and sets `VITE_BASE=/<repo-name>/`.

### One-time GitHub setup

In your repository settings:

1. Go to **Settings → Pages**
2. Under **Build and deployment**, choose **Source: GitHub Actions**
3. (Optional) If you use a custom domain, configure it there as well

## Notes

- The content for blog posts and projects lives under `public/` (so it’s available as static assets).
- The DEV-only editors are intended for local usage and are not meant to be exposed in production.
