import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PROPOSAL_BODY_MAX, PROPOSAL_TITLE_MAX } from "@/lib/validation";

const Body = z.object({
  rawTitle: z
    .string()
    .trim()
    .min(5, "제안 제목을 5자 이상 적어주세요.")
    .max(PROPOSAL_TITLE_MAX, `제목은 ${PROPOSAL_TITLE_MAX}자 이내`),
  rawBody: z
    .string()
    .trim()
    .max(PROPOSAL_BODY_MAX, `배경 설명은 ${PROPOSAL_BODY_MAX}자 이내`)
    .optional()
    .nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.user.banned) return NextResponse.json({ error: "이용 정지 상태." }, { status: 403 });
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

  // 같은 사용자가 1시간 이내 동일 제목으로 또 내는 건 차단
  const recent = await prisma.proposal.findFirst({
    where: {
      proposerId: session.user.id,
      rawTitle: parsed.data.rawTitle,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json(
      { error: "방금 같은 제안을 보냈어요. 검토 결과를 기다려주세요." },
      { status: 409 },
    );
  }

  const created = await prisma.proposal.create({
    data: {
      proposerId: session.user.id,
      rawTitle: parsed.data.rawTitle,
      rawBody: parsed.data.rawBody ?? null,
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
}
