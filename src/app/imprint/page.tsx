import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { canonicalUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: "Imprint",
  description: "Legal imprint and company information for SavingsHub4u.",
  alternates: { canonical: canonicalUrl("/imprint") },
};

const ROWS: { label: string; value: string }[] = [
  { label: "Company Name", value: "DSurf Corp" },
  { label: "Employer ID Number", value: "84-4981647" },
  { label: "Address", value: "811 Wilshire Blvd, Suite 1753" },
  { label: "City", value: "Los Angeles" },
  { label: "Postal Code", value: "90017" },
  { label: "Country", value: "United States" },
  { label: "Email", value: "contacts@savingshub4u.com" },
  { label: "Director Of Company", value: "Masood R Khan" },
  { label: "Director Email", value: "masood.r.khan@savingshub4u.com" },
  { label: "Website", value: "savingshub4u.com" },
];

export default function ImprintPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
            Imprint
          </h1>
          <p className="mt-2 text-zinc-600">
            Legal information and company details.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border-2 border-zinc-300 bg-white shadow-sm">
          <table className="w-full min-w-0 table-fixed border-collapse sm:table-auto">
            <tbody className="divide-y-2 divide-zinc-300">
              {ROWS.map(({ label, value }) => (
                <tr key={label} className="group">
                  <td className="border-r-2 border-zinc-300 py-4 pl-5 pr-4 text-sm font-semibold text-zinc-700 sm:w-48 sm:shrink-0 sm:py-5">
                    {label}:
                  </td>
                  <td className="py-4 pl-4 pr-5 text-sm text-zinc-900 sm:py-5">
                    {label === "Email" || label === "Director Email" ? (
                      <a
                        href={`mailto:${value}`}
                        className="text-[var(--footer-accent)] hover:underline"
                      >
                        {value}
                      </a>
                    ) : label === "Website" ? (
                      <a
                        href={`https://${value}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[var(--footer-accent)] hover:underline"
                      >
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}
