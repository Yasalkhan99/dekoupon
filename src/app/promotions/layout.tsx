import PromotionsHeader from "@/components/PromotionsHeader";

/**
 * Shared shell for all /promotions/* routes — header stays mounted during navigations
 * so nav clicks feel responsive while route `loading.tsx` shows below.
 */
export default function PromotionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--page-bg)] text-zinc-900 antialiased">
      <PromotionsHeader />
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
