import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Ctx {
  params: { id: string };
}

/**
 * 출처 반박 — 헌법 2.2: 반박자도 *다른 출처*를 첨부 필수.
 * 같은 의견에 같은 사용자가 여러 번 반박 가능 (각각 다른 출처).
 */
const Body = z.object({
  body: z.string().trim().min(10, "반박 내용을 10자 이상 적어주세요.").max(800),
  sourceUrl: z.string().trim().url("올바른 URL을 첨부해주세요."),
});

export async function POST(req: Request, { params }: Ctx) {
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

  const pin = await prisma.pin.findUnique({
    where: { id: params.id },
    select: { id: true, hidden: true, deleted: true, authorId: true },
  });
  if (!pin || pin.hidden || pin.deleted) {
    return NextResponse.json({ error: "의견을 찾을 수 없어요." }, { status: 404 });
  }
  if (pin.authorId === session.user.id) {
    return NextResponse.json({ error: "자기 의견에는 반박할 수 없어요." }, { status: 400 });
  }

  await prisma.challenge.create({
    data: {
      pinId: pin.id,
      challengerId: session.user.id,
      body: parsed.data.body,
      sourceUrl: parsed.data.sourceUrl,
    },
  });

  const count = await prisma.challenge.count({ where: { pinId: pin.id } });
  return NextResponse.json({ ok: true, challengeCount: count }, { status: 201 });
}
