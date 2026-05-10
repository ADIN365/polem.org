import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import BoardClient from "./BoardClient";
import type { PinData } from "@/components/board/Pin";
import { BoardBigGauge } from "@/components/ui/Gauge";
import { authOptions } from "@/lib/auth";
import { CATEGORY_LABEL } from "@/lib/constants";
import { formatCount } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  const id = decodeURIComponent(params.id);
  const board = await prisma.board.findUnique({
    where: { id },
    select: { title: true, body: true, aiSummaryPro: true, aiSummaryCon: true },
  });
  if (!board) return { title: "게시판" };
  const description =
    board.aiSummaryPro && board.aiSummaryCon
      ? `찬: ${board.aiSummaryPro} / 반: ${board.aiSummaryCon}`
      : board.body ?? "찬·반 영구 보관 토론 주제";
  return {
    title: board.title,
    description,
    openGraph: {
      title: board.title,
      description,
      type: "article",
    },
  };
}

export default async function BoardPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? null;
  const hasNickname = !!session?.user?.nickname;

  // Next.js 14.2 가 한글 dynamic param 을 자동 decode 안 해서 명시적 처리.
  const id = decodeURIComponent(params.id);
  const board = await prisma.board.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      body: true,
      category: true,
      proCount: true,
      conCount: true,
      participantCount: true,
      viewCount: true,
      status: true,
      aiSummaryPro: true,
      aiSummaryCon: true,
      aiSummaryAt: true,
    },
  });
  if (!board || board.status === "HIDDEN") notFound();

  const [proPins, conPins] = await Promise.all([
    fetchPins(board.id, "PRO", currentUserId),
    fetchPins(board.id, "CON", currentUserId),
  ]);

  // 조회수 +1 — 단순. Phase 13 에서 봇·자기조회 필터링.
  prisma.board
    .update({ where: { id: board.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  return (
    <div className="max-w-site mx-auto px-6 pt-8 pb-20">
      <nav className="flex items-center gap-2 mb-4 text-meta text-ink-3">
        <Link href="/" className="hover:text-ink transition-colors">
          토론 주제
        </Link>
        <span>/</span>
        <span className="text-ink">
          {CATEGORY_LABEL[board.category] ?? board.category} ·{" "}
          {board.title.slice(0, 20)}
          {board.title.length > 20 ? "…" : ""}
        </span>
      </nav>

      <article className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden">
        <div className="px-[18px] py-[14px] border-b border-border flex justify-between items-center">
          <span className="text-eyebrow tracking-widest text-ink-3 uppercase">
            {CATEGORY_LABEL[board.category] ?? board.category}
          </span>
          <span className="text-tiny text-ink-3">
            참여 {formatCount(board.participantCount)} · 관람{" "}
            {formatCount(board.viewCount)}
          </span>
        </div>

        <header className="px-[26px] pt-6 pb-5 border-b border-border">
          <h1
            className="font-serif font-semibold tracking-tight text-ink m-0 mb-[14px]"
            style={{ fontSize: "var(--fs-title-h2)" }}
          >
            {board.title}
          </h1>
          <BoardBigGauge proCount={board.proCount} conCount={board.conCount} />
        </header>

        <BoardSummary
          pro={board.aiSummaryPro}
          con={board.aiSummaryCon}
          at={board.aiSummaryAt}
        />

        <BoardClient
          boardId={board.id}
          proPins={proPins}
          conPins={conPins}
          currentUserId={currentUserId}
          hasNickname={hasNickname}
        />
      </article>

    </div>
  );
}

function BoardSummary({
  pro,
  con,
  at,
}: {
  pro: string | null;
  con: string | null;
  at: Date | null;
}) {
  if (!pro || !con) return null;
  return (
    <div className="px-[22px] py-[14px] border-b-[0.5px] border-border-soft text-meta text-ink-2 leading-loose bg-soft">
      {at ? (
        <span className="text-eyebrow-tight tracking-wider uppercase mr-[10px] text-ink-3">
          요약 {formatDate(at)}
        </span>
      ) : null}
      찬성: {pro} / 반대: {con}
    </div>
  );
}

async function fetchPins(
  boardId: string,
  side: "PRO" | "CON",
  currentUserId: string | null,
): Promise<PinData[]> {
  const rows = await prisma.pin.findMany({
    where: { boardId, side, hidden: false, deleted: false },
    orderBy: [{ createdAt: "desc" }],
    take: 30,
    select: {
      id: true,
      side: true,
      body: true,
      createdAt: true,
      authorId: true,
      blindAgreeCount: true,
      blindDisagreeCount: true,
      quoteAgreeCount: true,
      quoteRebutCount: true,
      quotedRelation: true,
      author: { select: { nickname: true, name: true } },
      quotedPin: {
        select: {
          body: true,
          author: { select: { nickname: true, name: true } },
        },
      },
      _count: {
        select: { endorsements: true },
      },
      endorsements: currentUserId
        ? { where: { userId: currentUserId }, select: { id: true } }
        : false,
    },
  });
  return rows.map((r) => {
    const blindTotal = r.blindAgreeCount + r.blindDisagreeCount;
    return {
      id: r.id,
      side: r.side,
      body: r.body,
      createdAt: r.createdAt,
      authorId: r.authorId,
      authorNickname: r.author.nickname ?? r.author.name,
      endorseCount: r._count.endorsements,
      quoteAgreeCount: r.quoteAgreeCount,
      quoteRebutCount: r.quoteRebutCount,
      blindAgreeRatio:
        blindTotal >= 5
          ? Math.round((r.blindAgreeCount / blindTotal) * 100)
          : null,
      quoted: r.quotedPin && r.quotedRelation
        ? {
            body: r.quotedPin.body,
            authorNickname:
              r.quotedPin.author.nickname ?? r.quotedPin.author.name,
            relation: r.quotedRelation,
          }
        : null,
      isEndorsedByMe:
        Array.isArray((r as { endorsements?: unknown }).endorsements) &&
        (r as { endorsements: unknown[] }).endorsements.length > 0,
    };
  });
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ko", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
