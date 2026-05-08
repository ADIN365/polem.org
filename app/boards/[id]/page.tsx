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
  const board = await prisma.board.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: board?.title ?? "게시판" };
}

export default async function BoardPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? null;
  const hasNickname = !!session?.user?.nickname;

  const board = await prisma.board.findUnique({
    where: { id: params.id },
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
  await prisma.board.update({
    where: { id: board.id },
    data: { viewCount: { increment: 1 } },
  });

  return (
    <div className="max-w-site mx-auto px-6 pt-8 pb-20">
      <nav className="flex items-center gap-2 mb-4 text-meta text-ink-3">
        <Link href="/" className="hover:text-ink transition-colors">
          의제 색인
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

      <p className="text-tiny text-ink-3 mt-4 text-center tracking-wide leading-relaxed">
        박제 본문 클릭 → 댓글 펼침 (깊이 무한) · 회색 띠는 인용 박제 · ⚠는 출처 도전 · 황토색 % = 진영 가린 답변 동의율
      </p>
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
  return (
    <div className="px-[22px] py-[14px] border-b-[0.5px] border-border-soft text-meta text-ink-2 leading-loose bg-soft">
      <span className="text-eyebrow-tight tracking-wider uppercase mr-[10px]">
        AI 50:50 요약 {at ? formatDate(at) : "(Phase 10 예정)"}
      </span>
      {pro && con ? (
        <>
          찬성: {pro} / 반대: {con}
        </>
      ) : (
        <span className="text-ink-3">
          박제가 일정 수 이상 모이면, 매일 1~2회 양측을 50:50 비율로 요약해서 여기에 표시합니다.
        </span>
      )}
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
      author: { select: { nickname: true, name: true } },
      quotedPin: {
        select: {
          body: true,
          author: { select: { nickname: true, name: true } },
        },
      },
      _count: {
        select: { endorsements: true, comments: true, challenges: true },
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
      commentCount: r._count.comments,
      challengeCount: r._count.challenges,
      blindAgreeRatio:
        blindTotal >= 5
          ? Math.round((r.blindAgreeCount / blindTotal) * 100)
          : null,
      quoted: r.quotedPin
        ? {
            body: r.quotedPin.body,
            authorNickname:
              r.quotedPin.author.nickname ?? r.quotedPin.author.name,
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
