// @ts-check
import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel";

// The story page is prerendered; /docs is rendered on demand by Farming Labs
// Docs (search, Markdown routes, llms.txt and the MCP endpoint need a server).
export default defineConfig({
  site: "https://onushq.com",
  output: "server",
  adapter: vercel(),
  devToolbar: { enabled: false },
  redirects: {
    // `curl -fsSL https://onushq.com/install.sh | sh` installs the latest release.
    "/install.sh": {
      status: 307,
      destination: "https://github.com/onushq/onus/releases/latest/download/install.sh",
    },
  },
});
