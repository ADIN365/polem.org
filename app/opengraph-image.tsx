import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "끝장토론 · polem.org";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/public/static/Pretendard-SemiBold.otf";

export default async function OG() {
  let fontData: ArrayBuffer | null = null;
  try {
    const res = await fetch(FONT_URL);
    if (res.ok) fontData = await res.arrayBuffer();
  } catch {
    // 폰트 로드 실패 시 system fallback (한글 깨질 수 있지만 빌드는 성공)
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "#F5F5F4",
          padding: "80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Pretendard",
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: "#6F665C",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          끝장토론 · polem.org
        </div>

        <div
          style={{
            fontSize: 88,
            color: "#2B2620",
            lineHeight: 1.25,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>토론은 사회를</span>
          <span>건강하게 만드는 자양분입니다.</span>
        </div>

        <div
          style={{
            fontSize: 28,
            color: "#4A4239",
            lineHeight: 1.5,
          }}
        >
          한국어 정치·사회 토론 주제 · 좌·우 영구 보관 토론
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [{ name: "Pretendard", data: fontData, style: "normal", weight: 600 }]
        : undefined,
    },
  );
}
