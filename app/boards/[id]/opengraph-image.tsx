import { ImageResponse } from "next/og";

import { CATEGORY_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const alt = "끝장토론 의제";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FONT_URL =
  "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/public/static/Pretendard-SemiBold.otf";

export default async function BoardOG({ params }: { params: { id: string } }) {
  const id = decodeURIComponent(params.id);
  const [board, fontData] = await Promise.all([
    prisma.board.findUnique({
      where: { id },
      select: {
        title: true,
        category: true,
        proCount: true,
        conCount: true,
        participantCount: true,
      },
    }),
    fetch(FONT_URL)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .catch(() => null),
  ]);

  const title = board?.title ?? "끝장토론 의제";
  const category = board?.category ? (CATEGORY_LABEL[board.category] ?? board.category) : "";
  const pro = board?.proCount ?? 0;
  const con = board?.conCount ?? 0;
  const total = pro + con;
  const proPct = total === 0 ? 50 : Math.round((pro / total) * 100);
  const conPct = total === 0 ? 50 : 100 - proPct;
  const participants = board?.participantCount ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          background: "#F5F5F4",
          padding: "72px 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "Pretendard",
        }}
      >
        {/* 상단 — 카테고리 + 브랜드 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 26,
            color: "#6F665C",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          <span>{category || "의제"}</span>
          <span>끝장토론 · polem.org</span>
        </div>

        {/* 가운데 — 의제 제목 */}
        <div
          style={{
            fontSize: title.length > 30 ? 64 : 84,
            color: "#2B2620",
            lineHeight: 1.25,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {title}
        </div>

        {/* 하단 — 비율 막대 + 카운트 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              display: "flex",
              height: 14,
              border: "1px solid #2B2620",
              background: "#fff",
              overflow: "hidden",
            }}
          >
            <div style={{ width: `${proPct}%`, background: "#fff", borderRight: "1px solid #2B2620" }} />
            <div style={{ width: `${conPct}%`, background: "#2B2620" }} />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 28,
              color: "#4A4239",
            }}
          >
            <span>찬성 {pro.toLocaleString()} ({proPct}%)</span>
            <span style={{ color: "#6F665C" }}>참여 {participants.toLocaleString()}</span>
            <span>반대 {con.toLocaleString()} ({conPct}%)</span>
          </div>
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
