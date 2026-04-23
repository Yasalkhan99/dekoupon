"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";
import { blogListPlaceholderImageUrl, resolveFeaturedFirstImageUrl } from "@/lib/hero-image";
import type { NavDropdownPost } from "@/data/blog";

function DeskTeaserImage({ post }: { post: NavDropdownPost }) {
  const primary = resolveFeaturedFirstImageUrl(post.image, post.content, post.slug);
  const fallback = blogListPlaceholderImageUrl(`${post.id}-tab`);
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

const TAB_KEYS = ["fashion", "lifestyle", "featured"] as const;
const TAB_LABELS: Record<(typeof TAB_KEYS)[number], string> = {
  fashion: "Fashion",
  lifestyle: "Lifestyle",
  featured: "Featured",
};

function MetaLine({ post }: { post: NavDropdownPost }) {
  return (
    <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium uppercase tracking-wide text-stone-500">
      <span className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5 shrink-0 opacity-70" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M12 12a4 4 0 110-8 4 4 0 010 8zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
        </svg>
        SavingsHub4u
      </span>
      <span className="flex items-center gap-1.5">
        <svg className="h-3.5 w-3.5 shrink-0 opacity-70" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z" />
        </svg>
        {post.date}
      </span>
    </p>
  );
}

function LeadCard({ post }: { post: NavDropdownPost }) {
  const href = post.slug ? `/blog/${post.slug}` : "#";

  return (
    <Link
      href={href}
      className="group relative grid gap-5 overflow-hidden rounded-lg border border-stone-200/90 bg-gradient-to-br from-stone-50 to-[var(--card-bg)] p-4 shadow-sm transition hover:border-[var(--footer-accent)]/35 md:grid-cols-12 md:gap-0 md:p-0"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-stone-200 md:col-span-5 md:aspect-auto md:min-h-[220px] md:rounded-none">
        <DeskTeaserImage post={post} />
        <span
          className="absolute left-3 top-3 flex h-8 min-w-[2rem] items-center justify-center bg-stone-900/90 px-2 font-mono text-xs font-bold text-white backdrop-blur-sm"
          aria-hidden
        >
          01
        </span>
      </div>
      <div className="flex min-w-0 flex-col justify-center border-stone-200/80 md:col-span-7 md:border-l md:border-stone-200/80 md:px-6 md:py-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-500">{post.category}</p>
        <h3 className="category-desk-headline mt-2 text-pretty text-2xl font-bold leading-[1.15] text-stone-900 md:text-[1.6rem]">
          {stripHtml(post.title)}
        </h3>
        <div className="mt-3 max-w-prose border-l-2 border-[var(--footer-accent)]/60 pl-3">
          <p className="text-sm font-semibold text-[var(--footer-accent)] transition group-hover:text-[var(--footer-accent-hover)]">
            Open story <span aria-hidden>→</span>
          </p>
        </div>
        <MetaLine post={post} />
      </div>
    </Link>
  );
}

function CompactCard({ post, deskIndex }: { post: NavDropdownPost; deskIndex: number }) {
  const num = String(deskIndex).padStart(2, "0");
  const href = post.slug ? `/blog/${post.slug}` : "#";

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border border-stone-200/90 bg-[var(--card-bg)] shadow-sm transition hover:border-[var(--footer-accent)]/40 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-stone-200">
        <DeskTeaserImage post={post} />
        <span
          className="absolute left-2 top-2 flex h-7 min-w-[28px] items-center justify-center bg-stone-900 px-1.5 font-mono text-[11px] font-bold text-white"
          aria-hidden
        >
          {num}
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-stone-500">{post.category}</p>
        <h3 className="mt-1.5 line-clamp-3 text-sm font-bold leading-snug text-stone-900 transition group-hover:text-[var(--footer-accent)]">
          {stripHtml(post.title)}
        </h3>
        <MetaLine post={post} />
      </div>
    </Link>
  );
}

export default function HeroCategoryTabs() {
  const { navDropdownPosts } = useBlogData();
  const [activeTab, setActiveTab] = useState<(typeof TAB_KEYS)[number]>("fashion");

  const posts = navDropdownPosts[activeTab] ?? [];
  const displayPosts = posts.slice(0, 4);
  const [lead, ...rest] = displayPosts;

  return (
    <aside
      className="news-category-desk w-full overflow-hidden rounded-xl border border-stone-800/12 bg-[var(--card-bg)] shadow-[0_20px_50px_-24px_rgba(28,25,23,0.22)]"
      aria-label="Featured reads by section"
    >
      <header className="flex shrink-0 items-stretch border-b-2 border-[var(--footer-accent)] bg-stone-900 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 sm:text-[11px]">
        <span className="flex items-center bg-[var(--footer-accent)] px-3 py-2.5 font-bold tracking-[0.12em] text-white">
          Beat
        </span>
        <span className="hidden min-w-0 flex-1 items-center px-3 text-stone-400 sm:flex">
          Section file · hand-picked for each desk
        </span>
        <span className="flex items-center px-3 font-mono text-[10px] font-medium normal-case tracking-normal text-stone-500">
          {TAB_LABELS[activeTab]}
        </span>
      </header>

      <div
        className="flex min-h-[52px] border-b border-stone-300/80 bg-[#ebe4da]"
        role="tablist"
        aria-label="Story sections"
      >
        {TAB_KEYS.map((key, i) => {
          const tabId = `category-tab-${key}`;
          return (
            <button
              key={key}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={activeTab === key}
              aria-controls="category-tab-panel"
              onClick={() => setActiveTab(key)}
              className={`flex min-w-[120px] shrink-0 flex-col items-start gap-0.5 border-stone-300/80 px-3 py-2.5 text-left transition last:border-r-0 sm:min-w-0 sm:flex-1 sm:border-r sm:px-4 sm:py-3 ${
                activeTab === key
                  ? "bg-[var(--card-bg)] shadow-[inset_0_-3px_0_0_var(--footer-accent)]"
                  : "bg-transparent hover:bg-stone-200/60"
              }`}
            >
              <span className="font-mono text-[10px] font-bold text-stone-400">{String(i + 1).padStart(2, "0")}</span>
              <span className="text-xs font-semibold text-stone-800 sm:text-sm">{TAB_LABELS[key]}</span>
            </button>
          );
        })}
      </div>

      <div
        id="category-tab-panel"
        role="tabpanel"
        aria-labelledby={`category-tab-${activeTab}`}
        className="p-4 sm:p-5 md:p-6"
      >
        {displayPosts.length === 0 ? (
          <p className="py-12 text-center text-sm text-stone-500">No posts in this section yet.</p>
        ) : (
          <div className="space-y-4">
            {lead ? <LeadCard post={lead} /> : null}
            {rest.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, i) => (
                  <CompactCard key={post.id} post={post} deskIndex={i + 2} />
                ))}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </aside>
  );
}
