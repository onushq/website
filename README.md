# onushq.com

The website for Onus, the software that puts the Agentic Coding Paradigm into practice. It's a single static page built with Astro and deployed on Vercel.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npx astro check  # type-check .astro files
```

## Design system

The site is built from the Onus Design System (a private claude.ai artifact: Onus Design System). Its names and values are mirrored here:

- `src/styles/tokens.css`: color (light and dark), type families, spacing, radius and shadow tokens. Same names as the system's `tokens.json`.
- `src/styles/base.css`: reset, the type styles (`.display-xl` … `.caption`, with responsive sizes) and layout primitives (`.wrap`, `.section`, `.band`).
- `src/styles/components.css`: the `.o-*` component classes. Published unchanged as the system's `components/bundle.css`.

When you change a token or component here, update the design system too, and the other way round.

The short version of the rules:

- Amber (`--signal`) means a person needs to look. Nothing else is amber.
- Archivo's width axis carries meaning: wide for statements, normal for reading, narrow for data. Code is Geist Mono with ligatures off.
- One orchestrated motion (the hero's lines pouring into the minimap), skipped under reduced motion.
- Every statistic cites a source from `src/data/sources.ts`.

## Layout

- `src/pages/index.astro` assembles the page from the sections in `src/components/`.
- `src/components/visuals/` holds the five how-it-works visuals (each rendered on the pinned stage on desktop and inline on phones).
- `src/data/pr.ts` is the illustrative pull request behind the hero: per-file line counts tied to each change in meaning.
- `public/og.png` is the social preview image (1200×630).

## Deploy

Production deploys go to Vercel (project `onus-website` in the `mikias-tilahun-abebes-projects` team, domain `onushq.com`):

```sh
vercel deploy --prod
```
