// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";
import mdx from "@astrojs/mdx";

// The story page and the blog are prerendered; /docs is rendered on demand by Farming Labs
// Docs (search, Markdown routes, llms.txt and the MCP endpoint need a server).
export default defineConfig({
  site: "https://onushq.com",
  output: "server",
  integrations: [mdx()],
  adapter: vercel({
    webAnalytics: {
      enabled: true,
    },
  }),
  devToolbar: { enabled: false },
  redirects: {
    // `curl -fsSL https://onushq.com/install.sh | sh` installs the latest release.
    "/install.sh": {
      status: 307,
      destination: "https://github.com/onushq/onus/releases/latest/download/install.sh",
    },
  },
});
