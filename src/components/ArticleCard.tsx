import Image from "next/image";
import Link from "next/link";
import type { BlogPost } from "@/data/blog";
import { getBlogImageAspectClass } from "@/data/blog";
import { stripHtml } from "@/lib/slugify";
import ResilientPostImage from "@/components/ResilientPostImage";

type ArticleCardProps = {
  post: BlogPost;
  /** Use `h3` when the card sits under a section `h2` (e.g. homepage). Default `h2` for category listings under an `h1`. */
  titleHeading?: "h2" | "h3";
  /** Homepage feed: editorial split card + resilient images. Category pages: classic grid tile. */
  skin?: "default" | "desk";
};

export default function ArticleCard({ post, titleHeading = "h2", skin = "default" }: ArticleCardProps) {
  const date =
    (post as { publishedDate?: string; date?: string }).publishedDate ??
    (post as { date?: string }).date ??
    "";

  const TitleTag = titleHeading;

  if (skin === "desk") {
    return (
      <article className="news-wire-room overflow-hidden rounded-xl border border-stone-800/12 bg-[var(--card-bg)] shadow-sm transition hover:border-[var(--footer-accent)]/30 hover:shadow-md">
        <Link
          href={`/blog/${post.slug}`}
          className="group flex min-w-0 flex-col md:flex-row md:items-stretch"
        >
          <div className="relative w-full shrink-0 border-b border-stone-200/90 md:w-[min(38%,300px)] md:border-b-0 md:border-r md:border-stone-200/90">
            <ResilientPostImage
              post={post}
              fallbackKey="feed"
              wrapperClassName="relative aspect-[16/10] w-full overflow-hidden bg-stone-200 md:aspect-auto md:min-h-[200px] md:max-h-[280px]"
              imgClassName="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-center p-4 sm:p-5 md:px-6 md:py-5">
            {post.category ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500">{post.category}</p>
            ) : null}
            {date ? (
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">{date}</p>
            ) : null}
            <TitleTag
              className="category-desk-headline mt-2 text-pretty text-lg font-bold leading-snug text-stone-900 sm:text-xl"
              dangerouslySetInnerHTML={{ __html: post.title }}
            />
            <div
              className="mt-3 line-clamp-3 border-l-2 border-[var(--footer-accent)]/60 pl-3 text-sm leading-relaxed text-stone-600"
              dangerouslySetInnerHTML={{ __html: post.excerpt }}
            />
            <p className="mt-4 text-xs font-bold uppercase tracking-widest text-[var(--footer-accent)]">
              Read story <span aria-hidden>→</span>
            </p>
          </div>
        </Link>
      </article>
    );
  }

  return (
    <article className="post clearfix mb-5 rounded-lg border-0 border-gray-200 p-4 shadow-sm md:border" style={{ backgroundColor: "#f2ebe2" }}>
      <div className="article-outer-sidebar-cc2">
        <div className="article-inner">
          <div className="article-container clearfix">
            <div className="fea-img-container mb-0">
              <Link href={`/blog/${post.slug}`} className="block overflow-hidden">
                <div className={`relative w-full overflow-hidden bg-[var(--hunted-gray)] ${getBlogImageAspectClass(post.imageAspectRatio)}`}>
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
                <TitleTag className="home-listing-title-inner text-[25px] leading-[1.1em] text-[var(--hunted-navy)]">
                  <Link href={`/blog/${post.slug}`} className="text-[var(--hunted-navy)] hover:text-[var(--footer-accent)] hover:underline [&_a]:text-inherit [&_a]:hover:text-[var(--footer-accent)]">
                    <span dangerouslySetInnerHTML={{ __html: post.title }} />
                  </Link>
                </TitleTag>
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
