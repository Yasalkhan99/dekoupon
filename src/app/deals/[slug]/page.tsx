import { notFound } from "next/navigation";
import Link from "next/link";
import PromotionsFooter from "@/components/PromotionsFooter";
import PromotionsHeader from "@/components/PromotionsHeader";
import NewsletterSubscribe from "@/components/NewsletterSubscribe";
import { getClickCounts } from "@/lib/clicks";
import { getCoupons } from "@/lib/stores";
import { getEventBySlug } from "@/data/events";
import EventDealsClient from "@/components/EventDealsClient";

type Props = { params: Promise<{ slug: string }> };

export default async function EventDealsPage({ params }: Props) {
  const { slug } = await params;
  const event = getEventBySlug(slug);
  if (!event) notFound();

  const [allCoupons, clickCounts] = await Promise.all([getCoupons(), getClickCounts()]);
  const eventCoupons = allCoupons.filter(
    (c) => c.status !== "disable" && Array.isArray(c.events) && c.events.includes(slug.toLowerCase())
  );

  const siteName = "SavingsHub4u";

  return (
    <div className="min-h-screen bg-white text-zinc-900" suppressHydrationWarning>
      <PromotionsHeader />
      <div className="border-b border-amber-200/60 bg-[#fff8f0]">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">{event.name}</h1>
          <nav className="mt-2 text-sm text-zinc-600" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center justify-center gap-1">
              <li>
                <Link href="/" className="hover:text-zinc-900">{siteName}</Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <Link href="/promotions" className="hover:text-zinc-900">Coupon</Link>
              </li>
              <li aria-hidden>›</li>
              <li>
                <span className="font-medium text-blue-600">{event.name}</span>
              </li>
            </ol>
          </nav>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <EventDealsClient
          eventName={event.name}
          eventDescription={event.description}
          coupons={eventCoupons}
          clickCounts={clickCounts}
        />
      </main>

      <section className="relative mx-[15%] overflow-hidden rounded-2xl bg-blue-600 py-10">
        <div className="pointer-events-none absolute inset-0 flex items-center justify-between px-12 opacity-30 sm:px-20">
          <img src="/Group%201171275124.svg" alt="" className="h-24 w-24 shrink-0 object-contain sm:h-32 sm:w-32" />
          <img src="/Group%201171275125.svg" alt="" className="h-24 w-24 shrink-0 object-contain sm:h-32 sm:w-32" />
        </div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-xl font-bold text-white sm:text-2xl">Join our newsletter for updates!</h2>
          <p className="mt-2 text-sm text-blue-100">Join our community with more than 300K active users</p>
          <NewsletterSubscribe
            placeholder="Email Address"
            buttonText="Subscribe"
            layout="row"
            className="mt-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-center"
            inputClassName="w-full max-w-xs rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-900 shadow-sm placeholder:text-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400 sm:max-w-sm"
            buttonClassName="flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-3 font-semibold text-white transition hover:bg-amber-600"
          />
        </div>
      </section>

      <PromotionsFooter className="-mt-4 !mt-0 border-t-0" />
    </div>
  );
}
