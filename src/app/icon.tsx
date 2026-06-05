import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0052cc",
          borderRadius: "16px",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: "36px",
            fontWeight: 800,
            fontFamily: "serif",
            lineHeight: 1,
          }}
        >
          ც
        </span>
      </div>
    ),
    size,
  );
}
