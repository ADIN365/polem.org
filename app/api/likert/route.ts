import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { QUESTIONS } from "@/lib/likert/questions";
import { computeScores } from "@/lib/likert/score";
import { prisma } from "@/lib/prisma";

const VALID_IDS = new Set(QUESTIONS.map((q) => q.id));

const Body = z.object({
  answers: z.record(z.string(), z.number().int().min(-2).max(2)),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (!session.user.nickname)
    return NextResponse.json({ error: "닉네임을 먼저 설정해주세요." }, { status: 428 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요." },
      { status: 400 },
    );
  }

  // 유효한 question id 만 선별
  const cleaned: Record<string, number> = {};
  for (const [k, v] of Object.entries(parsed.data.answers)) {
    if (VALID_IDS.has(k)) cleaned[k] = v;
  }
  if (Object.keys(cleaned).length < QUESTIONS.length) {
    return NextResponse.json(
      { error: `12 문항 모두 답해주세요. (받은 ${Object.keys(cleaned).length}개)` },
      { status: 400 },
    );
  }

  const scores = computeScores(cleaned);
  const now = new Date();

  // LikertAnswer upsert + PrismScore upsert
  await prisma.$transaction(async (tx) => {
    for (const [questionId, value] of Object.entries(cleaned)) {
      const q = QUESTIONS.find((x) => x.id === questionId)!;
      await tx.likertAnswer.upsert({
        where: { userId_questionId: { userId: session.user.id, questionId } },
        update: { value, axis: q.axis },
        create: {
          userId: session.user.id,
          questionId,
          axis: q.axis,
          value,
        },
      });
    }
    await tx.prismScore.upsert({
      where: { userId: session.user.id },
      update: {
        society: scores.society,
        ethics: scores.ethics,
        economy: scores.economy,
        change: scores.change,
        likertCompletedAt: now,
      },
      create: {
        userId: session.user.id,
        society: scores.society,
        ethics: scores.ethics,
        economy: scores.economy,
        change: scores.change,
        likertCompletedAt: now,
      },
    });
  });

  return NextResponse.json({ ok: true, scores });
}
