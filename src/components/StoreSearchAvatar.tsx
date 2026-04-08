"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  name: string;
  logoUrl?: string;
  logoAltText?: string;
  /** Classes for the initials fallback circle */
  initialsClassName: string;
};

export default function StoreSearchAvatar({ name, logoUrl, logoAltText, initialsClassName }: Props) {
  const [hideLogo, setHideLogo] = useState(false);
  if (!logoUrl?.trim() || hideLogo) {
    return (
      <span className={initialsClassName}>
        {name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-white">
      <Image
        src={logoUrl}
        alt={logoAltText || name}
        fill
        className="object-contain p-0.5"
        sizes="36px"
        unoptimized
        onError={() => setHideLogo(true)}
      />
    </span>
  );
}
