"use client";

import Link from "next/link";
import type { BlogPost } from "@/data/blog";
import ResilientPostImage from "@/components/ResilientPostImage";

type TopDealsSectionProps = {
  posts: BlogPost[];
};

function TickerCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={post.slug ? `/blog/${post.slug}` : "#"}
      className="group flex w-[min(200px,78vw)] shrink-0 flex-col overflow-hidden rounded-lg border border-stone-300/90 bg-white shadow-sm transition hover:border-[var(--footer-accent)] hover:shadow-md sm:w-[220px]"
    >
      <ResilientPostImage
        post={post}
        fallbackKey="ticker"
        wrapperClassName="relative aspect-[4/3] w-full overflow-hidden bg-stone-200"
        imgClassName="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.04]"
      />
      <div className="border-t border-stone-200/90 p-3">
        <h3
          className="line-clamp-2 text-xs font-bold leading-snug text-stone-900 group-hover:text-[var(--footer-accent)] sm:text-sm"
          dangerouslySetInnerHTML={{ __html: post.title }}
        />
      </div>
    </Link>
  );
}

export default function TopDealsSection({ posts }: TopDealsSectionProps) {
  const items = posts.slice(0, 5);
  const duplicated = items.length > 0 ? [...items, ...items] : [];

  if (items.length === 0) return null;

  return (
    <section className="news-wire-room mt-8 w-full min-w-0 sm:mt-10" aria-label="Brand ticker">
      <div className="overflow-hidden rounded-xl border border-stone-800/12 bg-[var(--card-bg)] shadow-[0_20px_50px_-24px_rgba(28,25,23,0.2)]">
        <header className="flex min-w-0 items-stretch border-b-2 border-[var(--footer-accent)] bg-stone-900 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          <span className="flex items-center bg-[var(--footer-accent)] px-3 py-2.5 font-bold tracking-[0.12em] text-white">
            Ticker
          </span>
          <span className="hidden min-w-0 flex-1 items-center px-2 text-stone-400 sm:flex sm:line-clamp-2 sm:leading-snug sm:px-3 lg:line-clamp-none">
            Brand desk · rotating reads from the wire
          </span>
          <span className="flex items-center px-2 font-mono text-[10px] text-stone-500 sm:px-3">Live</span>
        </header>
        <div className="relative bg-[#ebe4da]/55 py-4">
          <div className="overflow-hidden">
            <div className="top-deals-track flex gap-3 px-3 sm:gap-4 sm:px-4" style={{ width: "max-content" }}>
              {duplicated.map((post, i) => (
                <TickerCard key={`${post.id}-${i}`} post={post} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
