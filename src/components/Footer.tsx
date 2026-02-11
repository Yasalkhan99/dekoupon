"use client";

import Image from "next/image";
import Link from "next/link";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";
import { categories as blogCategories } from "@/data/blog";
import { useState, useEffect } from "react";

const QUICK_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Promotions", href: "/promotions" },
  { label: "Blog", href: "/#latest" },
];

const POPULAR_TAGS = [
  "Deals", "Coupons", "Fashion", "Lifestyle", "Travel", "Tech",
  "Food", "Health", "Stores", "Savings", "Blog",
];

export default function Footer() {
  const { heroPost, latestPosts } = useBlogData();
  const featuredPost = heroPost || latestPosts[0];
  const recentPosts = latestPosts.slice(0, 3);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const categories = blogCategories.slice(0, 14);
  const mid = Math.ceil(categories.length / 2);
  const col1 = categories.slice(0, mid);
  const col2 = categories.slice(mid);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer id="footer-box-outer" className="footer-box-outer mt-12 bg-[#0f0f0f] text-white">
      {/* 3-column section: SavingsHub4u | Featured post | Popular Tags – newsletter ke oopr */}
      <div className="mx-auto max-w-[1240px] px-5 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: "#162238" }}>
        <div className="grid gap-10 lg:grid-cols-3">
          <div>
            <h2 className="mb-4 flex items-center gap-3 text-lg font-bold uppercase tracking-wide text-white">
              <span className="h-8 w-0.5 shrink-0 rounded-full bg-white" aria-hidden />
              SavingsHub4u
            </h2>
            <p className="mb-3 text-sm leading-relaxed text-gray-300">
              Your gateway to smart savings. We bring you verified coupon codes, exclusive deals and money-saving tips — all in one place.
            </p>
            <p className="text-sm leading-relaxed text-gray-300">
              Explore top stores, grab the best coupons and never miss a deal again.
            </p>
          </div>
          <div>
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
          <div>
            <h2 className="mb-4 flex items-center gap-3 text-lg font-bold uppercase tracking-wide text-white">
              <span className="h-8 w-0.5 shrink-0 rounded-full bg-white" aria-hidden />
              Popular Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map((tag) => (
                <Link
                  key={tag}
                  href="/#latest"
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

      {/* Newsletter bar – background matches SVG illustration blues */}
      <div className="relative overflow-hidden px-5 py-8 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--newsletter-bg)" }}>
        {/* Left decorative SVG */}
        <div className="absolute left-0 top-1/2 hidden w-[120px] -translate-y-1/2 opacity-90 sm:block lg:w-[160px]">
          <Image
            src="/Group 1171275124.svg"
            alt=""
            width={160}
            height={164}
            className="h-auto w-full object-contain"
          />
        </div>
        {/* Right decorative SVG */}
        <div className="absolute right-0 top-1/2 hidden w-[120px] -translate-y-1/2 opacity-90 sm:block lg:w-[160px]">
          <Image
            src="/Group 1171275125.svg"
            alt=""
            width={160}
            height={164}
            className="h-auto w-full object-contain"
          />
        </div>
        <div className="relative mx-auto max-w-[600px] text-center">
          <h2 className="mb-2 text-xl font-bold uppercase tracking-wide text-white">
            Subscribe to Our Newsletter
          </h2>
          <p className="mb-5 text-sm text-white/90">No worries, we don&apos;t like spam either.</p>
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

      {/* 4-column section: Brand | Quick Links | Categories | Recent Post (pehla wala footer) */}
      <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2" aria-label="SavingsHub4u">
              <Image
                src="/final final logo.svg"
                alt=""
                width={160}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Your gateway to smart savings. We bring you verified coupon codes, exclusive deals and money-saving tips — all in one place.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-gray-400 hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Categories</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-gray-400">
              {col1.map((cat) => (
                <Link key={cat} href="/#latest" className="flex items-center gap-2 hover:text-white">
                  <span className="text-[var(--footer-accent)]">•</span> {cat}
                </Link>
              ))}
              {col2.map((cat) => (
                <Link key={cat} href="/#latest" className="flex items-center gap-2 hover:text-white">
                  <span className="text-[var(--footer-accent)]">•</span> {cat}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Recent Post</h3>
            <ul className="space-y-4">
              {recentPosts.map((post, i) => (
                <li key={post.id}>
                  <Link href={post.slug ? `/blog/${post.slug}` : "#"} className="group flex gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-gray-800">
                      <Image
                        src={post.image}
                        alt={stripHtml(post.title)}
                        fill
                        className="object-cover transition group-hover:scale-105"
                        sizes="56px"
                      />
                      <span
                        className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center bg-[var(--footer-accent)] text-[10px] font-bold text-white"
                        aria-hidden
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                        {(post as { publishedDate?: string }).publishedDate ?? "Blog"}
                      </p>
                      <p className="line-clamp-2 text-sm font-medium text-white group-hover:text-[var(--footer-accent)]">
                        <span dangerouslySetInnerHTML={{ __html: post.title }} />
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar: copyright | social | terms | scroll to top */}
      <div className="relative border-t border-white/10 bg-black py-5">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-xs text-gray-400 sm:text-left">
            © {new Date().getFullYear()} SavingsHub4u. All Rights Reserved
          </p>
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black text-white hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Facebook">
                f
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black text-white hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Twitter">
                𝕏
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black text-white hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Instagram">
                📷
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black text-white hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="YouTube">
                ▶
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/30 bg-black text-white hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Pinterest">
                P
              </a>
            </div>
          </div>
        </div>

        {/* Scroll to top – bottom right */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--footer-accent)] text-white shadow-lg transition hover:opacity-90"
            aria-label="Scroll to top"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
          </button>
        )}
      </div>
    </footer>
  );
}
