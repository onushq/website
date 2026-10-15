// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import { fileURLToPath } from "node:url";

// The story page and the blog are prerendered; /docs is rendered on demand by Farming Labs
// Docs (search, Markdown routes, llms.txt and the MCP endpoint need a server), in a
// Cloudflare Worker (wrangler.jsonc).
export default defineConfig({
  site: "https://onushq.com",
  output: "server",
  integrations: [mdx()],
  // No Cloudflare Images or KV: the site has no image transforms and no sessions. Pages are
  // prerendered in Node, where the docs' code highlighting (WebAssembly) can run.
  adapter: cloudflare({ imageService: "compile", prerenderEnvironment: "node" }),
  session: false,
  devToolbar: { enabled: false },
  vite: {
    build: {
      // Inline stylesheets under 24 KB, so the story page and the blog paint without waiting
      // on a CSS request; the docs' 100 KB stylesheet stays external and cached. Other assets
      // keep Vite's default (undefined falls back to 4 KB).
      assetsInlineLimit: (file, content) => (file.endsWith(".css") ? content.length < 24 * 1024 : undefined),
    },
    resolve: {
      alias: { jiti: fileURLToPath(new URL("./src/lib/jiti-stub.ts", import.meta.url)) },
    },
  },
  redirects: {
    // `curl -fsSL https://onushq.com/install.sh | sh` installs the latest release.
    "/install.sh": {
      status: 307,
      destination: "https://github.com/onushq/onus/releases/latest/download/install.sh",
    },
  },
});
