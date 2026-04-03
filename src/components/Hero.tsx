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

function stripUrlQuery(u: string): string {
  const i = u.indexOf("?");
  return i === -1 ? u : u.slice(0, i);
}

function HuntedSlide({
  post,
  isActive,
  slideIndex,
  lcpImageSrc,
}: {
  post: BlogPost;
  isActive: boolean;
  slideIndex: number;
  lcpImageSrc?: string | null;
}) {
  const date = heroSlideDate(post);
  const excerpt = post.excerpt?.replace(/<[^>]+>/g, "").slice(0, 140) || "";
  const href = post.slug ? `/blog/${post.slug}` : "#";
  const img = resolveHeroSlideImageUrl(post.image, post.content, post.slug);
  const imgAlt = post.title.replace(/<[^>]+>/g, "").trim().slice(0, 120) || "Featured article";
  const lcp = lcpImageSrc?.trim() ?? "";
  const serverLcpCoversFirst = slideIndex === 0 && lcp !== "" && stripUrlQuery(img) === stripUrlQuery(lcp);

  return (
    <li style={{ display: isActive ? "block" : "none" }}>
      <Link href={href} className="block h-full">
        <div className="slide-container hero-slide-height">
          {!serverLcpCoversFirst ? (
            <img
              src={img}
              alt={imgAlt}
              width={1200}
              height={630}
              fetchPriority={isActive ? "high" : "low"}
              loading={isActive ? "eager" : "lazy"}
              decoding="async"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="slide-info-outer">
            <div className="slide-info">
              <div className="slide-info-inner">
                <div className="slide-text-outer">
                  <div className="slide-text">
                    {date && (
                      <div className="slider-date">
                        <span>{date}</span>
                      </div>
                    )}
                    <h2
                      className="slider-header"
                      dangerouslySetInnerHTML={{ __html: post.title }}
                    />
                    {excerpt && (
                      <p className="slider-caption">{excerpt}…</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

export default function Hero({
  lcpImageSrc,
  children,
}: {
  lcpImageSrc?: string | null;
  children?: ReactNode;
} = {}) {
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
    const t = setInterval(() => go(1), 5000);
    return () => clearInterval(t);
  }, [slides.length, go]);

  useEffect(() => {
    setIndex((i) => (slides.length === 0 ? 0 : Math.min(i, slides.length - 1)));
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="hunted-slider-container clearfix mt-4 w-full md:-mt-14 md:pt-14">
      <div className="relative">
        {children}
        <ul
          className="relative z-[1] bxslider-main hero-slider-list"
          style={{ overflow: "hidden", margin: 0, padding: 0, listStyle: "none" }}
        >
          {slides.map((post, i) => (
            <HuntedSlide
              key={post.id}
              post={post}
              isActive={i === index}
              slideIndex={i}
              lcpImageSrc={lcpImageSrc}
            />
          ))}
        </ul>

        {slides.length > 1 && (
          <>
            <div className="bx-controls-direction hidden md:flex" aria-hidden>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  go(-1);
                }}
                className="bx-prev"
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  go(1);
                }}
                className="bx-next"
                aria-label="Next slide"
              >
                ›
              </button>
            </div>
            <div className="bx-pager">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIndex(i);
                  }}
                  className={i === index ? "active" : ""}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
