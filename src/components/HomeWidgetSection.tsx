"use client";

import Image from "next/image";
import Link from "next/link";
import { useBlogData } from "@/components/BlogDataProvider";
import { stripHtml } from "@/lib/slugify";
import type { BlogPost } from "@/data/blog";

function WidgetColumn({
  posts,
  viewAllHref,
  viewAllLabel,
  buttonClass,
}: {
  posts: BlogPost[];
  viewAllHref: string;
  viewAllLabel: string;
  buttonClass: string;
}) {
  const main = posts[0];
  const list = posts.slice(1, 4);
  if (!main) return null;

  const mainDate = (main as { publishedDate?: string }).publishedDate ?? "";

  return (
    <div className="widget-item-home-outer widget-item-home-outer-col2-sidebar flex w-full flex-col rounded-lg border-0 border-gray-200 p-5 shadow-sm lg:w-[calc(50%-10px)] md:border" style={{ backgroundColor: "#f2ebe2" }}>
      <div className="hunted-post-widget">
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
                    src={post.image}
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

export default function HomeWidgetSection() {
  const { trendingPosts, featuredPosts, latestPosts } = useBlogData();
  const trending = trendingPosts.slice(0, 4);
  const featuredIds = new Set(featuredPosts.map((p) => p.id));
  const extra = latestPosts.filter((p) => !featuredIds.has(p.id));
  const featured = [...featuredPosts, ...extra].slice(0, 4);

  return (
    <section className="home-widget-area mb-10 w-full">
      <div className="home-widget-area-inner home-widget-area-inner-col2-sidebar clearfix flex flex-wrap gap-x-5 gap-y-8">
        <WidgetColumn
          posts={trending}
          viewAllHref="/#latest"
          viewAllLabel="VIEW ALL"
          buttonClass="bg-[var(--footer-accent)] hover:bg-[var(--footer-accent-hover)]"
        />
        <WidgetColumn
          posts={featured}
          viewAllHref="/#latest"
          viewAllLabel="VIEW ALL"
          buttonClass="bg-[var(--hunted-navy)] hover:bg-[var(--hunted-navy)]/90"
        />
      </div>
    </section>
  );
}
