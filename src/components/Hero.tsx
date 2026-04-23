"use client";

import Link from "next/link";
import { useBlogData } from "@/components/BlogDataProvider";
import type { BlogPost } from "@/data/blog";
import { resolveHeroSlideImageUrl } from "@/lib/hero-image";
import { HERO_PRIORITY_SLUGS, MAX_HERO_SLIDES } from "@/lib/hero-config";
import { useState, useEffect, useCallback, useMemo, type ReactNode } from "react";

function heroSlideDate(post: BlogPost): string {
  const pd = post.publishedDate?.trim();
  if (pd) return pd;
  const ca = post.createdAt;
  if (!ca) return "";
  const d = new Date(ca);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  })
    .format(d)
    .toUpperCase();
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").trim();
}

function NewsHeroSlide({
  post,
  isActive,
  slideIndex,
  lcpImageSlot,
}: {
  post: BlogPost;
  isActive: boolean;
  slideIndex: number;
  lcpImageSlot?: ReactNode;
}) {
  const date = heroSlideDate(post);
  const excerpt = stripHtml(post.excerpt ?? "").slice(0, 160) || "";
  const href = post.slug ? `/blog/${post.slug}` : "#";
  const img = resolveHeroSlideImageUrl(post.image, post.content, post.slug);
  const imgAlt = stripHtml(post.title).slice(0, 120) || "Featured article";
  const useLcpSlot = Boolean(lcpImageSlot) && slideIndex === 0 && isActive;

  return (
    <li style={{ display: isActive ? "block" : "none" }} aria-hidden={!isActive}>
      <article className="flex min-h-0 flex-col bg-[var(--card-bg)] lg:grid lg:min-h-[min(52vh,540px)] lg:grid-cols-12 lg:gap-0">
        <header className="flex shrink-0 items-stretch border-b-2 border-[var(--footer-accent)] bg-stone-900 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500 sm:text-[11px] lg:col-span-12">
          <span className="flex items-center bg-[var(--footer-accent)] px-3 py-2.5 font-bold tracking-[0.12em] text-white">
            Desk
          </span>
          <span className="hidden min-w-0 flex-1 items-center px-3 text-stone-400 sm:flex">
            Savings lead · verified deals and guides
          </span>
          <span className="flex items-center px-3 font-mono text-[10px] font-medium normal-case tracking-normal text-stone-500">
            {date || "—"}
          </span>
        </header>

        <Link
          href={href}
          className="group flex min-h-0 flex-1 flex-col text-inherit no-underline outline-none lg:contents focus-visible:ring-2 focus-visible:ring-[var(--footer-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card-bg)]"
        >
          <div className="relative order-1 min-h-[200px] w-full shrink-0 overflow-hidden bg-stone-200 sm:min-h-[240px] lg:order-2 lg:col-span-7 lg:min-h-0 lg:[clip-path:polygon(11%_0,100%_0,100%_100%,0_100%)]">
            {useLcpSlot ? (
              <div className="absolute inset-0 [&>img]:pointer-events-none [&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover">
                {lcpImageSlot}
              </div>
            ) : (
              <img
                src={img}
                alt={imgAlt}
                width={1200}
                height={630}
                fetchPriority={isActive ? "high" : "low"}
                loading={isActive ? "eager" : "lazy"}
                decoding="async"
                className="pointer-events-none absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
              />
            )}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-stone-900/10 via-transparent to-transparent"
              aria-hidden
            />
          </div>

          <div className="order-2 flex min-h-0 flex-1 flex-col justify-between gap-6 border-stone-200/90 px-5 py-7 sm:px-7 sm:py-9 lg:order-1 lg:col-span-5 lg:border-r lg:border-stone-200/90 lg:py-10">
            <div className="min-w-0 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                {stripHtml(post.category || "Featured")}
              </p>
              <h2
                className="news-hero-headline text-balance text-2xl font-bold leading-[1.12] tracking-tight text-stone-900 sm:text-3xl lg:text-[2.05rem] lg:leading-[1.1]"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />
              {excerpt ? (
                <p className="max-w-prose border-l-2 border-[var(--footer-accent)]/70 pl-4 text-sm leading-relaxed text-stone-600 sm:text-base">
                  {excerpt}…
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-[var(--footer-accent)]">
              <span className="inline-flex items-center gap-2 border-b-2 border-[var(--footer-accent)] pb-0.5 transition group-hover:border-[var(--footer-accent-hover)] group-hover:text-[var(--footer-accent-hover)]">
                Read full story
                <span aria-hidden className="translate-x-0 transition group-hover:translate-x-1">
                  →
                </span>
              </span>
              <span className="text-xs font-normal text-stone-400">Updated for smart shoppers</span>
            </div>
          </div>
        </Link>
      </article>
    </li>
  );
}

export default function Hero({ children }: { children?: ReactNode } = {}) {
  const { heroPost, featuredPosts, latestPosts, allPosts } = useBlogData();
  const [index, setIndex] = useState(0);

  const slides: BlogPost[] = useMemo(() => {
    const bySlug = new Map(allPosts.map((p) => [p.slug, p]));
    const out: BlogPost[] = [];
    const seen = new Set<string>();

    for (const slug of HERO_PRIORITY_SLUGS) {
      const p = bySlug.get(slug);
      if (p && !seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }

    const sortedNewest = [...allPosts].sort((a, b) => {
      const ta = new Date(a.createdAt ?? 0).getTime();
      const tb = new Date(b.createdAt ?? 0).getTime();
      return tb - ta;
    });

    for (const p of sortedNewest) {
      if (out.length >= MAX_HERO_SLIDES) break;
      if (!seen.has(p.id)) {
        seen.add(p.id);
        out.push(p);
      }
    }

    if (out.length > 0) return out;

    const fallback: BlogPost[] = [];
    if (heroPost?.id) {
      fallback.push(heroPost);
      seen.add(heroPost.id);
    }
    for (const p of [...featuredPosts, ...latestPosts]) {
      if (fallback.length >= 5) break;
      if (!seen.has(p.id)) {
        seen.add(p.id);
        fallback.push(p);
      }
    }
    return fallback;
  }, [allPosts, heroPost, featuredPosts, latestPosts]);

  const go = useCallback(
    (dir: number) => {
      setIndex((i) => {
        const next = i + dir;
        if (next < 0) return slides.length - 1;
        if (next >= slides.length) return 0;
        return next;
      });
    },
    [slides.length]
  );

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => go(1), 7000);
    return () => clearInterval(t);
  }, [slides.length, go]);

  useEffect(() => {
    setIndex((i) => (slides.length === 0 ? 0 : Math.min(i, slides.length - 1)));
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="news-hero w-full">
      <div className="relative">
        <ul className="m-0 list-none p-0" style={{ overflow: "hidden" }}>
          {slides.map((post, i) => (
            <NewsHeroSlide
              key={post.id}
              post={post}
              isActive={i === index}
              slideIndex={i}
              lcpImageSlot={i === 0 ? children : undefined}
            />
          ))}
        </ul>

        {slides.length > 1 && (
          <div className="flex flex-col gap-3 border-t border-stone-300/70 bg-[#ebe4da] px-3 py-3 sm:flex-row sm:items-stretch sm:gap-0 sm:px-0 sm:py-0">
            <div className="flex min-h-[52px] min-w-0 flex-1 gap-0 overflow-x-auto sm:divide-x sm:divide-stone-300/80">
              {slides.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIndex(i);
                  }}
                  className={`flex min-w-[140px] shrink-0 flex-col items-start gap-1 px-3 py-2.5 text-left transition sm:min-w-0 sm:flex-1 sm:px-4 sm:py-3 ${
                    i === index
                      ? "bg-[var(--card-bg)] shadow-[inset_0_-3px_0_0_var(--footer-accent)]"
                      : "bg-transparent hover:bg-stone-200/60"
                  }`}
                  aria-label={`Show story ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                >
                  <span className="font-mono text-[10px] font-bold text-stone-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="line-clamp-2 text-[11px] font-semibold leading-snug text-stone-800 sm:text-xs">
                    {stripHtml(p.title)}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-stone-300/80 px-3 py-2 sm:border-t-0 sm:border-l sm:px-4">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  go(-1);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-400/80 bg-[var(--card-bg)] text-lg text-stone-700 transition hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]"
                aria-label="Previous story"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  go(1);
                }}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-400/80 bg-[var(--card-bg)] text-lg text-stone-700 transition hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]"
                aria-label="Next story"
              >
                ›
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
