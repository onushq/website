// The published blog posts, newest first, and the helpers the blog pages share.
import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"blog">;

export async function publishedPosts(): Promise<Post[]> {
  const posts = await getCollection("blog", (p) => !p.data.draft);
  return posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export const postUrl = (post: Post) => `/blog/${post.id}`;

export const formatDate = (date: Date) =>
  date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

// About 230 words a minute, counting prose and leaving out the MDX imports.
export function readingMinutes(post: Post): number {
  const text = (post.body ?? "").replace(/^import .*$/gm, "");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 230));
}
