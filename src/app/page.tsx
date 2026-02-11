import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HeroCategoryTabs from "@/components/HeroCategoryTabs";
import PostsWithLoadMore from "@/components/PostsWithLoadMore";
import MainSidebar from "@/components/MainSidebar";
import HomeWidgetSection from "@/components/HomeWidgetSection";
import TopDealsSection from "@/components/TopDealsSection";
import Footer from "@/components/Footer";
import { getBlogData } from "@/lib/blog";

export default async function Home() {
  const { mostPopularPosts, latestPosts } = await getBlogData();

  return (
    <div className="body-outer min-h-screen w-full text-[#555]" style={{ backgroundColor: "#e5dfd6" }}>
      <main className="w-full">
        <Header transparent />
        {/* Hero row: slider left (narrower on lg), category tabs right – same height as hero */}
        <div className="mx-auto max-w-7xl px-5 md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
            <div className="min-w-0 flex-1 lg:max-w-[calc(100%-340px)]">
              <Hero />
            </div>
            <div className="lg:h-[500px] lg:w-80 lg:shrink-0">
              <HeroCategoryTabs />
            </div>
          </div>
        </div>

        {/* Hunted fullwidth: site-mid full width */}
        <div className="site-mid w-full px-5 pb-5 md:px-6">
          {/* Hunted fullwidth=two_columns_sidebar: content LEFT, sidebar RIGHT (no overlap) */}
          <div className="main-container-sidebar main-container-sidebar-cc2 clearfix">
            <div className="site-content-sidebar site-content-sidebar-cc2">
              <div className="wrapper clearfix">
                {/* Hunted home-widget-area: two columns – main article + list + VIEW ALL (from theme file) */}
                <HomeWidgetSection />

                {/* Banner above LATEST – compact height & width */}
                <div className="mb-8 mx-auto h-40 max-w-6xl overflow-hidden rounded-xl shadow-md sm:h-44">
                  <Link href="/promotions" className="block h-full w-full">
                    <Image
                      src="/banner%201.jpg"
                      alt="You're just a click away from best discount offers"
                      width={1200}
                      height={400}
                      className="h-full w-full object-cover object-center"
                      sizes="(max-width: 1152px) 100vw, 1152px"
                      priority={false}
                    />
                  </Link>
                </div>

                <section id="latest" className="mb-10">
                  <h2 className="mb-4 border-b-[3px] border-[var(--footer-accent)] pb-2 text-lg font-bold uppercase tracking-wide text-[var(--hunted-navy)] sm:text-xl">
                    Latest
                  </h2>
                  <PostsWithLoadMore posts={latestPosts} />
                </section>
                <section className="mb-10">
                  <h2 className="mb-4 border-b-[3px] border-[var(--footer-accent)] pb-2 text-lg font-bold uppercase tracking-wide text-[var(--hunted-navy)] sm:text-xl">
                    Most Popular Articles
                  </h2>
                  <PostsWithLoadMore posts={mostPopularPosts} />
                </section>
              </div>
            </div>
            <MainSidebar />
          </div>

          {/* Top Brand Blogs – full width section */}
          <TopDealsSection posts={mostPopularPosts} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
