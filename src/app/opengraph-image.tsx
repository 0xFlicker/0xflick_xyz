import { ImageResponse } from "next/og";

import { professionalTitle, siteName, siteTitle } from "@/lib/site";

export const alt = `${siteTitle} turning emerging platforms into production systems`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#09090b",
          color: "#fafafa",
          display: "flex",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px 82px",
          width: "100%",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 870 }}>
          <div
            style={{
              color: "#c9a865",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            {`${siteName} · ${professionalTitle}`}
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 700,
              letterSpacing: -3,
              lineHeight: 1.06,
              marginTop: 34,
            }}
          >
            Turning emerging platforms into production systems.
          </div>
          <div
            style={{ color: "#a1a1aa", fontSize: 25, marginTop: 36 }}
          >
            Production AI · Platforms · Distributed systems · Monetization
          </div>
        </div>
        <div
          style={{
            alignItems: "center",
            border: "2px solid #c9a865",
            borderRadius: 999,
            color: "#c9a865",
            display: "flex",
            fontSize: 80,
            fontWeight: 700,
            height: 150,
            justifyContent: "center",
            width: 150,
          }}
        >
          F
        </div>
      </div>
    ),
    size
  );
}
