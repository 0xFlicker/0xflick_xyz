import { ImageResponse } from "next/og";

import { assistantShareTitle } from "@/features/assistant/metadata";

export const alt =
  "Local AI Assistant — private, on-device help for writing, explanation, and problem-solving.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function AssistantOpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(135deg, #09090b 0%, #071317 68%, #06202a 100%)",
          color: "#fafafa",
          display: "flex",
          height: "100%",
          overflow: "hidden",
          padding: "70px 78px",
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            border: "1px solid rgba(34, 211, 238, 0.18)",
            borderRadius: 999,
            display: "flex",
            height: 520,
            position: "absolute",
            right: -150,
            top: -210,
            width: 520,
          }}
        />
        <div
          style={{
            background: "rgba(34, 211, 238, 0.07)",
            borderRadius: 999,
            display: "flex",
            height: 350,
            position: "absolute",
            right: -40,
            top: -130,
            width: 350,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            position: "relative",
            width: "100%",
          }}
        >
          <div
            style={{
              color: "#67e8f9",
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 5,
            }}
          >
            PRIVATE · ON-DEVICE · NO ACCOUNT
          </div>

          <div
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                width: 790,
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 76,
                  fontWeight: 700,
                  letterSpacing: -4,
                  lineHeight: 1.03,
                }}
              >
                {assistantShareTitle}
              </div>
              <div
                style={{
                  color: "#a1a1aa",
                  display: "flex",
                  fontSize: 27,
                  lineHeight: 1.35,
                  marginTop: 30,
                }}
              >
                Private, on-device help for writing, explanation, and
                problem-solving.
              </div>
            </div>

            <div
              style={{
                alignItems: "center",
                border: "2px solid #22d3ee",
                borderRadius: 999,
                color: "#67e8f9",
                display: "flex",
                fontSize: 46,
                fontWeight: 700,
                height: 150,
                justifyContent: "center",
                letterSpacing: -2,
                width: 150,
              }}
            >
              AI
            </div>
          </div>

          <div
            style={{
              alignItems: "center",
              color: "#d4d4d8",
              display: "flex",
              fontSize: 24,
              gap: 20,
            }}
          >
            <div
              style={{
                background: "#22d3ee",
                borderRadius: 999,
                display: "flex",
                height: 8,
                width: 8,
              }}
            />
            Writing · Explanation · Problem-solving
          </div>
        </div>
      </div>
    ),
    size,
  );
}
