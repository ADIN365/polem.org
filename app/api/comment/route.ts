import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeSlug } from "@/lib/issues";
import { ensureVoterHash } from "@/lib/anon";
import { moderateComment } from "@/lib/moderation";

const Body = z.object({
  slug: z.string().min(1).max(120),
  body: z.string().min(1).max(200),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const mod = moderateComment(parsed.body);
  if (!mod.ok) return NextResponse.json({ error: mod.reason }, { status: 422 });

  const issue = await prisma.issue.findUnique({
    where: { slug: normalizeSlug(parsed.slug) },
    select: { id: true, status: true },
  });
  if (!issue || issue.status !== "PUBLISHED") {
    return NextResponse.json({ error: "존재하지 않는 쟁점입니다" }, { status: 404 });
  }

  const voterHash = ensureVoterHash();

  // 이미 이 쟁점에 한 줄 남겼는지 (1인 1글)
  const existing = await prisma.comment.findUnique({
    where: { issueId_voterHash: { issueId: issue.id, voterHash } },
    select: { id: true },
  });
  if (existing) {
    return NextResponse.json({ error: "이미 이 쟁점에 의견을 남겼습니다" }, { status: 409 });
  }

  // 작성자의 투표 측을 함께 기록(정렬 표시용)
  const vote = await prisma.vote.findUnique({
    where: { issueId_voterHash: { issueId: issue.id, voterHash } },
    select: { side: true },
  });

  const comment = await prisma.comment.create({
    data: {
      issueId: issue.id,
      voterHash,
      body: parsed.body.trim(),
      side: vote?.side ?? null,
    },
    select: { id: true, body: true, side: true, createdAt: true },
  });

  return NextResponse.json({ comment });
}
