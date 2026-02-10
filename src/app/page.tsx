import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ArticleCard from "@/components/ArticleCard";
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
        <Hero />

        {/* Hunted fullwidth: site-mid full width */}
        <div className="site-mid w-full px-5 pb-5 md:px-6">
          {/* Hunted fullwidth=two_columns_sidebar: content LEFT, sidebar RIGHT (no overlap) */}
          <div className="main-container-sidebar main-container-sidebar-cc2 clearfix">
            <div className="site-content-sidebar site-content-sidebar-cc2">
              <div className="wrapper clearfix">
                {/* Hunted home-widget-area: two columns – main article + list + VIEW ALL (from theme file) */}
                <HomeWidgetSection />
                <section id="latest" className="mb-10">
                  <h2 className="mb-4 border-b-[3px] border-[var(--footer-accent)] pb-2 text-lg font-bold uppercase tracking-wide text-[var(--hunted-navy)] sm:text-xl">
                    Latest
                  </h2>
                  <div className="hunted-row-1-2">
                    {latestPosts.map((post) => (
                      <ArticleCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
                <section className="mb-10">
                  <h2 className="mb-4 border-b-[3px] border-[var(--footer-accent)] pb-2 text-lg font-bold uppercase tracking-wide text-[var(--hunted-navy)] sm:text-xl">
                    Most Popular Articles
                  </h2>
                  <div className="hunted-row-1-2">
                    {mostPopularPosts.map((post) => (
                      <ArticleCard key={post.id} post={post} />
                    ))}
                  </div>
                </section>
              </div>
            </div>
            <MainSidebar />
          </div>

          {/* Top Deals – full width section */}
          <TopDealsSection posts={mostPopularPosts} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
