import { Suspense } from "react";
import CouponRevealClient from "./CouponRevealClient";

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
    <div className="min-h-screen bg-zinc-100">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-zinc-100">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
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
    </div>
  );
}
