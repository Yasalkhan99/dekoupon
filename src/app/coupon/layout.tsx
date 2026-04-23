/** Coupon reveal flow */
export default function CouponLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--page-bg)] antialiased">
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
