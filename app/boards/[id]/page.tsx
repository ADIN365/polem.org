import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import BoardClient from "./BoardClient";
import SummaryCards from "@/components/board/SummaryCards";
import WriteButtons from "@/components/board/WriteButtons";
import { BoardBigGauge } from "@/components/ui/Gauge";
import { fetchActiveSummaryRequest, fetchSummaryCitations } from "@/lib/ai-summary";
import { authOptions } from "@/lib/auth";
import { CATEGORY_LABEL } from "@/lib/constants";
import { formatCount } from "@/lib/format";
import { ROOT_PAGE_SIZE, fetchRootPins } from "@/lib/pins";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
  searchParams: { proPage?: string; conPage?: string };
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

function parsePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export default async function BoardPage({ params, searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? null;
  const hasNickname = !!session?.user?.nickname;

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

  const proPage = parsePage(searchParams.proPage);
  const conPage = parsePage(searchParams.conPage);
  const isAdmin = session?.user?.role === "ADMIN";
  const [pro, con, citations, activeRequest] = await Promise.all([
    fetchRootPins({ boardId: board.id, side: "PRO", page: proPage, currentUserId }),
    fetchRootPins({ boardId: board.id, side: "CON", page: conPage, currentUserId }),
    fetchSummaryCitations(board.id),
    fetchActiveSummaryRequest(board.id),
  ]);

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

        <WriteButtons
          boardId={board.id}
          currentUserId={currentUserId}
          hasNickname={hasNickname}
        />

        <SummaryCards
          boardId={board.id}
          pro={board.aiSummaryPro}
          con={board.aiSummaryCon}
          at={board.aiSummaryAt}
          citationsPro={citations.pro}
          citationsCon={citations.con}
          isAdmin={isAdmin}
          hasActiveRequest={!!activeRequest}
        />

        <BoardClient
          boardId={board.id}
          proPins={pro.pins}
          conPins={con.pins}
          proPage={pro.page}
          conPage={con.page}
          proTotal={pro.total}
          conTotal={con.total}
          pageSize={ROOT_PAGE_SIZE}
          currentUserId={currentUserId}
          hasNickname={hasNickname}
        />
      </article>
    </div>
  );
}

