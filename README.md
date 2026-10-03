# onushq.com

The website for Onus, the software that puts the Agentic Coding Paradigm into practice. It's a single static page built with Astro and deployed on Vercel.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npx astro check  # type-check .astro files
```

## Layout

- `src/pages/index.astro` assembles the page from the sections in `src/components/`.
- `src/styles/global.css` holds the design tokens (colors, type, spacing) for light and dark mode.
- `src/data/diff.ts` is the illustrative pull request shown in the hero.
- `public/og.png` is the social preview image (1200×630).

## Design notes

- The base is the pale slate of an air-traffic strip board. Changes are drawn as strips with a colored band.
- Buff (`--buff`) means exactly one thing: a person needs to look at this. Don't use it for decoration.
- The hero's diff-to-meaning sequence is the page's only automatic motion. It's skipped under `prefers-reduced-motion`.
- Type is Archivo (variable width) for everything, plus Fragment Mono for code. Ligatures are off in code so `>=` shows as typed.
- Every statistic on the page cites a source listed in the footer.

## Deploy

Production deploys go to Vercel (project `onus-website`, domain `onushq.com`):

```sh
vercel deploy --prod
```
