import { createClient } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";
import { apiVersion, dataset, projectId } from "@/sanity/env";
import type { BlogPost, BlogNiche, ImageAspectRatio } from "@/data/blog";

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});

const builder = createImageUrlBuilder({ projectId, dataset });
export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source);
}

/* ─── Portable Text → HTML ─── */

type Block = {
  _type: string;
  _key?: string;
  style?: string;
  children?: { _type: string; text: string; marks?: string[] }[];
  markDefs?: { _key: string; _type: string; href?: string; blank?: boolean }[];
  asset?: { _ref: string };
  alt?: string;
  caption?: string;
  listItem?: string;
  level?: number;
};

function portableTextToHtml(blocks: Block[]): string {
  if (!blocks?.length) return "";
  const parts: string[] = [];
  let inList: string | null = null;

  for (const block of blocks) {
    if (block._type === "image" && block.asset) {
      if (inList) { parts.push(inList === "bullet" ? "</ul>" : "</ol>"); inList = null; }
      const src = urlFor(block).width(1200).auto("format").url();
      const alt = block.alt || "";
      const cap = block.caption ? `<figcaption class="text-center text-sm text-zinc-500 mt-2">${block.caption}</figcaption>` : "";
      parts.push(`<figure class="my-6"><img src="${src}" alt="${alt}" loading="lazy" class="rounded-lg w-full h-auto" />${cap}</figure>`);
      continue;
    }

    if (block._type !== "block") continue;

    if (block.listItem) {
      const listType = block.listItem === "bullet" ? "bullet" : "number";
      if (inList !== listType) {
        if (inList) parts.push(inList === "bullet" ? "</ul>" : "</ol>");
        parts.push(listType === "bullet" ? '<ul class="list-disc pl-6">' : '<ol class="list-decimal pl-6">');
        inList = listType;
      }
      parts.push(`<li>${renderChildren(block)}</li>`);
      continue;
    }

    if (inList) { parts.push(inList === "bullet" ? "</ul>" : "</ol>"); inList = null; }

    const text = renderChildren(block);
    switch (block.style) {
      case "h1": parts.push(`<h1>${text}</h1>`); break;
      case "h2": parts.push(`<h2>${text}</h2>`); break;
      case "h3": parts.push(`<h3>${text}</h3>`); break;
      case "h4": parts.push(`<h4>${text}</h4>`); break;
      case "blockquote": parts.push(`<blockquote>${text}</blockquote>`); break;
      default: parts.push(`<p>${text}</p>`);
    }
  }
  if (inList) parts.push(inList === "bullet" ? "</ul>" : "</ol>");
  return parts.join("\n");
}

function renderChildren(block: Block): string {
  if (!block.children) return "";
  const markDefs = block.markDefs || [];
  return block.children
    .map((child) => {
      let html = child.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      for (const mark of child.marks || []) {
        if (mark === "strong") { html = `<strong>${html}</strong>`; continue; }
        if (mark === "em") { html = `<em>${html}</em>`; continue; }
        if (mark === "underline") { html = `<u>${html}</u>`; continue; }
        if (mark === "strike-through") { html = `<s>${html}</s>`; continue; }
        const def = markDefs.find((d) => d._key === mark);
        if (def?._type === "link" && def.href) {
          const target = def.blank ? ' target="_blank" rel="noopener noreferrer"' : "";
          html = `<a href="${def.href}"${target}>${html}</a>`;
        }
      }
      return html;
    })
    .join("");
}

/* ─── GROQ Queries ─── */

const BLOG_FIELDS = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  "image": image.asset->url,
  imageAspectRatio,
  featured,
  niche,
  content,
  publishedDate,
  metaTitle,
  metaDescription,
  storeSlug,
  storeCtaLabel,
  _createdAt
`;

export type SanityBlogPostRaw = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category: string;
  image?: string;
  imageAspectRatio?: string;
  featured?: boolean;
  niche?: string[];
  content?: Block[];
  publishedDate?: string;
  metaTitle?: string;
  metaDescription?: string;
  storeSlug?: string;
  storeCtaLabel?: string;
  _createdAt: string;
};

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

export function sanityPostToBlogPost(raw: SanityBlogPostRaw): BlogPost & { content?: string; createdAt?: string; publishedDate?: string } {
  return {
    id: raw._id,
    title: raw.title,
    slug: raw.slug,
    excerpt: raw.excerpt || "",
    category: raw.category,
    image: raw.image || "",
    imageAspectRatio: (raw.imageAspectRatio as ImageAspectRatio) || undefined,
    featured: raw.featured || false,
    niche: (raw.niche as BlogNiche[]) || undefined,
    content: raw.content ? portableTextToHtml(raw.content) : "",
    createdAt: raw._createdAt,
    publishedDate: raw.publishedDate ? formatDate(raw.publishedDate) : "",
    meta_title: raw.metaTitle || undefined,
    meta_description: raw.metaDescription || undefined,
    storeSlug: raw.storeSlug || undefined,
    storeCtaLabel: raw.storeCtaLabel || undefined,
  };
}

export async function fetchSanityBlogPosts(): Promise<(BlogPost & { content?: string; createdAt?: string; publishedDate?: string })[]> {
  if (!projectId) return [];
  try {
    const rawPosts: SanityBlogPostRaw[] = await sanityClient.fetch(
      `*[_type == "blogPost"] | order(publishedDate desc) { ${BLOG_FIELDS} }`
    );
    return rawPosts.map(sanityPostToBlogPost);
  } catch (err) {
    console.error("[Sanity] Failed to fetch blog posts:", err);
    return [];
  }
}

export async function fetchSanityPostBySlug(
  slug: string
): Promise<(BlogPost & { content?: string; createdAt?: string; publishedDate?: string }) | null> {
  if (!projectId) return null;
  try {
    const raw: SanityBlogPostRaw | null = await sanityClient.fetch(
      `*[_type == "blogPost" && slug.current == $slug][0] { ${BLOG_FIELDS} }`,
      { slug }
    );
    return raw ? sanityPostToBlogPost(raw) : null;
  } catch (err) {
    console.error("[Sanity] Failed to fetch post by slug:", err);
    return null;
  }
}
