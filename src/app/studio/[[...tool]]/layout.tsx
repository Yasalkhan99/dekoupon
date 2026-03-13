export const metadata = {
  title: "SavingsHub4U – Sanity Studio",
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div style={{ height: "100vh" }} suppressHydrationWarning>{children}</div>;
}
