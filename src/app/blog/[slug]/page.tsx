import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPostBySlug, readBlogPosts } from "@/lib/blog";
import { stripHtml } from "@/lib/slugify";

/** Add lazy loading to all images in HTML so the page doesn't lag when opening a blog */
function addLazyToContentImages(html: string): string {
  return html.replace(/<img /gi, '<img loading="lazy" decoding="async" ');
}

type Props = { params: Promise<{ slug: string }> };

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const safeContent = post.content ? addLazyToContentImages(post.content) : "";
  const category = post.category || "Blog";
  const publishedDate = post.publishedDate || "";

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Header />
      <main>
        {/* Featured image hero with overlays: breadcrumbs, category, title, metadata */}
        <div className="relative aspect-[21/9] min-h-[240px] w-full overflow-hidden bg-zinc-900 sm:min-h-[280px] md:aspect-[3/1] md:min-h-[320px]">
          <Image
            src={post.image || "https://picsum.photos/id/1/1200/600"}
            alt={stripHtml(post.title)}
            fill
            className="object-cover opacity-90"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-black/50" aria-hidden />
          <div className="absolute inset-0 flex flex-col justify-end px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
            <div className="mx-auto w-full max-w-3xl">
              {/* Breadcrumbs */}
              <nav className="mb-2 text-xs text-white/90" aria-label="Breadcrumb">
                <Link href="/" className="hover:text-white">Home</Link>
                <span className="mx-1.5">›</span>
                <Link href="/#latest" className="hover:text-white">{category}</Link>
                <span className="mx-1.5">›</span>
                <span className="text-white/80 line-clamp-1" title={stripHtml(post.title)}>
                  {stripHtml(post.title)}
                </span>
              </nav>
              {/* Category tag */}
              <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-white">
                {category}
              </p>
              {/* Title */}
              <h1
                className="mb-2 text-2xl font-bold uppercase leading-tight text-white drop-shadow-sm sm:text-3xl md:text-4xl [&_a]:text-white [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />
              {/* Metadata: by Admin • Date • comments */}
              <p className="text-sm text-white/90">
                <span>by Admin</span>
                {publishedDate && (
                  <>
                    <span className="mx-1.5">•</span>
                    <span className="rounded bg-[var(--footer-accent)]/90 px-1.5 py-0.5 text-white">
                      {publishedDate}
                    </span>
                  </>
                )}
                <span className="mx-1.5">•</span>
                <span>0 comment</span>
              </p>
            </div>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="prose prose-zinc mt-0 max-w-none">
            <div className="blog-content text-lg text-zinc-600" dangerouslySetInnerHTML={{ __html: post.excerpt }} />
            {post.content ? (
              <div
                className="blog-content mt-4 text-zinc-700 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_img]:rounded-lg [&_img]:my-4 [&_img]:w-full [&_img]:h-auto"
                dangerouslySetInnerHTML={{ __html: safeContent }}
              />
            ) : (
              <p className="mt-4 text-zinc-700">
                Full article content – edit this post in Admin → Blog.
              </p>
            )}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}

export async function generateStaticParams() {
  const posts = await readBlogPosts();
  return posts.map((p) => ({ slug: p.slug }));
}
