import { NextResponse } from "next/server";
import { Prisma, BlindAnswerValue } from "@prisma/client";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const Body = z.object({
  pinId: z.string().min(1),
  answer: z.nativeEnum(BlindAnswerValue),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.user.banned) return NextResponse.json({ error: "이용 정지." }, { status: 403 });

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "입력 오류" }, { status: 400 });
  }

  const pin = await prisma.pin.findUnique({
    where: { id: parsed.data.pinId },
    select: { id: true, hidden: true, deleted: true, blindQuestion: true, authorId: true },
  });
  if (!pin || pin.hidden || pin.deleted || !pin.blindQuestion) {
    return NextResponse.json({ error: "응답 가능한 의견이 아니에요." }, { status: 404 });
  }
  if (pin.authorId === session.user.id) {
    return NextResponse.json({ error: "자기 의견에는 답할 수 없어요." }, { status: 400 });
  }

  const { answer } = parsed.data;
  try {
    await prisma.$transaction(async (tx) => {
      await tx.blindAnswer.create({
        data: { userId: session.user.id, pinId: pin.id, answer },
      });
      if (answer === "AGREE") {
        await tx.pin.update({ where: { id: pin.id }, data: { blindAgreeCount: { increment: 1 } } });
      } else if (answer === "DISAGREE") {
        await tx.pin.update({ where: { id: pin.id }, data: { blindDisagreeCount: { increment: 1 } } });
      }
      // PrismScore.blindCount 도 증분 (Phase 7 자기 거울에서 측정 출처 표시)
      await tx.prismScore.update({
        where: { userId: session.user.id },
        data: { blindCount: { increment: 1 } },
      }).catch(() => {
        // PrismScore 가 없는 경우 (가입 직후 events.createUser 가 아직 안 돌면) 무시
      });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "이미 답한 질문입니다." }, { status: 409 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
