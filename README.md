# onushq.com

The website for Onus. It's built with Astro and runs as a Cloudflare Worker.

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
- `src/pages/blog/` is the blog: the list at `/blog`, one prerendered page per post, and `/blog/rss.xml`. See [Blog](#blog).
- `astro.config.mjs` redirects `/install.sh` to the installer attached to the latest GitHub release.
- The site builds with `output: "server"` and the Cloudflare adapter (`wrangler.jsonc`). The story page, the blog and the docs pages are prerendered, in Node (docs code highlighting uses WebAssembly, which a Worker may not compile). The docs' Markdown routes (`/docs/<page>.md`), `/llms.txt`, search, the sitemaps and the MCP endpoint render on demand in the Worker. `src/lib/jiti-stub.ts` stands in for jiti, which Farming Labs Docs bundles but the site never uses.

## Blog

Posts are MDX files in `src/content/blog/` (the `blog` collection in `src/content.config.ts`). The file name is the URL: `code-is-not-the-product.mdx` is `/blog/code-is-not-the-product`. Front matter takes `title`, `description`, `date`, `author` and an optional `draft: true`, which keeps a post out of the list, the feed and the build.

- `src/lib/blog.ts` lists published posts, newest first, and works out reading time.
- `src/styles/blog.css` sets the reading column (40rem) and a wider track (56rem) that figures and tables break out to. Tables scroll sideways on phones.
- Diagrams are Astro components in `src/components/blog/`, drawn in HTML and CSS from the tokens rather than as images, so they follow the theme and reflow on phones. `Figure.astro` gives each one its label, title and caption.

The first post is the manifesto Onus is built on, transcribed from `manifesto.pdf` in the onus repository with its three diagrams redrawn.

## Docs

`/docs` is the Onus user guide, served with [Farming Labs Docs](https://docs.farming-labs.dev) (`@farming-labs/astro`, the shadcn preset of `@farming-labs/astro-theme`).

- `docs/` holds the pages. They are generated from the guide that ships inside the `onus` binary (`crates/onus-cli/guide/*.md` in the onus repository), so edit the guide there and regenerate:

  ```sh
  npm run docs:sync                    # reads ../onus
  npm run docs:sync -- path/to/onus    # or ONUS_REPO=path/to/onus
  ```

  `scripts/sync-docs.mjs` keeps the order of `onus help`, turns indented code into fenced blocks, and links `onus help <topic>` to the page. Its output is deterministic; commit what it writes.
- `src/lib/docs.config.ts` configures the docs: search, page actions (copy as Markdown, open in Claude, ChatGPT or Cursor), `llms.txt` and the sitemap. Ask AI, feedback, analytics and Farming Labs telemetry are off.
- `src/styles/docs.css` maps the preset's colors to the Onus tokens and keeps the sidebar a drawer on narrow screens; `src/components/DocsShell.astro` is the page shell.
- `src/middleware.ts` routes the docs' machine-readable surfaces; `src/pages/docs/` renders the pages.
- `public/og.png` is the social preview image, a frame of the hero (1200x630).

## Deploy

Production is the Cloudflare Worker `onus-website` on `onushq.com` and `www.onushq.com`. A push to `main` deploys it (`.github/workflows/deploy.yml`). By hand, from a clean checkout:

```sh
npm run deploy
```

Locally in the Workers runtime: `npm run build && npx wrangler dev -c dist/server/wrangler.json`.
