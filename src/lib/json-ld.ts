import type { BlogPost } from "@/data/blog";
import { blogCategorySlug } from "@/data/blog";
import { getBlogFeaturedImageUrl } from "@/lib/blog";
import { stripHtml } from "@/lib/slugify";
import { canonicalUrl, getSiteOrigin, HOME_PAGE_TITLE } from "@/lib/site";

const SITE_NAME = "SavingsHub4u";

/** Stable @id fragments (must match across all JSON-LD on the site). */
export function organizationId(): string {
  return `${getSiteOrigin()}/#organization`;
}

export function websiteId(): string {
  return `${getSiteOrigin()}/#website`;
}

function logoAbsoluteUrl(): string {
  return `${getSiteOrigin()}/fav%20icon%20final%20logo.png`;
}

function toAbsoluteImageUrl(resolved: string): string {
  const u = resolved.trim();
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  if (u.startsWith("/")) return `${getSiteOrigin()}${u}`;
  return `${getSiteOrigin()}/${u}`;
}

/** Parse display dates like "FEBRUARY 26, 2026" or ISO strings. */
export function blogDateToIso(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const d = new Date(raw.trim());
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  return undefined;
}

/** Organization + WebSite + SearchAction — include in root layout on every page. */
export function buildGlobalJsonLd() {
  const base = getSiteOrigin();
  const org = organizationId();
  const web = websiteId();

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": org,
        name: SITE_NAME,
        url: `${base}/`,
        logo: {
          "@type": "ImageObject",
          url: logoAbsoluteUrl(),
        },
      },
      {
        "@type": "WebSite",
        "@id": web,
        name: SITE_NAME,
        url: `${base}/`,
        description:
          "Save smarter with verified coupon codes, exclusive deals, and money-saving tips from top brands.",
        publisher: { "@id": org },
        inLanguage: "en-US",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${base}/promotions?q={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

const HOME_DESCRIPTION =
  "Explore the SavingsHub4U blog for expert savings tips, coupon guides, deal updates, and smart shopping strategies.";

/** Homepage: WebPage + ItemList of latest posts (dynamic). */
export function buildHomeJsonLd(latestPosts: BlogPost[], maxItems = 12) {
  const base = getSiteOrigin();
  const org = organizationId();
  const web = websiteId();
  const slice = latestPosts.slice(0, maxItems);

  const itemListElement = slice.map((p, i) => ({
    "@type": "ListItem" as const,
    position: i + 1,
    item: {
      "@type": "Article",
      headline: stripHtml(p.title),
      url: canonicalUrl(`/blog/${encodeURIComponent(p.slug)}`),
      image: toAbsoluteImageUrl(getBlogFeaturedImageUrl(p.image)),
      articleSection: p.category || undefined,
    },
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${base}/#webpage`,
        url: canonicalUrl("/"),
        name: HOME_PAGE_TITLE,
        description: HOME_DESCRIPTION,
        isPartOf: { "@id": web },
        about: { "@id": org },
        inLanguage: "en-US",
      },
      {
        "@type": "ItemList",
        "@id": `${base}/#latest-articles`,
        name: "Latest articles",
        numberOfItems: itemListElement.length,
        itemListElement,
      },
    ],
  };
}

type BlogPostingInput = BlogPost & {
  meta_title?: string;
  meta_description?: string;
  createdAt?: string;
};

/** Single blog post: BlogPosting + BreadcrumbList (publisher references global Organization @id). */
export function buildBlogPostJsonLd(post: BlogPostingInput, slug: string) {
  const base = getSiteOrigin();
  const org = organizationId();
  const pageUrl = canonicalUrl(`/blog/${encodeURIComponent(slug)}`);
  const headline = stripHtml(post.meta_title || post.title);
  const description = stripHtml(post.meta_description || post.excerpt || "").slice(0, 500);
  const imageUrl = toAbsoluteImageUrl(getBlogFeaturedImageUrl(post.image));
  const datePublished =
    blogDateToIso(post.publishedDate) ||
    blogDateToIso(post.createdAt) ||
    new Date().toISOString();
  const dateModified = blogDateToIso(post.createdAt) || datePublished;
  const category = post.category || "Blog";
  const categoryPath = `/blog/category/${blogCategorySlug(category)}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${base}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: category,
            item: canonicalUrl(categoryPath),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: headline,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "BlogPosting",
        "@id": `${pageUrl}#article`,
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": pageUrl,
        },
        headline,
        description: description || undefined,
        image: [imageUrl],
        datePublished,
        dateModified,
        author: {
          "@type": "Organization",
          name: SITE_NAME,
          url: `${base}/`,
        },
        publisher: {
          "@id": org,
        },
        articleSection: category,
        inLanguage: "en-US",
      },
    ],
  };
}

/** Blog category listing page. */
export function buildBlogCategoryJsonLd(categoryName: string, slug: string) {
  const base = getSiteOrigin();
  const web = websiteId();
  const org = organizationId();
  const pageUrl = canonicalUrl(`/blog/category/${encodeURIComponent(slug)}`);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        "@id": `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${base}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: categoryName,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${categoryName} | ${SITE_NAME}`,
        isPartOf: { "@id": web },
        about: { "@id": org },
        inLanguage: "en-US",
      },
    ],
  };
}
