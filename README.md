# onushq.com

The website for Onus. It's a single static page built with Astro and deployed on Vercel.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npx astro check  # type-check .astro files
```

## Design system

The site is dark-first (`data-theme="dark"` on `<html>`) and built from the Onus Design System (a private claude.ai artifact: Onus Design System). Its names and values are mirrored here:

- `src/styles/tokens.css`: color (light and dark), type families, spacing, radius and shadow tokens. Same names as the system's `tokens.json`.
- `src/styles/base.css`: reset, the type styles (`.display-xl` … `.caption`, with responsive sizes) and layout primitives (`.wrap`, `.section`, `.band`).
- `src/styles/components.css`: the `.o-*` component classes. Published unchanged as the system's `components/bundle.css`.

When you change a token or component here, update the design system too, and the other way round.

The short version of the rules:

- Amber (`--signal`) means a person needs to look. Nothing else is amber.
- Archivo's width axis carries meaning: wide for statements, normal for reading, narrow for data. Code is Geist Mono with ligatures off.
- Motion follows the reader: the scene changes only as you scroll, and stands still under reduced motion.
- Every statistic cites a source from `src/data/sources.ts`.

## The 3D story

The page is one continuous three.js scene behind the text. About 14,000 bars (6,000 on phones), each a line of code, rearrange into a different formation for every chapter as you scroll:

| Chapter | Formation |
| --- | --- |
| Code is not the product | pages of code streaming toward the viewer |
| Output scales | a wall of code too big for the screen, with an amber frame around one careful review (about 400 lines) |
| Signal from noise | four slabs, one per change in meaning; the first is amber |
| A live map, Proof | the component graph; the new edge to the SMS provider is amber |
| Lanes, The judge | four runways lined with lights; the human lane carries amber packets, the blocked lane hits a red barrier |
| Human attention | the ten-step path with the two person steps in amber |
| Any agent, Roadmap, Install | a quiet field |
| The point | everything collapses into one orb with an amber core |

How it fits together:

- `src/scene/formations.ts` computes every formation once (seeded, so it's identical on every visit) plus the camera keyframe and the labels for each.
- `src/scene/shaders.ts` morphs each bar between two formations with a per-bar stagger and a small arc, moves the streaming and spinning formations, and shrinks bars a formation doesn't use.
- `src/scene/engine.ts` owns the renderer, the camera choreography, labels pinned to scene positions, and the quality tiers.
- `src/components/SceneLayer.astro` maps the scroll position to the story phase. Each section's `data-phase` says which formation it holds; the scene morphs between neighbours. The engine loads as its own chunk after the page paints.
- Amber still means one thing: a person needs to look.

Fallbacks: without WebGL the canvas is hidden and the page reads as plain text on the dark canvas. Under `prefers-reduced-motion` there is no smooth scrolling, nothing streams, and each chapter's formation snaps into place. Add `?quality=low` or `?quality=high` to the URL to force a tier while testing.

## Layout

- `src/pages/index.astro` assembles the page: the scene layer, the header, the chapter rail, and the chapters in `src/components/chapters/`.
- `src/data/pr.ts` holds the example pull request's four changes in meaning.
- `src/data/release.ts` holds the release links of the Install chapter. Downloads point at `releases/latest/download/`, so only the Action example's `tag` needs updating when a version ships.
- `vercel.json` redirects `/install.sh` to the installer attached to the latest GitHub release.
- `public/og.png` is the social preview image, a frame of the hero (1200x630).

## Deploy

Production deploys go to Vercel (project `onus-website` in the `mikias-tilahun-abebes-projects` team, domain `onushq.com`):

```sh
vercel deploy --prod
```
