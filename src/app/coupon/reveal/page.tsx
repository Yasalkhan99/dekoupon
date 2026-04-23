import type { Metadata } from "next";
import { Suspense } from "react";
import { canonicalUrl } from "@/lib/site";
import CouponRevealClient from "./CouponRevealClient";

export const metadata: Metadata = {
  title: "Reveal coupon | SavingsHub4U",
  description: "View your coupon code and continue to the store.",
  alternates: { canonical: canonicalUrl("/coupon/reveal") },
  robots: { index: false, follow: true },
};

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function CouponRevealPage({ searchParams }: Props) {
  const params = await searchParams;
  const code = params.code ?? "";
  const title = params.title ?? "Coupon";
  const storeName = params.storeName ?? "Store";
  const storeLogo = params.storeLogo ?? "";
  const redirect = params.redirect ?? "";
  const storeId = params.storeId ?? "";
  const expiry = params.expiry ?? "";
  const isCode = params.isCode === "1" || params.isCode === "true";
  const trending = params.trending === "1" || params.trending === "true";
  const returnUrl = params.returnUrl ?? "";

  return (
    <Suspense
        fallback={
          <div className="flex flex-1 items-center justify-center py-24">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--footer-accent)] border-t-transparent" />
          </div>
        }
      >
        <CouponRevealClient
          code={code}
          title={title}
          storeName={storeName}
          storeLogo={storeLogo || undefined}
          redirect={redirect || undefined}
          storeId={storeId || undefined}
          expiry={expiry || undefined}
          isCode={isCode}
          trending={trending}
          returnUrl={returnUrl || undefined}
        />
      </Suspense>
  );
}
