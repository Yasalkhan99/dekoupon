"use client";

import Link from "next/link";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";
import { categories as blogCategories, blogCategorySlug } from "@/data/blog";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import ResilientPostImage from "@/components/ResilientPostImage";

export default function MainSidebar() {
  const { trendingPosts, latestPosts } = useBlogData();
  const trendingList = trendingPosts.slice(0, 4);

  return (
    <aside className="news-wire-room sidebar sticky top-20 w-full min-w-0 shrink-0 self-start lg:w-[300px]">
      <div className="overflow-hidden rounded-xl border border-stone-800/12 bg-[var(--card-bg)] shadow-[0_16px_40px_-22px_rgba(28,25,23,0.16)]">
        <header className="flex items-stretch border-b-2 border-[var(--footer-accent)] bg-stone-900 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-500">
          <span className="flex items-center bg-[var(--footer-accent)] px-2.5 py-2.5 font-bold tracking-[0.12em] text-white">
            Pin
          </span>
          <span className="flex min-w-0 flex-1 items-center truncate px-2.5 py-2 text-stone-400">
            Tools &amp; desk notes
          </span>
        </header>

        <div className="divide-y divide-stone-200/90">
          {/* Search */}
          <div className="p-4">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">Search</h3>
            <form action="/promotions" method="get" className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                name="q"
                placeholder="Stores, deals…"
                className="min-w-0 flex-1 rounded-md border border-stone-300/90 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[var(--footer-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--footer-accent)]"
              />
              <button
                type="submit"
                className="rounded-md bg-stone-900 px-4 py-2 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[var(--footer-accent)]"
              >
                Go
              </button>
            </form>
          </div>

          {/* Disclaimer */}
          <Link
            href="/promotions"
            className="flex flex-col items-center bg-[var(--footer-accent)] px-4 py-5 text-center text-white transition hover:opacity-95"
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-white/10 text-lg font-bold">
              %
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest">Disclaimer</p>
            <p className="mt-1.5 max-w-[14rem] text-[11px] leading-relaxed text-white/90">
              We may earn commission on purchases made via affiliate links.
            </p>
          </Link>

          {/* Trending */}
          <div className="bg-[#f5f0ea]/80 p-4">
            <h3 className="mb-3 border-b border-stone-300/80 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600">
              Trending
            </h3>
            <ul className="space-y-3">
              {trendingList.map((post) => {
                const date = (post as { publishedDate?: string }).publishedDate ?? "";
                return (
                  <li key={post.id}>
                    <Link href={`/blog/${post.slug}`} className="group flex gap-3">
                      <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-md bg-stone-200 ring-1 ring-stone-200/80">
                        <ResilientPostImage
                          post={post}
                          fallbackKey="side"
                          wrapperClassName="relative h-full w-full overflow-hidden bg-stone-200"
                          imgClassName="absolute inset-0 h-full w-full object-cover transition group-hover:scale-105"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span
                          className="line-clamp-2 text-xs font-semibold leading-snug text-stone-900 group-hover:text-[var(--footer-accent)]"
                          dangerouslySetInnerHTML={{ __html: post.title }}
                        />
                        {date ? <span className="mt-0.5 block text-[10px] font-medium uppercase text-stone-500">{date}</span> : null}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Categories */}
          <div className="p-4">
            <h3 className="mb-2 border-b border-stone-300/80 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600">
              Categories
            </h3>
            <ul className="max-h-[220px] space-y-0.5 overflow-y-auto pr-1 text-sm">
              {blogCategories.slice(0, 14).map((cat) => (
                <li key={cat}>
                  <Link
                    href={`/blog/category/${blogCategorySlug(cat)}`}
                    className="block rounded py-1.5 text-stone-700 hover:bg-stone-200/50 hover:text-[var(--footer-accent)]"
                  >
                    <span className="mr-1.5 font-mono text-[10px] text-stone-400">·</span>
                    {cat}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow */}
          <div className="p-4">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600">Follow</h3>
            <div className="flex flex-wrap gap-2">
              {[
                { href: "https://facebook.com", label: "f", name: "Facebook" },
                { href: "https://twitter.com", label: "𝕏", name: "Twitter" },
                { href: "https://instagram.com", label: "◎", name: "Instagram" },
                { href: "https://pinterest.com", label: "P", name: "Pinterest" },
              ].map(({ href, label, name }) => (
                <a
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-stone-300/90 bg-white text-sm font-bold text-stone-800 transition hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]"
                  aria-label={name}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="border-t border-stone-200/90 bg-stone-900 px-4 py-5 text-center text-white">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400">Want more?</h3>
            <Link
              href="/promotions"
              className="mt-3 inline-block rounded-md border border-white/25 bg-[var(--footer-accent)] px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-emerald-500"
            >
              Promotions
            </Link>
          </div>

          {/* Newsletter */}
          <div className="bg-[#ebe4da]/50 p-4">
            <h3 className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600">Newsletter</h3>
            <NewsletterSubscribe
              placeholder="Your email"
              buttonText="Subscribe"
              layout="stack"
              className="space-y-2"
              inputClassName="w-full rounded-md border border-stone-300/90 bg-white px-3 py-2 text-sm focus:border-[var(--footer-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--footer-accent)]"
              buttonClassName="w-full rounded-md bg-stone-900 py-2.5 text-xs font-bold uppercase tracking-widest text-white transition hover:bg-[var(--footer-accent)]"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
