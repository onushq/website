import { shadcn } from "@farming-labs/astro-theme/shadcn";
import { defineDocs } from "@farming-labs/docs";

// The /docs section. Its pages in docs/ are generated from the Onus user
// guide by `npm run docs:sync`; edit the guide in the onus repository instead.
export default defineDocs({
  entry: "docs",
  contentDir: "docs",
  // A neutral, rounded preset; src/styles/docs.css maps its colors to the
  // Onus tokens, and the fonts are the site's.
  theme: shadcn({
    ui: {
      typography: {
        font: {
          style: {
            sans: '"Archivo Variable", "Archivo", ui-sans-serif, system-ui, sans-serif',
            mono: '"Geist Mono Variable", "Geist Mono", ui-monospace, "SF Mono", Menlo, monospace',
          },
        },
      },
    },
  }),
  github: {
    url: "https://github.com/onushq/website",
    branch: "main",
    directory: "docs",
  },
  nav: { title: "Onus docs", url: "/docs" },
  ordering: "numeric",
  sidebar: { flat: false, collapsible: true },
  breadcrumb: { enabled: true },
  themeToggle: { enabled: true, default: "dark" },
  pageActions: {
    position: "below-title",
    alignment: "right",
    copyMarkdown: { enabled: true },
    openDocs: { enabled: true, target: "markdown", providers: ["claude", "chatgpt", "cursor"] },
  },
  // Onus computes facts and never generates them; the docs do not either.
  ai: { enabled: false },
  // Feedback needs a backend to go anywhere, and the site has none.
  feedback: false,
  // Dates would come from file times on the server, not from git history.
  lastUpdated: false,
  // Nothing about readers leaves the site.
  analytics: false,
  telemetry: false,
  llmsTxt: {
    enabled: true,
    baseUrl: "https://onushq.com",
    siteTitle: "Onus",
    siteDescription: "Onus turns a pull request into a short report of changes in meaning.",
  },
  sitemap: { enabled: true, baseUrl: "https://onushq.com" },
  metadata: {
    titleTemplate: "%s · Onus docs",
    description: "The Onus user guide: install, commands, reports, configuration, CI and plugins.",
  },
});
