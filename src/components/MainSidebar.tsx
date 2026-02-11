"use client";

import Image from "next/image";
import Link from "next/link";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";
import { categories as blogCategories } from "@/data/blog";

const SIDEBAR_TAGS = [
  "Tech", "Life", "Travel", "Fashion", "Health", "Lifestyle",
  "Photography", "Design", "Nature", "Style", "Deals", "Coupons",
];

export default function MainSidebar() {
  const { trendingPosts, latestPosts } = useBlogData();
  const recentPosts = latestPosts.slice(0, 4);
  const trendingList = trendingPosts.slice(0, 4);

  return (
    <aside className="sidebar sticky top-20 w-full shrink-0 self-start lg:w-[300px]">
      <div className="space-y-6">
        {/* 1. Search */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: "var(--sidebar-widget-1)" }}>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--hunted-navy)]">
            Search
          </h3>
          <form action="/promotions" method="get" className="flex gap-2">
            <input
              type="search"
              name="q"
              placeholder="Search..."
              className="flex-1 rounded border border-[var(--footer-accent)]/30 bg-white/80 px-3 py-2 text-sm text-[var(--hunted-navy)] placeholder:text-[var(--hunted-text-light)] focus:border-[var(--footer-accent)] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              className="bg-[var(--hunted-navy)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--footer-accent)]"
            >
              Search
            </button>
          </form>
        </div>

        {/* 2. Disclaimer – same as categories page */}
        <Link
          href="/promotions"
          className="flex flex-col items-center justify-center rounded-2xl px-4 py-6 text-center text-white shadow-lg transition hover:opacity-90"
          style={{ backgroundColor: "var(--footer-accent)" }}
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <Image
              src="/fav%20icon%20final%20logo.png"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6 object-contain brightness-0 invert"
            />
          </div>
          <p className="mb-1.5 text-base font-bold">Disclaimer:</p>
          <p className="text-xs leading-relaxed">
            We May Earn Commission
            <br />
            On The Purchases Made
            <br />
            Via Affiliate Link
          </p>
        </Link>

        {/* 3. Trending Posts */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: "var(--sidebar-widget-3)" }}>
          <h3 className="mb-4 border-b-0 pb-2 text-xs font-bold uppercase tracking-wider text-[var(--hunted-navy)] md:border-b-2 md:border-[var(--footer-accent)]">
            Trending Posts
          </h3>
          <ul className="space-y-4">
            {trendingList.map((post) => {
              const date = (post as { publishedDate?: string }).publishedDate ?? "Feb 10, 2026";
              return (
                <li key={post.id}>
                  <Link href={`/blog/${post.slug}`} className="group flex gap-3">
                    <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded bg-[var(--hunted-gray)]">
                      <Image
                        src={post.image}
                        alt={stripHtml(post.title)}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="64px"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className="line-clamp-2 text-sm font-medium text-[var(--hunted-navy)] group-hover:text-[var(--footer-accent)] group-hover:underline"
                        dangerouslySetInnerHTML={{ __html: post.title }}
                      />
                      <span className="mt-1 block text-xs text-[var(--hunted-text-light)]">{date}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 4. Categories */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: "var(--sidebar-widget-1)" }}>
          <h3 className="mb-4 border-b-0 pb-2 text-xs font-bold uppercase tracking-wider text-[var(--hunted-navy)] md:border-b-2 md:border-[var(--footer-accent)]">
            Categories
          </h3>
          <ul className="space-y-2">
            {blogCategories.slice(0, 14).map((cat) => (
              <li key={cat}>
                <Link
                  href="/#latest"
                  className="block py-1.5 text-sm text-[var(--hunted-text-gray)] hover:text-[var(--footer-accent)]"
                >
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* 5. Follow Us */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: "var(--sidebar-widget-2)" }}>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--hunted-navy)]">
            Follow Us
          </h3>
          <div className="flex flex-wrap gap-2">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--theme-border)] text-center text-sm font-bold text-[var(--hunted-navy)] hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Facebook">f</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--theme-border)] text-center text-sm font-bold text-[var(--hunted-navy)] hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Twitter">𝕏</a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--theme-border)] text-center text-sm font-bold text-[var(--hunted-navy)] hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Instagram">📷</a>
            <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--theme-border)] text-center text-sm font-bold text-[var(--hunted-navy)] hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Pinterest">P</a>
          </div>
        </div>

        {/* 6. CTA – WANT MORE NEWS? */}
        <div className="bg-[var(--footer-accent)] p-5 text-center text-white">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider">Want More News?</h3>
          <Link
            href="/promotions"
            className="inline-block rounded bg-white/95 px-5 py-2.5 text-sm font-bold text-[var(--footer-accent)] shadow hover:bg-[var(--hunted-navy)] hover:text-white"
          >
            Sign Up Now
          </Link>
        </div>

        {/* 7. Newsletter */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: "var(--sidebar-widget-3)" }}>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--hunted-navy)]">
            Newsletter
          </h3>
          <form action="/promotions" method="get" className="space-y-2">
            <input
              type="email"
              name="email"
              placeholder="Your email"
              className="w-full border border-[var(--theme-border)] px-3 py-2 text-sm focus:border-[var(--footer-accent)] focus:outline-none"
            />
            <button
              type="submit"
              className="w-full bg-[var(--hunted-navy)] py-2.5 text-sm font-bold text-white hover:bg-[var(--footer-accent)]"
            >
              Subscribe
            </button>
          </form>
        </div>

        {/* 8. Tag Cloud */}
        <div className="rounded-lg p-4 shadow-sm" style={{ backgroundColor: "var(--sidebar-widget-1)" }}>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--hunted-navy)]">
            Tag Cloud
          </h3>
          <div className="flex flex-wrap gap-2">
            {SIDEBAR_TAGS.map((tag) => (
              <Link
                key={tag}
                href="/promotions/categories"
                className="rounded border border-[var(--theme-border)] bg-[var(--theme-breadcrumb-bg)] px-2.5 py-1 text-xs text-[var(--hunted-text-gray)] hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
