import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import PromotionsFooter from "@/components/PromotionsFooter";
import PromotionsHeader from "@/components/PromotionsHeader";
import { getStoresCached, getCouponsCached } from "@/lib/stores";
import { getCachedBlogData } from "@/lib/blog";
import { canonicalUrl } from "@/lib/site";

export const revalidate = 120;

export const metadata: Metadata = {
  title: { absolute: "About SavingsHub4U | Your Trusted Coupons & Deals Platform" },
  description:
    "Learn more about SavingsHub4U, your go-to destination for verified coupons, promo codes, and exclusive online deals. Discover our mission to help shoppers save more every day with trusted, updated discounts.",
  alternates: { canonical: canonicalUrl("/about") },
};

const VALUES = [
  {
    title: "Verified Deals",
    description:
      "We focus on quality over quantity. Deals and codes are checked so you can shop with confidence.",
  },
  {
    title: "Wide Range of Stores",
    description:
      "From fashion and electronics to travel and home, find discount codes and offers for your favourite brands in one place.",
  },
  {
    title: "Always Updated",
    description:
      "New offers and expiry dates are updated regularly so you get the latest savings when you need them.",
  },
];

export default async function AboutPage() {
  const [stores, coupons, { featuredPosts, latestPosts }] = await Promise.all([
    getStoresCached(),
    getCouponsCached(),
    getCachedBlogData(),
  ]);
  const totalStores = stores.length;
  const totalCoupons = coupons.length;
  const latestInsights = latestPosts.slice(0, 3);

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      <PromotionsHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="mb-6 text-sm text-zinc-500" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1">
            <li>
              <Link href="/" className="hover:text-zinc-700">
                SavingsHub4u
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li className="text-zinc-900 font-medium">About Us</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="mb-12 flex flex-col gap-8 rounded-3xl border border-zinc-200 bg-gradient-to-br from-rose-50 via-white to-blue-50/70 p-8 shadow-sm lg:flex-row lg:items-center">
          <div className="flex-1">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-teal-600">
              About SavingsHub4u
            </p>
            <h1 className="mb-4 text-3xl font-bold text-zinc-900 sm:text-4xl">
              Your place for discount codes and deals
            </h1>
            <p className="mb-6 text-base leading-relaxed text-zinc-600">
              SavingsHub4u helps you find the best deals, promo codes and coupons from top stores. Browse by category,
              discover seasonal offers and save on your purchases. We list verified offers so you can shop with confidence.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/promotions"
                className="rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
              >
                View All Deals
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400"
              >
                Contact Us
              </Link>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="relative h-64 w-full max-w-sm">
              <Image
                src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80"
                alt="Savings and shopping deals"
                fill
                className="rounded-3xl object-cover shadow-xl"
              />
            </div>
          </div>
        </section>

        {/* Metrics */}
        <section className="mb-12 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
          <article>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Stores</p>
            <p className="text-3xl font-bold text-zinc-900">{totalStores.toLocaleString()}</p>
            <p className="mt-1 text-sm text-zinc-500">Brands with deals and coupon codes</p>
          </article>
          <article>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Coupons & Deals</p>
            <p className="text-3xl font-bold text-zinc-900">{totalCoupons.toLocaleString()}</p>
            <p className="mt-1 text-sm text-zinc-500">Verified offers you can use</p>
          </article>
          <article>
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Blog</p>
            <p className="text-3xl font-bold text-zinc-900">{featuredPosts.length}</p>
            <p className="mt-1 text-sm text-zinc-500">Tips and savings articles</p>
          </article>
        </section>

        {/* Values */}
        <section className="mb-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-zinc-900">Why use SavingsHub4u</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((value) => (
              <article key={value.title} className="rounded-xl border border-zinc-100 bg-zinc-50/60 p-5">
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">{value.title}</h3>
                <p className="text-sm text-zinc-600">{value.description}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Latest insights */}
        <section className="mb-12 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-zinc-900">Latest from our blog</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {latestInsights.map((post) => (
              <article key={post.id} className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{post.category}</p>
                <h3
                  className="mt-2 line-clamp-2 text-sm font-bold text-zinc-900 [&_a]:text-zinc-900"
                  dangerouslySetInnerHTML={{ __html: post.title }}
                />
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-3 inline-flex items-center text-sm font-semibold text-teal-600 hover:text-teal-500"
                >
                  Read more →
                </Link>
              </article>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-3xl border border-zinc-900 bg-zinc-900 px-6 py-10 text-white">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-300">Get in touch</p>
              <h2 className="mt-3 text-2xl font-bold">Have a deal to share or a question?</h2>
              <p className="mt-2 max-w-xl text-sm text-zinc-300">
                Use the form to contact us or submit a coupon so we can help more people save.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100"
              >
                Contact Us
              </Link>
              <Link
                href="/promotions/share-a-coupon"
                className="rounded-full border border-white px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Share A Coupon
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PromotionsFooter />
    </div>
  );
}
