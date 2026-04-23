import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { preload } from "react-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HeroCategoryTabs from "@/components/HeroCategoryTabs";
import PostsWithLoadMore from "@/components/PostsWithLoadMore";
import MainSidebar from "@/components/MainSidebar";
import HomeWidgetSection from "@/components/HomeWidgetSection";
import TopDealsSection from "@/components/TopDealsSection";
import Footer from "@/components/Footer";
import { getCachedBlogData } from "@/lib/blog";
import { getHomeHeroLcpMeta } from "@/lib/hero-lcp";
import { canonicalUrl, getSiteOrigin, HOME_PAGE_TITLE } from "@/lib/site";
import { buildHomeJsonLd } from "@/lib/json-ld";
import JsonLd from "@/components/JsonLd";

export const revalidate = 90;

export const metadata: Metadata = {
  title: { absolute: HOME_PAGE_TITLE },
  description:
    "Explore the SavingsHub4U blog for expert savings tips, coupon guides, deal updates, and smart shopping strategies. Learn how to maximize discounts and find the best online offers every day.",
  alternates: { canonical: canonicalUrl("/") },
};

/** Masthead row for homepage feed cards (matches Wire / Beat strips). */
function FeedSectionHeader({ title, code }: { title: string; code: string }) {
  return (
    <div className="flex min-w-0 items-stretch bg-stone-900 text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 sm:text-[11px]">
      <div
        className="flex shrink-0 items-center justify-center bg-[var(--footer-accent)] px-3 py-3 sm:px-4"
        aria-hidden
      >
        <span className="font-mono text-[10px] font-bold tracking-[0.2em] text-white">{code}</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center border-b-2 border-[var(--footer-accent)] px-3 py-2.5 sm:px-5 sm:py-3">
        <h2 className="category-desk-headline text-pretty text-base font-bold leading-tight text-white sm:text-lg md:text-xl">
          {title}
        </h2>
      </div>
    </div>
  );
}

export default async function Home() {
  const blog = await getCachedBlogData();
  const { mostPopularPosts, latestPosts } = blog;

  const lcpHero = getHomeHeroLcpMeta(blog);
  if (lcpHero) {
    let crossOrigin: "anonymous" | undefined;
    try {
      const imgOrigin = new URL(lcpHero.src).origin;
      const siteOrigin = new URL(getSiteOrigin()).origin;
      if (imgOrigin !== siteOrigin) crossOrigin = "anonymous";
    } catch {
      crossOrigin = undefined;
    }
    preload(lcpHero.src, {
      as: "image",
      fetchPriority: "high",
      ...(crossOrigin ? { crossOrigin } : {}),
    });
  }

  return (
    <div className="body-outer min-h-screen w-full bg-[var(--page-bg)] text-[var(--hunted-text-gray)]">
      <JsonLd data={buildHomeJsonLd(latestPosts)} />
      <main className="w-full">
        <h1 className="sr-only">{HOME_PAGE_TITLE}</h1>
        <Header transparent />

        <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-3 sm:px-6 lg:space-y-10 lg:px-8">
          {/* Hero: editorial “news desk” frame */}
          <section className="overflow-hidden rounded-xl border border-stone-800/12 bg-[var(--card-bg)] shadow-[0_24px_60px_-28px_rgba(28,25,23,0.28)]">
            <Hero>
              {lcpHero ? (
                <img
                  src={lcpHero.src}
                  alt={lcpHero.alt}
                  width={1200}
                  height={630}
                  fetchPriority="high"
                  decoding="async"
                  sizes="(max-width: 1024px) 100vw, min(1280px, 92vw)"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </Hero>
          </section>

          {/* Category tabs: below hero, full width */}
          <section aria-label="Highlights by category" className="scroll-mt-4">
            <HeroCategoryTabs />
          </section>

          {/* Wire desks: full row width — avoids 3 columns squeezed beside sidebar */}
          <section aria-label="Wire desk coverage" className="scroll-mt-2">
            <HomeWidgetSection />
          </section>

          {/* Main + sidebar */}
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12">
            <div className="min-w-0 flex-1 space-y-12 lg:space-y-14">
              <section className="news-wire-room overflow-hidden rounded-xl border border-stone-800/12 bg-[var(--card-bg)] shadow-[0_16px_40px_-20px_rgba(28,25,23,0.2)]">
                <div className="flex flex-col md:flex-row md:items-stretch">
                  <div className="flex shrink-0 items-center justify-center bg-stone-900 px-3 py-2 text-center md:w-24 md:flex-col md:justify-center md:py-4 md:[writing-mode:vertical-rl] md:[text-orientation:mixed]">
                    <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-emerald-300/95 md:py-2">
                      Promo
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 border-t border-stone-200/90 bg-[#f5f0ea]/40 p-2 md:border-t-0 md:border-l md:p-3">
                    <Link
                      href="/promotions"
                      className="relative block aspect-[3/1] w-full overflow-hidden rounded-lg bg-[#f4efe8] ring-1 ring-stone-200/80 transition hover:ring-[var(--footer-accent)]/40"
                    >
                      <Image
                        src="/banner%201.jpg"
                        alt="You're just a click away from best discount offers"
                        width={1200}
                        height={400}
                        className="h-full w-full object-contain object-center"
                        sizes="(max-width: 768px) 100vw, (max-width: 1152px) 90vw, 1152px"
                        fetchPriority="low"
                      />
                    </Link>
                  </div>
                </div>
              </section>

              <section id="latest" className="news-wire-room scroll-mt-24">
                <div className="overflow-hidden rounded-xl border border-stone-800/12 bg-[var(--card-bg)] shadow-[0_16px_40px_-22px_rgba(28,25,23,0.18)]">
                  <FeedSectionHeader title="Latest" code="NEW" />
                  <div className="border-t border-stone-200/80 p-4 sm:p-5 md:p-6">
                    <PostsWithLoadMore posts={latestPosts} articleTitleHeading="h3" skin="desk" />
                  </div>
                </div>
              </section>

              <section className="news-wire-room scroll-mt-24">
                <div className="overflow-hidden rounded-xl border border-stone-800/12 bg-[var(--card-bg)] shadow-[0_16px_40px_-22px_rgba(28,25,23,0.18)]">
                  <FeedSectionHeader title="Most popular articles" code="TOP" />
                  <div className="border-t border-stone-200/80 p-4 sm:p-5 md:p-6">
                    <PostsWithLoadMore posts={mostPopularPosts} articleTitleHeading="h3" skin="desk" />
                  </div>
                </div>
              </section>
            </div>

            <MainSidebar />
          </div>

          <TopDealsSection posts={mostPopularPosts} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
