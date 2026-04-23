"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";
import { blogListPlaceholderImageUrl, resolveFeaturedFirstImageUrl } from "@/lib/hero-image";
import { blogCategorySlug, type BlogPost } from "@/data/blog";

function WireLeadImage({ post }: { post: BlogPost }) {
  const primary = resolveFeaturedFirstImageUrl(post.image, post.content, post.slug);
  const fallback = blogListPlaceholderImageUrl(`${post.id}-wire`);
  const [src, setSrc] = useState(primary);

  useEffect(() => {
    setSrc(primary);
  }, [primary]);

  return (
    <img
      src={src}
      alt={stripHtml(post.title)}
      className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
      loading="lazy"
      decoding="async"
      onError={() => setSrc((s) => (s === fallback ? s : fallback))}
    />
  );
}

type DeskConfig = {
  rail: string;
  /** Full name (mobile bar, links) */
  label: string;
  /** Short vertical-rail text so it fits in narrow strips */
  railVerticalLabel: string;
  viewAllHref: string;
  variant: "default" | "wash";
};

const DESKS: DeskConfig[] = [
  {
    rail: "01",
    label: "Travel",
    railVerticalLabel: "Travel",
    viewAllHref: `/blog/category/${blogCategorySlug("Travel")}`,
    variant: "default",
  },
  {
    rail: "02",
    label: "Style",
    railVerticalLabel: "Style",
    viewAllHref: `/blog/category/${blogCategorySlug("Clothing & Accessories")}`,
    variant: "wash",
  },
  {
    rail: "03",
    label: "Gear & living",
    railVerticalLabel: "Gear",
    viewAllHref: `/blog/category/${blogCategorySlug("Technology")}`,
    variant: "default",
  },
];

function fillWidgetPosts(matched: BlogPost[], latestPosts: BlogPost[], take: number): BlogPost[] {
  if (matched.length >= take) return matched.slice(0, take);
  const ids = new Set(matched.map((p) => p.id));
  const rest = latestPosts.filter((p) => !ids.has(p.id));
  return [...matched, ...rest].slice(0, take);
}

function DeskChannel({
  config,
  posts,
}: {
  config: DeskConfig;
  posts: BlogPost[];
}) {
  const lead = posts[0];
  const briefs = posts.slice(1, 4);
  if (!lead) return null;

  const mainDate = (lead as { publishedDate?: string }).publishedDate ?? "";
  const contentWash = config.variant === "wash" ? "lg:bg-[#ebe4da]/45" : "";

  return (
    <div className="flex min-h-0 min-w-0 flex-col lg:flex-row">
      {/* Below lg: horizontal channel bar */}
      <div className="flex items-center justify-between gap-3 bg-[var(--footer-accent)] px-3 py-2.5 text-white lg:hidden">
        <span className="font-mono text-xs font-bold tracking-widest opacity-90">{config.rail}</span>
        <span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-[0.18em]">{config.label}</span>
      </div>

      {/* lg+: vertical rail */}
      <div
        className="relative hidden w-11 shrink-0 flex-col items-center justify-between bg-[var(--footer-accent)] py-4 text-white sm:w-12 lg:flex"
        aria-hidden
      >
        <span className="font-mono text-[10px] font-bold opacity-80">{config.rail}</span>
        <span className="max-h-[min(12rem,22vh)] text-center text-[10px] font-bold uppercase leading-tight tracking-[0.2em] [text-orientation:mixed] [writing-mode:vertical-rl]">
          {config.railVerticalLabel}
        </span>
        <span className="font-mono text-[10px] opacity-60">●</span>
      </div>

      <div className={`flex min-w-0 flex-1 flex-col p-4 sm:p-5 ${contentWash}`}>
        <Link
          href={lead.slug ? `/blog/${lead.slug}` : "#"}
          className="group block border-b border-dashed border-stone-300/90 pb-4"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-start">
            <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-md bg-stone-200 md:aspect-auto md:h-[min(11rem,28vw)] md:max-h-[200px] md:w-[min(42%,280px)] md:max-w-[280px] md:shrink-0">
              <WireLeadImage post={lead} />
            </div>
            <div className="min-w-0 flex-1">
              {mainDate ? (
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-stone-500">{mainDate}</p>
              ) : null}
              <h3
                className="category-desk-headline text-pretty text-xl font-bold leading-snug text-stone-900 sm:text-[1.35rem]"
                dangerouslySetInnerHTML={{ __html: lead.title }}
              />
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--footer-accent)] transition group-hover:gap-2">
                Read <span aria-hidden>→</span>
              </p>
            </div>
          </div>
        </Link>

        {briefs.length > 0 ? (
          <ul className="mt-3 space-y-0 divide-y divide-dashed divide-stone-300/80">
            {briefs.map((post, i) => (
              <li key={post.id}>
                <Link
                  href={post.slug ? `/blog/${post.slug}` : "#"}
                  className="group flex gap-3 py-3 transition hover:bg-stone-100/60 sm:px-1"
                >
                  <span className="w-6 shrink-0 pt-0.5 font-mono text-[10px] font-bold text-stone-400">
                    {String(i + 2).padStart(2, "0")}
                  </span>
                  <span
                    className="min-w-0 flex-1 text-sm font-medium leading-snug text-stone-800 group-hover:text-[var(--footer-accent)]"
                    dangerouslySetInnerHTML={{ __html: post.title }}
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-auto border-t border-stone-200/80 pt-4">
          <Link
            href={config.viewAllHref}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-stone-600 underline decoration-[var(--footer-accent)] decoration-2 underline-offset-4 transition hover:text-[var(--footer-accent)]"
          >
            Full desk file
            <span aria-hidden className="text-[var(--footer-accent)]">↗</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function HomeWidgetSection() {
  const { latestPosts, allPosts } = useBlogData();

  const travelPosts = (allPosts || [])
    .filter((p) => (p.category || "").toLowerCase().includes("travel"))
    .slice(0, 4);
  const clothingPosts = (allPosts || [])
    .filter((p) => {
      const c = (p.category || "").toLowerCase();
      return c.includes("clothing") || c.includes("fashion");
    })
    .slice(0, 4);
  const techHomePosts = (allPosts || [])
    .filter((p) => {
      const c = (p.category || "").toLowerCase();
      return (
        c.includes("technology") ||
        c.includes("electronic") ||
        c.includes("home") ||
        c.includes("garden") ||
        c.includes("entertainment") ||
        c.includes("gaming")
      );
    })
    .slice(0, 4);

  const travel = fillWidgetPosts(travelPosts, latestPosts, 4);
  const clothing = fillWidgetPosts(clothingPosts, latestPosts, 4);
  const techHome = fillWidgetPosts(techHomePosts, latestPosts, 4);

  const columns = [
    { config: DESKS[0], posts: travel },
    { config: DESKS[1], posts: clothing },
    { config: DESKS[2], posts: techHome },
  ];

  return (
    <section className="news-wire-room home-widget-area w-full min-w-0" aria-label="Wire room — multi-desk coverage">
      <div className="min-w-0 overflow-hidden rounded-xl border border-stone-800/12 bg-[var(--card-bg)] shadow-[0_20px_50px_-24px_rgba(28,25,23,0.22)]">
        <header className="flex min-w-0 shrink-0 items-stretch border-b-2 border-[var(--footer-accent)] bg-stone-900 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 sm:text-[11px]">
          <span className="flex shrink-0 items-center bg-[var(--footer-accent)] px-3 py-2.5 font-bold tracking-[0.12em] text-white">
            Wire
          </span>
          <span className="hidden min-w-0 flex-1 items-center px-2 text-stone-400 sm:flex sm:line-clamp-2 sm:px-3 sm:leading-snug lg:line-clamp-none">
            Three parallel desks · same savings intelligence, split by beat
          </span>
          <span className="flex shrink-0 items-center px-2 py-2.5 font-mono text-[10px] font-medium normal-case tracking-normal text-stone-500 sm:px-3">
            Live mix
          </span>
        </header>

        {/* 1 col &lt; lg; 3 cols only when row is full width (see page layout) */}
        <div className="grid min-w-0 grid-cols-1 divide-y divide-stone-200/90 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {columns.map(({ config, posts }) => (
            <DeskChannel key={config.rail} config={config} posts={posts} />
          ))}
        </div>
      </div>
    </section>
  );
}
