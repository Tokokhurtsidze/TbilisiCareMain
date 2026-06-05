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
    <div
      suppressHydrationWarning
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <img
        src={TBILISI_LOGO_URL}
        width={size * 1.6}
        height={size * 1.6}
        alt="Tbilisi City Hall"
        onError={() => setFailed(true)}
        style={{ objectFit: "contain", transform: "scale(1.65)", transformOrigin: "center" }}
      />
    </div>
  );
}
