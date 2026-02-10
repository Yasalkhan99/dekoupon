import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/data/blog";
import { stripHtml } from "@/lib/slugify";

type ArticleCardProps = {
  post: BlogPost;
};

export default function ArticleCard({ post }: ArticleCardProps) {
  const date = (post as { publishedDate?: string; date?: string }).publishedDate ?? (post as { date?: string }).date ?? "";

  return (
    <article className="post clearfix mb-5 rounded-lg border border-gray-200 p-4 shadow-sm" style={{ backgroundColor: "#f2ebe2" }}>
      <div className="article-outer-sidebar-cc2">
        <div className="article-inner">
          <div className="article-container clearfix">
            <div className="fea-img-container mb-0">
              <Link href={`/blog/${post.slug}`} className="block overflow-hidden">
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--hunted-gray)]">
                  <Image
                    src={post.image}
                    alt={stripHtml(post.title)}
                    fill
                    quality={90}
                    className="object-cover transition hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 480px"
                  />
                </div>
              </Link>
            </div>
            <div className="home-excerpt-outer pt-4">
              {date && (
                <div className="listing-date mb-1 text-xs font-bold uppercase tracking-wide text-[var(--hunted-text-gray)]">
                  <Link href={`/blog/${post.slug}`} className="text-[var(--hunted-text-gray)] hover:text-[var(--footer-accent)]">
                    {date}
                  </Link>
                </div>
              )}
              <div className="listing-title mb-2 font-bold">
                <h1 className="home-listing-title-inner text-[25px] leading-[1.1em] text-[var(--hunted-navy)]">
                  <Link href={`/blog/${post.slug}`} className="text-[var(--hunted-navy)] hover:text-[var(--footer-accent)] hover:underline [&_a]:text-inherit [&_a]:hover:text-[var(--footer-accent)]">
                    <span dangerouslySetInnerHTML={{ __html: post.title }} />
                  </Link>
                </h1>
              </div>
              <div
                className="home-excerpt mb-3 line-clamp-2 text-sm leading-relaxed text-[var(--hunted-text-gray)]"
                dangerouslySetInnerHTML={{ __html: post.excerpt }}
              />
              <Link
                href={`/blog/${post.slug}`}
                className="btnReadMore inline-block text-sm font-bold text-[var(--footer-accent)] hover:underline"
              >
                READ MORE
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
