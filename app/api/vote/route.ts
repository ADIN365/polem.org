import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/issues";
import { ensureVoterHash } from "@/lib/anon";

const Body = z.object({
  slug: z.string().min(1).max(120),
  side: z.enum(["PRO", "CON"]),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }
  const slug = normalizeSlug(parsed.slug);
  const { side } = parsed;

  const issue = await prisma.issue.findUnique({
    where: { slug },
    select: { id: true, status: true, proVotes: true, conVotes: true },
  });
  if (!issue || issue.status !== "PUBLISHED") {
    return NextResponse.json({ error: "존재하지 않는 쟁점입니다" }, { status: 404 });
  }

  const voterHash = ensureVoterHash();

  // 이미 투표했으면 기존 선택을 그대로 반환 (변경 불가 — 분포 오염 방지).
  const existing = await prisma.vote.findUnique({
    where: { issueId_voterHash: { issueId: issue.id, voterHash } },
    select: { side: true },
  });
  if (existing) {
    return NextResponse.json({
      side: existing.side,
      proVotes: issue.proVotes,
      conVotes: issue.conVotes,
      already: true,
    });
  }

  // 투표 기록 + 집계 캐시 증가를 한 트랜잭션으로.
  const [, updated] = await prisma.$transaction([
    prisma.vote.create({ data: { issueId: issue.id, side, voterHash } }),
    prisma.issue.update({
      where: { id: issue.id },
      data: side === "PRO" ? { proVotes: { increment: 1 } } : { conVotes: { increment: 1 } },
      select: { proVotes: true, conVotes: true },
    }),
  ]);

  return NextResponse.json({
    side,
    proVotes: updated.proVotes,
    conVotes: updated.conVotes,
  });
}
