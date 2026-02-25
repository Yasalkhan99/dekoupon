import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MainSidebar from "@/components/MainSidebar";
import { getPostBySlug, readBlogPosts, getBlogFeaturedImageUrl, resolveContentImageUrls } from "@/lib/blog";
import { stripHtml } from "@/lib/slugify";
import { getBlogImageAspectClass, blogCategorySlug } from "@/data/blog";

/** Add lazy loading to all images in HTML so the page doesn't lag when opening a blog */
function addLazyToContentImages(html: string): string {
  return html.replace(/<img /gi, '<img loading="lazy" decoding="async" ');
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};
  const metaTitle = (post as { meta_title?: string }).meta_title?.trim();
  const metaDesc = (post as { meta_description?: string }).meta_description?.trim();
  const title = metaTitle || stripHtml(post.title);
  const description = metaDesc || stripHtml(post.excerpt || "").slice(0, 160);
  return {
    title: title.slice(0, 100),
    description: description.slice(0, 160),
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const safeContent = post.content
    ? addLazyToContentImages(resolveContentImageUrls(post.content))
    : "";
  const category = post.category || "Blog";
  const publishedDate = post.publishedDate || "";
  const featuredImageUrl = getBlogFeaturedImageUrl(post.image);

  return (
    <div
      className="body-outer min-h-screen w-full text-zinc-900"
      style={{ backgroundColor: "#e5dfd6" }}
      suppressHydrationWarning
    >
      <Header />
      <main className="w-full">
        {/* Hero – full image visible; blurred duplicate fills letterbox areas instead of black */}
        <div className={`relative flex min-h-[320px] w-full items-center justify-center overflow-hidden bg-zinc-800 sm:min-h-[400px] md:min-h-[480px] ${getBlogImageAspectClass(post.imageAspectRatio ?? "16/9")}`}>
          {/* Blurred background – same image fills empty areas (no harsh black) */}
          <Image
            src={featuredImageUrl}
            alt=""
            aria-hidden
            fill
            className="object-cover scale-110 blur-2xl opacity-60"
            sizes="100vw"
            priority
          />
          {/* Sharp foreground – full image visible */}
          <Image
            src={featuredImageUrl}
            alt={stripHtml(post.title)}
            fill
            className="object-contain opacity-95"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-black/40" aria-hidden />
          <div className="absolute inset-0 flex flex-col justify-end px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto w-full max-w-3xl">
              <nav className="mb-2 text-xs text-white/90" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-white">Home</Link>
                <span className="mx-1.5">›</span>
                <Link href={`/blog/category/${blogCategorySlug(category)}`} className="hover:text-white">{category}</Link>
                <span className="mx-1.5">›</span>
                <span className="text-white/80 line-clamp-1" title={stripHtml(post.title)}>
                  {stripHtml(post.title)}
                </span>
              </nav>
              <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-white">{category}</p>
              <h1
                className="mb-2 text-2xl font-bold uppercase leading-tight text-white drop-shadow-sm sm:text-3xl md:text-4xl [&_a]:text-white [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />
              <p className="text-sm text-white/90">
                <span>by Admin</span>
                {publishedDate && (
                  <>
                    <span className="mx-1.5">•</span>
                    <span className="rounded bg-[var(--footer-accent)]/90 px-1.5 py-0.5 text-white">{publishedDate}</span>
                  </>
                )}
                <span className="mx-1.5">•</span>
                <span>0 comment</span>
              </p>
            </div>
          </div>
        </div>

        {/* Content + Sidebar – same layout as homepage */}
        <div className="site-mid w-full px-5 pb-10 pt-6 md:px-6">
          <div className="main-container-sidebar main-container-sidebar-cc2 clearfix mx-auto max-w-7xl">
            <div className="site-content-sidebar site-content-sidebar-cc2">
              <article className="min-w-0 px-0 py-6 sm:pr-2">
                <div className="prose prose-zinc mt-0 max-w-none [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800">
                  <div className="blog-content text-lg text-zinc-600" dangerouslySetInnerHTML={{ __html: post.excerpt }} />
                  {post.content ? (
                    <div
                      className="blog-content mt-4 text-zinc-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_img]:rounded-lg [&_img]:my-4 [&_img]:w-full [&_img]:h-auto [&_a]:text-blue-600 [&_a]:underline [&_a]:hover:text-blue-800"
                      dangerouslySetInnerHTML={{ __html: safeContent }}
                    />
                  ) : (
                    <p className="mt-4 text-zinc-700">Full article content – edit this post in Admin → Blog.</p>
                  )}
                </div>
              </article>
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
  const posts = await readBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}
