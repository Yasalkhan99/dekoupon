import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { canonicalUrl } from "@/lib/site";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | SavingsHub4u",
  description: "Get in touch with SavingsHub4u. Send us your questions, feedback, or partnership inquiries.",
  alternates: { canonical: canonicalUrl("/contact") },
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14 sm:px-6 lg:px-8 xl:max-w-6xl">
        {/* Hero */}
        <div className="mb-12 rounded-2xl border border-emerald-900/10 bg-[var(--card-bg)] px-6 py-10 text-center shadow-sm sm:px-10">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Contact Us
          </h1>
          <p className="mt-3 text-lg text-zinc-600">
            Have a question or want to work with us? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Form — wider column on large screens */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-md sm:p-8">
              <h2 className="mb-6 text-xl font-semibold text-zinc-900">Send a message</h2>
              <ContactForm />
            </div>
          </div>

          {/* Sidebar - contact info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-emerald-900/10 bg-white p-6 shadow-md">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Get in touch
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[var(--footer-accent)]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-medium text-zinc-900">Email</p>
                    <a href="mailto:hello@savingshub4u.com" className="text-sm text-zinc-600 hover:text-[var(--footer-accent)]">
                      info@savingshub4u.com
                    </a>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[var(--footer-accent)]">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                  <div>
                    <p className="font-medium text-zinc-900">Response time</p>
                    <p className="text-sm text-zinc-600">We usually reply within 24–48 hours.</p>
                  </div>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-emerald-50/50 to-[var(--card-bg)] p-6 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-600">
                Browse first
              </h3>
              <p className="mb-4 text-sm text-zinc-600">
                Check out our latest deals and coupons before you reach out.
              </p>
              <Link
                href="/promotions"
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--footer-accent)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[var(--footer-accent-hover)]"
              >
                View Promotions
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
