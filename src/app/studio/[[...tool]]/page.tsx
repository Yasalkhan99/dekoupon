"use client";

import { useEffect, useState } from "react";
import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

export const dynamic = "force-dynamic";

export default function StudioPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#101112" }}>
        <p style={{ color: "#9ea1a6", fontFamily: "system-ui" }}>Loading Studio…</p>
      </div>
    );
  }

  return <NextStudio config={config} />;
}
