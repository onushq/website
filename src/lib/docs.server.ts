import { createDocsServer } from "@farming-labs/astro/server";
import config from "./docs.config";

// The docs are bundled into the server build, so they are read at build time
// rather than from the file system of the serverless function.
const contentFiles = import.meta.glob(["/docs/**/*.{md,mdx}", "/.farming-labs/sitemap-manifest.json"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export const { load, GET, HEAD, POST, MCP } = createDocsServer({
  ...config,
  _preloadedContent: contentFiles,
});
