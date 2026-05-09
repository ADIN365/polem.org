// 토론 주제별 자기 거울 집계.
// 의견 입장 (직접 PRO/CON 의견 표명) 과 블라인드 답변 (진영 가린 채 평가) 을 토론 주제 단위로 비교.
// 헌법 §2.3 — 본인에게만 노출. 다른 사용자의 자기 거울 엔 절대 접근 X.

import type { BlindAnswerValue, Category } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export type MirrorStatus = "match" | "warn" | "new" | "split";

export interface MirrorRow {
  boardId: string;
  boardTitle: string;
  category: Category;
  myPros: number;
  myCons: number;
  blindEffPro: number; // 사용자가 *PRO 입장* 으로 효과적으로 답한 횟수 (AGREE+PRO 또는 DISAGREE+CON)
  blindEffCon: number; // 사용자가 *CON 입장* 으로 효과적으로 답한 횟수
  blindUnsure: number;
  status: MirrorStatus;
}

const STANCE_THRESHOLD = 0.7; // 한쪽 비율이 70% 이상이면 그 쪽 입장으로 간주

export async function getMirrorRows(userId: string): Promise<MirrorRow[]> {
  const [myPins, myBlinds] = await Promise.all([
    prisma.pin.findMany({
      where: { authorId: userId, hidden: false, deleted: false },
      select: { boardId: true, side: true },
    }),
    prisma.blindAnswer.findMany({
      where: { userId },
      select: {
        answer: true,
        pin: {
          select: { boardId: true, side: true },
        },
      },
    }),
  ]);

  const byBoard = new Map<
    string,
    { pros: number; cons: number; bPro: number; bCon: number; bUnsure: number }
  >();

  for (const p of myPins) {
    const v = byBoard.get(p.boardId) ?? defaults();
    if (p.side === "PRO") v.pros += 1;
    else v.cons += 1;
    byBoard.set(p.boardId, v);
  }

  for (const b of myBlinds) {
    const boardId = b.pin.boardId;
    const v = byBoard.get(boardId) ?? defaults();
    const eff = effectiveSide(b.answer, b.pin.side);
    if (eff === "PRO") v.bPro += 1;
    else if (eff === "CON") v.bCon += 1;
    else v.bUnsure += 1;
    byBoard.set(boardId, v);
  }

  if (byBoard.size === 0) return [];

  const boards = await prisma.board.findMany({
    where: { id: { in: Array.from(byBoard.keys()) } },
    select: { id: true, title: true, category: true },
  });
  const boardMap = new Map(boards.map((b) => [b.id, b]));

  const rows: MirrorRow[] = [];
  for (const [boardId, v] of Array.from(byBoard.entries())) {
    const board = boardMap.get(boardId);
    if (!board) continue;
    const status = classify(v);
    if (!status) continue; // 의견·블라인드 모두 0 또는 의미 없음
    rows.push({
      boardId,
      boardTitle: board.title,
      category: board.category,
      myPros: v.pros,
      myCons: v.cons,
      blindEffPro: v.bPro,
      blindEffCon: v.bCon,
      blindUnsure: v.bUnsure,
      status,
    });
  }

  // 살펴볼 만함 → 새 발견 → 갈림 → 일치 순
  const order: Record<MirrorStatus, number> = { warn: 0, new: 1, split: 2, match: 3 };
  rows.sort((a, b) => order[a.status] - order[b.status]);
  return rows;
}

function defaults() {
  return { pros: 0, cons: 0, bPro: 0, bCon: 0, bUnsure: 0 };
}

function effectiveSide(answer: BlindAnswerValue, side: "PRO" | "CON"): "PRO" | "CON" | "UNSURE" {
  if (answer === "UNSURE") return "UNSURE";
  if (answer === "AGREE") return side;
  return side === "PRO" ? "CON" : "PRO";
}

function classify(v: ReturnType<typeof defaults>): MirrorStatus | null {
  const pinTotal = v.pros + v.cons;
  const blindTotal = v.bPro + v.bCon;

  const pinStance: "PRO" | "CON" | "MIXED" | "NONE" =
    pinTotal === 0
      ? "NONE"
      : v.pros > 0 && v.cons === 0
        ? "PRO"
        : v.pros === 0 && v.cons > 0
          ? "CON"
          : "MIXED";

  const blindStance: "PRO" | "CON" | "MIXED" | "NONE" =
    blindTotal === 0
      ? "NONE"
      : v.bPro / blindTotal >= STANCE_THRESHOLD
        ? "PRO"
        : v.bCon / blindTotal >= STANCE_THRESHOLD
          ? "CON"
          : "MIXED";

  if (pinStance === "NONE" && blindStance === "NONE") return null;
  if (pinStance === "NONE") return "new";
  if (pinStance === "MIXED" || blindStance === "MIXED") return "split";
  if (blindStance === "NONE") return null; // 의견만 있고 블라인드 없으면 비교 의미 X
  if (pinStance === blindStance) return "match";
  return "warn";
}
