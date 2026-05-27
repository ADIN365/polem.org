import { NextResponse } from "next/server";
import { ReportReason, ReportTargetType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  targetType: z.nativeEnum(ReportTargetType),
  targetId: z.string().min(1),
  reason: z.nativeEnum(ReportReason),
  body: z.string().trim().max(800).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.user.banned) return NextResponse.json({ error: "이용 정지." }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "입력값이 올바르지 않아요." }, { status: 400 });

  const { targetType, targetId, reason, body } = parsed.data;

  if (reason === ReportReason.MISCLASSIFIED_SIDE && targetType !== ReportTargetType.PIN) {
    return NextResponse.json({ error: "진영 분류 오류는 의견에만 신고 가능해요." }, { status: 400 });
  }

  // 대상 존재 확인 — Pin / Comment / User
  let pinId: string | null = null;
  if (targetType === "PIN") {
    const pin = await prisma.pin.findUnique({
      where: { id: targetId },
      select: { id: true, authorId: true },
    });
    if (!pin) return NextResponse.json({ error: "의견을 찾을 수 없어요." }, { status: 404 });
    if (pin.authorId === session.user.id)
      return NextResponse.json({ error: "자기 글은 신고할 수 없어요." }, { status: 400 });
    pinId = pin.id;
  } else if (targetType === "USER") {
    const u = await prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!u) return NextResponse.json({ error: "사용자를 찾을 수 없어요." }, { status: 404 });
    if (u.id === session.user.id)
      return NextResponse.json({ error: "자기 자신은 신고할 수 없어요." }, { status: 400 });
  }

  // 같은 사용자가 같은 대상을 24시간 내 또 신고 차단
  const recent = await prisma.report.findFirst({
    where: {
      reporterId: session.user.id,
      targetType,
      targetId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json(
      { error: "이미 신고하신 대상이에요. 결과를 기다려주세요." },
      { status: 409 },
    );
  }

  await prisma.report.create({
    data: {
      reporterId: session.user.id,
      targetType,
      targetId,
      pinId,
      reason,
      body: body ?? null,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
