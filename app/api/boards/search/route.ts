import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

// Public read-only endpoint consumed by self-site bots via the canonical
// matcher (docs/polem-backlink/matcher.ts). Contract: { boards: [...] } with
// id, title, category, updatedAt, proCount, conCount. Auth-less and cached.
// See POL-43.

export const runtime = "nodejs";
export const revalidate = 300;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;
const MAX_Q_LENGTH = 100;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const rawQ = url.searchParams.get("q") ?? "";
  const q = rawQ.trim().slice(0, MAX_Q_LENGTH);
  const limit = clampLimit(url.searchParams.get("limit"));

  // Empty q must not expose the full board list (issue §산출물).
  if (q.length === 0) {
    return json({ boards: [] });
  }

  const boards = await prisma.board.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        { body: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      category: true,
      updatedAt: true,
      proCount: true,
      conCount: true,
    },
  });

  return json({ boards });
}

function clampLimit(raw: string | null): number {
  if (!raw) return DEFAULT_LIMIT;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_LIMIT;
  return Math.min(n, MAX_LIMIT);
}

function json(body: unknown) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, max-age=300, s-maxage=600",
    },
  });
}
