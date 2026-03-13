"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";

type Props = {
  code?: string;
  title?: string;
  storeName?: string;
  storeLogo?: string;
  redirect?: string;
  storeId?: string;
  onClose?: () => void;
  /** When true, use blurred backdrop so the page behind (e.g. store page) shows blurred */
  blurBackdrop?: boolean;
  /** Optional: formatted expiry e.g. "20 Nov, 2025" */
  expiry?: string;
  /** True if coupon code type (show GET CODE), false for deal (show Get Deal) */
  isCode?: boolean;
  /** Show Exclusive badge */
  trending?: boolean;
  /** When set (e.g. on /coupon/reveal page), Close & Continue to Store redirect to this URL (coupons page) */
  returnUrl?: string;
};

export default function CouponRevealModal({
  code = "",
  title = "Coupon",
  storeName = "Store",
  storeLogo,
  redirect,
  storeId,
  onClose,
  blurBackdrop = false,
  expiry,
  isCode = false,
  trending = false,
  returnUrl,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => setMounted(true), []);

  const trackingUrl =
    storeId && redirect
      ? `/api/click?storeId=${encodeURIComponent(storeId)}&redirect=${encodeURIComponent(redirect)}`
      : redirect || "#";

  const safeTitle = (() => {
    try {
      return decodeURIComponent(title);
    } catch {
      return title;
    }
  })();

  const handleCopyCode = useCallback(() => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  const handleClose = useCallback(() => {
    if (returnUrl) {
      window.location.href = returnUrl;
      return;
    }
    if (onClose) onClose();
    else window.close();
  }, [onClose, returnUrl]);

  /** Open tracking link in new tab; then redirect this tab to returnUrl (coupons page) or close. */
  const handleContinueToStore = useCallback(() => {
    window.open(trackingUrl, "_blank", "noopener,noreferrer");
    if (returnUrl) {
      window.location.href = returnUrl;
      return;
    }
    if (onClose) onClose();
    else window.close();
  }, [trackingUrl, onClose, returnUrl]);

  // Avoid hydration mismatch: render same placeholder on server and initial client, then full modal after mount
  if (!mounted) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          blurBackdrop ? "bg-black/20 backdrop-blur-md" : "bg-black/60 backdrop-blur-sm"
        }`}
        suppressHydrationWarning
      >
        <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden h-80" />
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        blurBackdrop ? "bg-black/20 backdrop-blur-md" : "bg-black/60 backdrop-blur-sm"
      }`}
    >
      {/* Couponly-style: white card, clean layout like coupon-01 */}
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
        {/* Close X - top right */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 transition hover:bg-zinc-200 hover:text-zinc-900"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-5">
          {/* Exclusive badge + Date - like Coupon 01 */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {trending && (
              <span className="inline-block rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                Exclusive
              </span>
            )}
            {expiry && (
              <span className="text-xs text-zinc-500">{expiry}</span>
            )}
          </div>

          {/* Title */}
          <h2 className="mb-4 pr-10 text-lg font-bold leading-snug text-zinc-900 sm:text-xl">
            {safeTitle}
          </h2>

          {/* Store logo + name */}
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/80 p-4">
            {storeLogo ? (
              <div className="relative h-12 w-24 shrink-0">
                <Image
                  src={storeLogo}
                  alt={storeName}
                  fill
                  className="object-contain object-left"
                  sizes="96px"
                  unoptimized
                />
              </div>
            ) : null}
            <p className="font-medium text-zinc-700">{storeName}</p>
          </div>

          {/* Code block - only shown for coupon codes */}
          {isCode && code && (
            <div className="mb-4 rounded-xl border-2 border-dashed border-amber-200 bg-amber-50/50 px-4 py-4">
              <p
                role="button"
                tabIndex={0}
                onClick={handleCopyCode}
                onKeyDown={(e) => e.key === "Enter" && handleCopyCode()}
                className="cursor-pointer select-all text-center text-xl font-bold tracking-wider text-zinc-900 sm:text-2xl"
              >
                {code}
              </p>
              <p className="mt-1 text-center text-xs text-zinc-500">
                {copied ? "✓ Copied!" : "Click to copy"}
              </p>
            </div>
          )}

          {/* Continue to Store (opens in new tab, user stays here) + Close */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleContinueToStore}
              className="w-full rounded-xl bg-amber-500 py-3.5 text-center font-semibold text-zinc-900 transition hover:bg-amber-400"
            >
              Continue to Store
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-xl border border-zinc-300 bg-white py-3 text-center font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
