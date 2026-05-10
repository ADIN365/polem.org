import type { Prisma } from "@prisma/client";

import type { PinData } from "@/components/board/Pin";

import { prisma } from "./prisma";

const pinSelect = (currentUserId: string | null) =>
  ({
    id: true,
    side: true,
    body: true,
    createdAt: true,
    authorId: true,
    blindAgreeCount: true,
    blindDisagreeCount: true,
    quoteAgreeCount: true,
    quoteRebutCount: true,
    quotedPinId: true,
    quotedRelation: true,
    author: { select: { nickname: true, name: true } },
    quotedPin: {
      select: {
        body: true,
        author: { select: { nickname: true, name: true } },
      },
    },
    _count: { select: { endorsements: true } },
    endorsements: currentUserId
      ? { where: { userId: currentUserId }, select: { id: true } }
      : false,
  }) satisfies Prisma.PinSelect;

type PinRow = Prisma.PinGetPayload<{ select: ReturnType<typeof pinSelect> }>;

function mapPin(r: PinRow): PinData {
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
    quoted:
      r.quotedPin && r.quotedRelation
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
}

export const ROOT_PAGE_SIZE = 20;

export async function fetchRootPins(args: {
  boardId: string;
  side: "PRO" | "CON";
  page: number;
  currentUserId: string | null;
}): Promise<{ pins: PinData[]; total: number; page: number; pageSize: number }> {
  const { boardId, side, currentUserId } = args;
  const page = Math.max(1, args.page);
  const where: Prisma.PinWhereInput = {
    boardId,
    side,
    quotedPinId: null,
    hidden: false,
    deleted: false,
  };
  const [rows, total] = await Promise.all([
    prisma.pin.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip: (page - 1) * ROOT_PAGE_SIZE,
      take: ROOT_PAGE_SIZE,
      select: pinSelect(currentUserId),
    }),
    prisma.pin.count({ where }),
  ]);
  return {
    pins: rows.map(mapPin),
    total,
    page,
    pageSize: ROOT_PAGE_SIZE,
  };
}

export async function fetchPin(
  pinId: string,
  currentUserId: string | null,
): Promise<PinData | null> {
  const row = await prisma.pin.findFirst({
    where: { id: pinId, hidden: false, deleted: false },
    select: pinSelect(currentUserId),
  });
  return row ? mapPin(row) : null;
}

/**
 * Returns ancestor chain ordered root → direct parent.
 * Excludes the pin itself.
 * Hidden / deleted ancestors are silently dropped (chain may appear broken).
 */
export async function fetchAncestors(
  pinId: string,
  currentUserId: string | null,
): Promise<PinData[]> {
  const chain = await prisma.$queryRaw<{ id: string; depth: number }[]>`
    WITH RECURSIVE chain AS (
      SELECT id, "quotedPinId", 0 AS depth
      FROM "Pin"
      WHERE id = ${pinId}
      UNION ALL
      SELECT p.id, p."quotedPinId", chain.depth + 1
      FROM "Pin" p
      JOIN chain ON chain."quotedPinId" = p.id
    )
    SELECT id, depth FROM chain WHERE id <> ${pinId} ORDER BY depth DESC
  `;
  if (chain.length === 0) return [];
  const ids = chain.map((c) => c.id);
  const rows = await prisma.pin.findMany({
    where: { id: { in: ids }, hidden: false, deleted: false },
    select: pinSelect(currentUserId),
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is PinRow => r !== undefined)
    .map(mapPin);
}

export async function fetchChildren(
  pinId: string,
  currentUserId: string | null,
): Promise<{ agree: PinData[]; rebut: PinData[] }> {
  const rows = await prisma.pin.findMany({
    where: {
      quotedPinId: pinId,
      hidden: false,
      deleted: false,
    },
    orderBy: [{ createdAt: "desc" }],
    select: pinSelect(currentUserId),
  });
  const agree: PinData[] = [];
  const rebut: PinData[] = [];
  for (const r of rows) {
    const mapped = mapPin(r);
    if (r.quotedRelation === "AGREE") agree.push(mapped);
    else if (r.quotedRelation === "REBUT") rebut.push(mapped);
  }
  return { agree, rebut };
}
