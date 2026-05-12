import { prisma } from "./prisma";

export interface CitationView {
  pinId: string;
  authorId: string;
  authorNickname: string | null;
  side: "PRO" | "CON";
  order: number;
}

/**
 * 게시판의 현재 AI 요약 인용 목록. side(PRO/CON) + order 정렬.
 */
export async function fetchSummaryCitations(boardId: string): Promise<{
  pro: CitationView[];
  con: CitationView[];
}> {
  const rows = await prisma.aISummaryCitation.findMany({
    where: { boardId },
    orderBy: [{ side: "asc" }, { order: "asc" }],
    select: {
      side: true,
      pinId: true,
      order: true,
      pin: {
        select: {
          authorId: true,
          author: { select: { nickname: true, name: true } },
        },
      },
    },
  });
  const map = (r: (typeof rows)[number]): CitationView => ({
    pinId: r.pinId,
    authorId: r.pin.authorId,
    authorNickname: r.pin.author.nickname ?? r.pin.author.name,
    side: r.side,
    order: r.order,
  });
  return {
    pro: rows.filter((r) => r.side === "PRO").map(map),
    con: rows.filter((r) => r.side === "CON").map(map),
  };
}

/**
 * 게시판 보드에 현재 활성 갱신 요청(PENDING 또는 PROCESSING)이 있는지.
 */
export async function fetchActiveSummaryRequest(boardId: string) {
  return prisma.aISummaryRequest.findFirst({
    where: {
      boardId,
      status: { in: ["PENDING", "PROCESSING"] },
    },
    select: { id: true, status: true, createdAt: true },
  });
}
