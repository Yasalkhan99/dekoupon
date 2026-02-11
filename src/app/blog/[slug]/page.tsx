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

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-red-600 hover:underline"
        >
          ← Back to Home
        </Link>
        <article>
          <span className="mb-2 inline-block text-xs font-semibold uppercase tracking-wide text-red-600">
            {post.category}
          </span>
          {post.publishedDate && (
            <span className="ml-2 text-xs text-zinc-500">{post.publishedDate}</span>
          )}
          <h1 className="mb-4 text-3xl font-bold leading-tight md:text-4xl [&_a]:text-red-600 [&_a]:underline" dangerouslySetInnerHTML={{ __html: post.title }} />
          <div className="relative aspect-video overflow-hidden rounded-lg">
            <Image
              src={post.image || "https://picsum.photos/id/1/1200/600"}
              alt={stripHtml(post.title)}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority
            />
          </div>
          <div className="prose prose-zinc mt-8 max-w-none">
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
