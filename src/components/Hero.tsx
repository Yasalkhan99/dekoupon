"use client";

import Link from "next/link";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";
import type { BlogPost } from "@/data/blog";
import { useState, useEffect, useCallback } from "react";

const SLIDER_HEIGHT_PX = 500;

function HuntedSlide({
  post,
  isActive,
}: {
  post: BlogPost;
  isActive: boolean;
}) {
  const date = (post as { publishedDate?: string }).publishedDate ?? "";
  const excerpt = post.excerpt?.replace(/<[^>]+>/g, "").slice(0, 140) || "";
  const href = post.slug ? `/blog/${post.slug}` : "#";
  const img = post.image || "https://picsum.photos/id/1/1200/600";

  return (
    <li style={{ display: isActive ? "block" : "none" }}>
      <Link href={href} className="block h-full">
        <div
          className="slide-container"
          style={{
            backgroundImage: `url(${img})`,
            height: `${SLIDER_HEIGHT_PX}px`,
          }}
        >
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

export default function Hero() {
  const { heroPost, featuredPosts, latestPosts } = useBlogData();
  const [index, setIndex] = useState(0);

  const slides: BlogPost[] = [heroPost];
  const seen = new Set<string>([heroPost.id]);
  for (const p of [...featuredPosts, ...latestPosts]) {
    if (slides.length >= 5) break;
    if (!seen.has(p.id)) {
      seen.add(p.id);
      slides.push(p);
    }
  }

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

  if (slides.length === 0) return null;

  return (
    <div className="hunted-slider-container clearfix -mt-14 w-full pt-14">
      <div className="relative">
        <ul
          className="bxslider-main"
          style={{ overflow: "hidden", height: `${SLIDER_HEIGHT_PX}px`, margin: 0, padding: 0, listStyle: "none" }}
        >
          {slides.map((post, i) => (
            <HuntedSlide
              key={post.id}
              post={post}
              isActive={i === index}
            />
          ))}
        </ul>

        {slides.length > 1 && (
          <>
            <div className="bx-controls-direction" aria-hidden>
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
