// The blog's RSS feed, built at the same time as the posts.
import type { APIRoute } from "astro";
import { postUrl, publishedPosts } from "../../lib/blog";

export const prerender = true;

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL("https://onushq.com");
  const posts = await publishedPosts();
  const items = posts
    .map((post) => {
      const url = new URL(postUrl(post), base).toString();
      return `    <item>
      <title>${escape(post.data.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${post.data.date.toUTCString()}</pubDate>
      <dc:creator>${escape(post.data.author)}</dc:creator>
      <description>${escape(post.data.description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Onus blog</title>
    <link>${new URL("/blog", base).toString()}</link>
    <description>Writing from the Onus team on reviewing agent-written code by meaning, risk and evidence.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
};
