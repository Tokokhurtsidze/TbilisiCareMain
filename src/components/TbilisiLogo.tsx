"use client";

import { useState } from "react";
import { Building2 } from "lucide-react";

// Official Tbilisi City Hall logo (logo.2you.ge). Falls back to a Building2
// icon if the asset fails to load (network / blocked / 404).
export const TBILISI_LOGO_URL =
  "https://logo.2you.ge/logo/images/LOGOS/State%20Organization/Municipalities/Tbilisi_City_Hall.png";

export function TbilisiLogo({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <Building2
        size={size}
        strokeWidth={1.5}
        className={className}
        aria-label="Tbilisi City Hall"
      />
    );
  }
  return (
    <img
      src={TBILISI_LOGO_URL}
      width={size}
      height={size}
      alt="Tbilisi City Hall"
      className={className}
      onError={() => setFailed(true)}
      style={{ objectFit: "contain" }}
    />
  );
}
