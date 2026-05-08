import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Ctx {
  params: { id: string };
}

/**
 * 동조(↑) 추가. 헌법 2.2 — 비추천 없음. 좋아요만.
 * 자신의 박제에 동조 가능 여부는 명세 미확정 — 일단 허용하지 않음.
 */
export async function POST(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  if (session.user.banned) return NextResponse.json({ error: "이용 정지 상태." }, { status: 403 });

  const pin = await prisma.pin.findUnique({
    where: { id: params.id },
    select: { id: true, authorId: true, hidden: true, deleted: true },
  });
  if (!pin || pin.hidden || pin.deleted) {
    return NextResponse.json({ error: "박제를 찾을 수 없어요." }, { status: 404 });
  }
  if (pin.authorId === session.user.id) {
    return NextResponse.json({ error: "자기 박제에는 동조할 수 없어요." }, { status: 400 });
  }

  try {
    await prisma.endorsement.create({
      data: { pinId: pin.id, userId: session.user.id },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      // 이미 동조한 상태 — idempotent 200.
      return NextResponse.json({ ok: true, alreadyEndorsed: true });
    }
    throw e;
  }

  const count = await prisma.endorsement.count({ where: { pinId: pin.id } });
  return NextResponse.json({ ok: true, endorseCount: count });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });

  await prisma.endorsement.deleteMany({
    where: { pinId: params.id, userId: session.user.id },
  });
  const count = await prisma.endorsement.count({ where: { pinId: params.id } });
  return NextResponse.json({ ok: true, endorseCount: count });
}
