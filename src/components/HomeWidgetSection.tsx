"use client";

import Image from "next/image";
import Link from "next/link";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";
import { resolveHeroSlideImageUrl } from "@/lib/hero-image";
import type { BlogPost } from "@/data/blog";

function WidgetColumn({
  posts,
  viewAllHref,
  viewAllLabel,
  buttonClass,
  categoryLabel,
  widthClassName = "lg:w-[calc(50%-10px)]",
}: {
  posts: BlogPost[];
  viewAllHref: string;
  viewAllLabel: string;
  buttonClass: string;
  categoryLabel?: string;
  /** e.g. three columns: lg:w-[calc(33.333%-11px)] */
  widthClassName?: string;
}) {
  const main = posts[0];
  const list = posts.slice(1, 4);
  if (!main) return null;

  const mainDate = (main as { publishedDate?: string }).publishedDate ?? "";

  return (
    <div
      className={`widget-item-home-outer widget-item-home-outer-col2-sidebar flex w-full flex-col rounded-lg border-0 border-gray-200 p-5 shadow-sm md:border ${widthClassName}`}
      style={{ backgroundColor: "#f2ebe2" }}
    >
      <div className="hunted-post-widget">
        {categoryLabel && (
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--hunted-navy)]">{categoryLabel}</h3>
        )}
        {/* Main article – date, comments, headline */}
        <Link href={main.slug ? `/blog/${main.slug}` : "#"} className="listing-box block border-b-0 pb-3 md:border-b-2 md:border-[var(--hunted-navy)]">
          <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-[var(--hunted-text-gray)]">
            {mainDate && <span className="listing-date">{mainDate}</span>}
            <span className="listing-comment">0 Comments</span>
          </div>
          <h2
            className="listing-title text-lg font-bold leading-tight text-[var(--hunted-navy)] hover:text-[var(--footer-accent)] sm:text-xl lg:text-[25px]"
            dangerouslySetInnerHTML={{ __html: main.title }}
          />
        </Link>

        {/* Small list – thumb + title (Hunted widget-listing-z style) */}
        <ul className="mt-4 space-y-0">
          {list.map((post) => (
            <li key={post.id} className="widget-listing-z border-b-0 py-3 last:border-b-0 md:border-b md:border-[var(--theme-border)]">
              <Link href={post.slug ? `/blog/${post.slug}` : "#"} className="flex gap-3">
                <div className="relative h-[60px] w-[96px] shrink-0 overflow-hidden bg-[var(--hunted-gray)]">
                  <Image
                    src={resolveHeroSlideImageUrl(post.image, post.content, post.slug)}
                    alt={stripHtml(post.title)}
                    fill
                    className="object-cover"
                    sizes="96px"
                  />
                </div>
                <span
                  className="widget-listing-z-title flex-1 text-base font-medium leading-snug text-[var(--hunted-navy)] hover:text-[var(--footer-accent)]"
                  dangerouslySetInnerHTML={{ __html: post.title }}
                />
              </Link>
            </li>
          ))}
        </ul>

        {/* VIEW ALL button */}
        <Link
          href={viewAllHref}
          className={`mt-4 inline-block px-6 py-3 text-center text-sm font-bold uppercase tracking-wide text-white ${buttonClass}`}
        >
          {viewAllLabel}
        </Link>
      </div>
    </div>
  );
}

function fillWidgetPosts(
  matched: BlogPost[],
  latestPosts: BlogPost[],
  take: number
): BlogPost[] {
  if (matched.length >= take) return matched.slice(0, take);
  const ids = new Set(matched.map((p) => p.id));
  const rest = latestPosts.filter((p) => !ids.has(p.id));
  return [...matched, ...rest].slice(0, take);
}

export default function HomeWidgetSection() {
  const { latestPosts, allPosts } = useBlogData();
  const travelPosts = (allPosts || [])
    .filter((p) => (p.category || "").toLowerCase().includes("travel"))
    .slice(0, 4);
  const clothingPosts = (allPosts || [])
    .filter((p) => {
      const c = (p.category || "").toLowerCase();
      return c.includes("clothing") || c.includes("fashion");
    })
    .slice(0, 4);
  const techHomePosts = (allPosts || [])
    .filter((p) => {
      const c = (p.category || "").toLowerCase();
      return (
        c.includes("technology") ||
        c.includes("electronic") ||
        c.includes("home") ||
        c.includes("garden") ||
        c.includes("entertainment") ||
        c.includes("gaming")
      );
    })
    .slice(0, 4);

  const travel = fillWidgetPosts(travelPosts, latestPosts, 4);
  const clothing = fillWidgetPosts(clothingPosts, latestPosts, 4);
  const techHome = fillWidgetPosts(techHomePosts, latestPosts, 4);

  const colWidth = "lg:w-[calc(33.333%-11px)]";

  return (
    <section className="home-widget-area mb-10 w-full">
      <div className="home-widget-area-inner home-widget-area-inner-col2-sidebar clearfix flex flex-wrap gap-x-5 gap-y-8 lg:justify-between">
        <WidgetColumn
          posts={travel}
          viewAllHref="/#latest"
          viewAllLabel="VIEW ALL"
          buttonClass="bg-[var(--footer-accent)] hover:bg-[var(--footer-accent-hover)]"
          categoryLabel="Travel"
          widthClassName={colWidth}
        />
        <WidgetColumn
          posts={clothing}
          viewAllHref="/#latest"
          viewAllLabel="VIEW ALL"
          buttonClass="bg-[var(--hunted-navy)] hover:bg-[var(--hunted-navy)]/90"
          categoryLabel="Clothing & Accessories"
          widthClassName={colWidth}
        />
        <WidgetColumn
          posts={techHome}
          viewAllHref="/#latest"
          viewAllLabel="VIEW ALL"
          buttonClass="bg-[var(--footer-accent)] hover:bg-[var(--footer-accent-hover)]"
          categoryLabel="Tech, Home & Entertainment"
          widthClassName={colWidth}
        />
      </div>
    </section>
  );
}
