import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MainSidebar from "@/components/MainSidebar";
import PostsWithLoadMore from "@/components/PostsWithLoadMore";
import { getPostsByCategory } from "@/lib/blog";
import { getBlogCategoryBySlug } from "@/data/blog";
import { BLOG_CATEGORY_META } from "@/data/blog-category-meta";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const slugLower = slug.toLowerCase();
  const meta = BLOG_CATEGORY_META[slugLower];
  if (meta) {
    return { title: { absolute: meta.title }, description: meta.description };
  }
  return {};
}

export default async function BlogCategoryPage({ params }: Props) {
  const { slug } = await params;
  const category = getBlogCategoryBySlug(slug);
  if (!category) notFound();

  const posts = await getPostsByCategory(category);

  return (
    <div
      className="body-outer min-h-screen w-full text-zinc-900"
      style={{ backgroundColor: "#e5dfd6" }}
      suppressHydrationWarning
    >
      <Header />
      <main className="w-full">
        {/* Hero – category header */}
        <div className="border-b-2 border-[var(--footer-accent)] bg-gradient-to-b from-[var(--hunted-navy)] to-[var(--hunted-navy)]/95 px-5 py-10 text-white md:px-6">
          <div className="mx-auto max-w-7xl">
            <nav className="mb-3 text-xs text-white/80" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-white">Home</Link>
              <span className="mx-1.5">›</span>
              <span>{category}</span>
            </nav>
            <h1 className="text-2xl font-bold uppercase tracking-wide sm:text-3xl md:text-4xl">
              {category}
            </h1>
            <p className="mt-2 text-sm text-white/90">
              {posts.length} {posts.length === 1 ? "article" : "articles"}
            </p>
          </div>
        </div>

        {/* Content + Sidebar – same layout as homepage and blog post */}
        <div className="site-mid w-full px-5 pb-10 pt-6 md:px-6">
          <div className="main-container-sidebar main-container-sidebar-cc2 clearfix mx-auto max-w-7xl">
            <div className="site-content-sidebar site-content-sidebar-cc2">
              <div className="wrapper clearfix">
                <section className="mb-10">
                  <PostsWithLoadMore posts={posts} />
                </section>
              </div>
            </div>
            <MainSidebar />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  const { categories, blogCategorySlug } = await import("@/data/blog");
  return categories.map((name) => ({ slug: blogCategorySlug(name) }));
}
