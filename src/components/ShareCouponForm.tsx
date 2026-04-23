"use client";

import { useState } from "react";

export default function ShareCouponForm() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    storeLabel: "",
    couponType: "",
    promoCode: "",
    couponDescription: "",
    couponExpiration: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "share-coupon", ...form }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to submit");
      setMessage({ type: "success", text: "Thank you! Your coupon has been submitted for review." });
      setForm({
        fullName: "",
        email: "",
        storeLabel: "",
        couponType: "",
        promoCode: "",
        couponDescription: "",
        couponExpiration: "",
      });
    } catch (e) {
      setMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Something went wrong. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-zinc-500">
        Your email address will not be published. Required fields are marked *
      </p>
      {message && (
        <div
          className={`rounded border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Full Name *</label>
        <input
          type="text"
          required
          value={form.fullName}
          onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
          placeholder="Your Full Name*"
          className="w-full rounded border border-zinc-300 px-3 py-2.5 text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Email Address *</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="Your Email Address*"
          className="w-full rounded border border-zinc-300 px-3 py-2.5 text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Store Label *</label>
        <input
          type="text"
          required
          value={form.storeLabel}
          onChange={(e) => setForm((f) => ({ ...f, storeLabel: e.target.value }))}
          placeholder="Store Label*"
          className="w-full rounded border border-zinc-300 px-3 py-2.5 text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Select Coupon Type</label>
        <select
          value={form.couponType}
          onChange={(e) => setForm((f) => ({ ...f, couponType: e.target.value }))}
          className="w-full rounded border border-zinc-300 px-3 py-2.5 text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        >
          <option value="">Select option</option>
          <option value="code">Promo Code</option>
          <option value="deal">Deal</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Promo Code</label>
        <input
          type="text"
          value={form.promoCode}
          onChange={(e) => setForm((f) => ({ ...f, promoCode: e.target.value }))}
          placeholder="Promo Code"
          className="w-full rounded border border-zinc-300 px-3 py-2.5 text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Coupon Description *</label>
        <textarea
          required
          value={form.couponDescription}
          onChange={(e) => setForm((f) => ({ ...f, couponDescription: e.target.value }))}
          placeholder="Coupon Description*"
          rows={4}
          className="w-full rounded border border-zinc-300 px-3 py-2.5 text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">Coupon Expiration</label>
        <div className="relative">
          <input
            type="text"
            value={form.couponExpiration}
            onChange={(e) => setForm((f) => ({ ...f, couponExpiration: e.target.value }))}
            placeholder="mm/dd/yyyy"
            className="w-full rounded border border-zinc-300 px-3 py-2.5 pr-10 text-zinc-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" aria-hidden>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
        </div>
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-[var(--footer-accent)] px-6 py-3 font-medium text-white transition hover:bg-[var(--footer-accent-hover)] disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
