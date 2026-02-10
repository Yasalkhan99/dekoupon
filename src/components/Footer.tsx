"use client";

import Image from "next/image";
import Link from "next/link";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";

const POPULAR_TAGS = [
  "Deals", "Coupons", "Fashion", "Lifestyle", "Travel", "Tech",
  "Food", "Health", "Stores", "Savings", "Blog",
];

export default function Footer() {
  const { heroPost, latestPosts } = useBlogData();
  const featuredPost = heroPost || latestPosts[0];

  return (
    <footer id="footer-box-outer" className="footer-box-outer mt-12 text-white">
      {/* Top section – dark navy (Hunted: Magazine info | Featured post | Popular Tags) */}
      <div className="footer-box-inner mx-auto max-w-[1240px] px-5 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: "#162238" }}>
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Left: Hunted Magazine / SavingsHub4u */}
          <div className="widget-item-footer">
            <h2 className="mb-4 flex items-center gap-3 text-lg font-bold uppercase tracking-wide text-white">
              <span className="h-8 w-0.5 shrink-0 rounded-full bg-[var(--footer-accent)]" aria-hidden />
              SavingsHub4u
            </h2>
            <p className="mb-3 text-sm leading-relaxed text-gray-300">
              Your gateway to smart savings. We bring you verified coupon codes, exclusive deals and money-saving tips — all in one place.
            </p>
            <p className="text-sm leading-relaxed text-gray-300">
              Explore top stores, grab the best coupons and never miss a deal again.
            </p>
          </div>

          {/* Middle: Featured article card */}
          <div className="widget-item-footer">
            {featuredPost && (
              <Link href={featuredPost.slug ? `/blog/${featuredPost.slug}` : "#"} className="group block overflow-hidden rounded">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-800">
                  <Image
                    src={featuredPost.image}
                    alt={stripHtml(featuredPost.title)}
                    fill
                    className="object-cover transition group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 bg-[var(--footer-accent)] p-4">
                    <p className="mb-1 text-xs font-bold text-white/90">
                      {(featuredPost as { publishedDate?: string }).publishedDate ?? ""}
                    </p>
                    <h3
                      className="mb-1 line-clamp-2 text-base font-bold leading-snug text-white"
                      dangerouslySetInnerHTML={{ __html: featuredPost.title }}
                    />
                    <p className="text-xs text-white/80">0 Comments</p>
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Right: Popular Tags */}
          <div className="widget-item-footer">
            <h2 className="mb-4 flex items-center gap-3 text-lg font-bold uppercase tracking-wide text-white">
              <span className="h-8 w-0.5 shrink-0 rounded-full bg-[var(--footer-accent)]" aria-hidden />
              Popular Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href="/promotions/categories"
                  className="rounded border border-white px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-[var(--footer-accent)]"
                  style={{ backgroundColor: "#162238" }}
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter bar – blue */}
      <div className="newsletter-bar bg-[var(--footer-accent)] px-5 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[600px] text-center">
          <h2 className="mb-2 text-2xl font-bold uppercase tracking-wide text-white">
            Subscribe to Our Newsletter
          </h2>
          <p className="mb-6 text-sm text-white/90">No worries, we don&apos;t like spam either.</p>
          <form action="/promotions" method="get" className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <input
              type="email"
              name="email"
              placeholder="Your e-mail address"
              className="min-w-0 flex-1 rounded border-2 border-white bg-white px-4 py-3 text-zinc-800 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/50 sm:max-w-[280px]"
            />
            <button
              type="submit"
              className="rounded border-2 border-white px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-[var(--footer-accent)]"
              style={{ backgroundColor: "#162238" }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar – copyright + links (light text + white logo on dark bg) */}
      <div className="footer-bottom-outer border-t-2 border-[var(--footer-accent)] py-4" style={{ backgroundColor: "#1a1a1a" }}>
        <div className="footer-bottom mx-auto flex max-w-[1240px] flex-col items-center justify-center gap-3 px-5 text-center text-xs font-bold text-gray-300 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center" aria-label="SavingsHub4u">
            <Image
              src="/final final logo.svg"
              alt="SavingsHub4u"
              width={140}
              height={28}
              className="h-7 w-auto object-contain"
            />
          </Link>
          <p className="text-gray-300">© {new Date().getFullYear()} SavingsHub4u. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/privacy" className="text-gray-300 hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="text-gray-300 hover:text-white">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
