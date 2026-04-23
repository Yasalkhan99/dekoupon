"use client";

import Image from "next/image";
import Link from "next/link";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";
import { categories as blogCategories, blogCategorySlug } from "@/data/blog";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { useState, useEffect } from "react";

const QUICK_LINKS = [
  { label: "About", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Imprint", href: "/imprint" },
  { label: "Promotions", href: "/promotions" },
  { label: "Blog", href: "/#latest" },
];

type BlogPostForCard = { id: string; title: string; slug?: string; image: string; publishedDate?: string };

function FooterCategoryCard({
  title,
  posts,
  viewAllHref,
  fallbackPosts,
}: {
  title: string;
  posts: BlogPostForCard[];
  viewAllHref: string;
  fallbackPosts: BlogPostForCard[];
}) {
  const displayPosts = posts.length >= 4 ? posts : [...posts, ...fallbackPosts.filter((f) => !posts.some((p) => p.id === f.id))].slice(0, 4);
  const main = displayPosts[0];
  const list = displayPosts.slice(1, 4);
  if (!main) return null;
  const mainDate = (main as { publishedDate?: string }).publishedDate ?? "";
  return (
    <div className="flex w-full flex-col rounded-lg border border-zinc-300/80 bg-[#f2ebe2] p-5 shadow-sm lg:w-full" style={{ backgroundColor: "#f2ebe2" }}>
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--hunted-navy)]">{title}</h2>
      <Link href={main.slug ? `/blog/${main.slug}` : "#"} className="listing-box block border-b-2 border-[var(--hunted-navy)] pb-3">
        <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-zinc-600">
          {mainDate && <span className="listing-date">{mainDate}</span>}
          <span className="listing-comment">0 Comments</span>
        </div>
        <h3
          className="listing-title text-lg font-bold leading-tight text-[var(--hunted-navy)] hover:text-[var(--footer-accent)] sm:text-xl"
          dangerouslySetInnerHTML={{ __html: main.title }}
        />
      </Link>
      <ul className="mt-4 space-y-0">
        {list.map((post) => (
          <li key={post.id} className="widget-listing-z border-b border-zinc-300/60 py-3 last:border-b-0">
            <Link href={post.slug ? `/blog/${post.slug}` : "#"} className="flex gap-3">
              <div className="relative h-[60px] w-[96px] shrink-0 overflow-hidden bg-zinc-200">
                {post.image ? (
                  <Image
                    src={post.image}
                    alt={stripHtml(post.title)}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                ) : null}
              </div>
              <span
                className="widget-listing-z-title flex-1 text-base font-medium leading-snug text-[var(--hunted-navy)] hover:text-[var(--footer-accent)]"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={viewAllHref}
        className="mt-4 inline-block bg-[var(--footer-accent)] px-6 py-3 text-center text-sm font-bold uppercase tracking-wide text-white hover:opacity-90"
      >
        VIEW ALL
      </Link>
    </div>
  );
}

export default function Footer() {
  const { latestPosts, allPosts } = useBlogData();
  const recentPosts = latestPosts.slice(0, 3);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const categories = blogCategories.slice(0, 14);
  const mid = Math.ceil(categories.length / 2);
  const col1 = categories.slice(0, mid);
  const col2 = categories.slice(mid);

  const entertainmentPosts = (allPosts || []).filter(
    (p) => (p.category || "").toLowerCase().includes("entertainment")
  ).slice(0, 4);
  const healthFitnessPosts = (allPosts || []).filter(
    (p) => (p.category || "").toLowerCase().includes("health") || (p.category || "").toLowerCase().includes("fitness")
  ).slice(0, 4);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const peachBg = "#f2ebe2";

  return (
    <footer id="footer-box-outer" className="footer-box-outer mt-12 text-zinc-800" style={{ backgroundColor: peachBg }}>
      {/* 2-column section: full width – Entertainment (left) | Health & Fitness (right) */}
      <div className="w-full px-5 py-12 sm:px-6 lg:px-8" style={{ backgroundColor: peachBg }}>
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-8 lg:grid-cols-2">
          <FooterCategoryCard
            title="Entertainment"
            posts={entertainmentPosts}
            viewAllHref="/blog/category/entertainment"
            fallbackPosts={latestPosts}
          />
          <FooterCategoryCard
            title="Health & Fitness"
            posts={healthFitnessPosts}
            viewAllHref="/blog/category/health-fitness"
            fallbackPosts={latestPosts}
          />
          </div>
        </div>
      </div>

      {/* Newsletter bar */}
      <div className="relative overflow-hidden px-5 py-8 sm:px-6 lg:px-8" style={{ backgroundColor: "var(--newsletter-bg)" }}>
        <div className="relative mx-auto max-w-[600px] text-center">
          <h2 className="mb-2 text-xl font-bold uppercase tracking-wide text-white">
            Subscribe to Our Newsletter
          </h2>
          <p className="mb-5 text-sm text-white/90">No worries, we don&apos;t like spam either.</p>
          <NewsletterSubscribe
            placeholder="Your e-mail address"
            buttonText="Subscribe"
            layout="row"
            className="flex flex-col gap-3 sm:flex-row sm:justify-center"
            inputClassName="min-w-0 flex-1 rounded border-2 border-white bg-white px-4 py-3 text-zinc-800 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/50 sm:max-w-[280px]"
            buttonClassName="rounded border-2 border-white px-8 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:bg-white hover:text-[var(--footer-accent)]"
            buttonStyle={{ backgroundColor: "var(--hunted-navy)" }}
          />
        </div>
      </div>

      {/* 4-column section: Brand | Quick Links | Categories | Recent Post – black, full width */}
      <div className="w-full" style={{ backgroundColor: "#000000" }}>
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-3" aria-label="Dekoupon">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--footer-accent)] text-lg font-black text-white ring-2 ring-white/20"
                aria-hidden
              >
                D
              </span>
              <span className="text-xl font-extrabold leading-tight tracking-tight text-white" style={{ fontFamily: "var(--font-nav), system-ui, sans-serif" }}>
                <span className="text-[var(--nav-accent)]">Deko</span>
                upon
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-white/80">
              Your gateway to smart savings. We bring you verified coupon codes, exclusive deals and money-saving tips — all in one place.
            </p>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Quick Links</h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-sm text-white/80 hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Categories</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-white/80">
              {col1.map((cat) => (
                <Link key={cat} href={`/blog/category/${blogCategorySlug(cat)}`} className="flex items-center gap-2 hover:text-white">
                  <span className="text-[var(--footer-accent)]">•</span> {cat}
                </Link>
              ))}
              {col2.map((cat) => (
                <Link key={cat} href={`/blog/category/${blogCategorySlug(cat)}`} className="flex items-center gap-2 hover:text-white">
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
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-white/10">
                      {post.image ? (
                        <Image
                          src={post.image}
                          alt={stripHtml(post.title)}
                          fill
                          className="object-cover transition group-hover:scale-105"
                          sizes="56px"
                        />
                      ) : null}
                      <span
                        className="absolute left-0 top-0 flex h-5 w-5 items-center justify-center bg-[var(--footer-accent)] text-[10px] font-bold text-white"
                        aria-hidden
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-white/60">
                        {(post as { publishedDate?: string }).publishedDate ?? "Blog"}
                      </p>
                      <p className="line-clamp-2 text-sm font-medium text-white/90 group-hover:text-[var(--footer-accent)]">
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
      </div>

      {/* Bottom bar: copyright | social | scroll to top – black, full width */}
      <div className="relative w-full border-t border-white/10 py-5" style={{ backgroundColor: "#000000" }}>
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-4 px-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-center text-xs text-white/80 sm:text-left">
            © {new Date().getFullYear()} Dekoupon. All Rights Reserved
          </p>
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Facebook">
                f
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Twitter">
                𝕏
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Instagram">
                📷
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="YouTube">
                ▶
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:border-[var(--footer-accent)] hover:text-[var(--footer-accent)]" aria-label="Pinterest">
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
