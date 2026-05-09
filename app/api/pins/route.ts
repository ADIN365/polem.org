import { NextResponse } from "next/server";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { checkProfanity, looksLikeSpam } from "@/lib/moderation/profanity";
import { prisma } from "@/lib/prisma";
import { PIN_BODY_MAX, PIN_BODY_MIN } from "@/lib/validation";
import { getServerSession } from "next-auth";

const Body = z.object({
  boardId: z.string().min(1),
  side: z.enum(["PRO", "CON"]),
  body: z
    .string()
    .trim()
    .min(PIN_BODY_MIN, `최소 ${PIN_BODY_MIN}자 이상 작성해주세요.`)
    .max(PIN_BODY_MAX, `${PIN_BODY_MAX}자 이내로 작성해주세요.`),
  quotedPinId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return unauthorized();
  if (session.user.banned) return forbidden();
  if (!session.user.nickname) return preconditionRequired("닉네임을 먼저 설정해주세요.");

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요." },
      { status: 400 },
    );
  }

  const { boardId, side, body, quotedPinId } = parsed.data;

  // 욕설 / 혐오 / 광고 자동 필터
  const prof = checkProfanity(body);
  if (!prof.ok) {
    return NextResponse.json({ error: prof.reason }, { status: 422 });
  }
  if (looksLikeSpam(body)) {
    return NextResponse.json(
      { error: "광고·스팸 으로 보이는 패턴이 감지됐어요." },
      { status: 422 },
    );
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, status: true },
  });
  if (!board || board.status !== "ACTIVE") {
    return NextResponse.json({ error: "게시판을 찾을 수 없어요." }, { status: 404 });
  }

  // 인용 의견 검증 — 같은 게시판일 필요는 없지만 존재해야 하고 hidden/deleted 가 아니어야.
  if (quotedPinId) {
    const quoted = await prisma.pin.findUnique({
      where: { id: quotedPinId },
      select: { id: true, hidden: true, deleted: true },
    });
    if (!quoted || quoted.hidden || quoted.deleted) {
      return NextResponse.json({ error: "인용할 의견을 찾을 수 없어요." }, { status: 400 });
    }
  }

  // 같은 게시판에 동일 사용자 의견는 *허용* (헌법 2.2 — 다수결 변질 방지하지만 의견 자체는 의견 표명).
  // 단 동일 본문 + 같은 사용자 + 같은 board 의 빠른 중복은 막음 (5분 이내).
  const recent = await prisma.pin.findFirst({
    where: {
      authorId: session.user.id,
      boardId,
      body,
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
    select: { id: true },
  });
  if (recent) {
    return NextResponse.json({ error: "방금 같은 내용으로 의견을 남겼어요." }, { status: 409 });
  }

  const pin = await prisma.$transaction(async (tx) => {
    const created = await tx.pin.create({
      data: {
        boardId,
        authorId: session.user.id,
        side,
        body,
        quotedPinId: quotedPinId ?? null,
      },
      select: { id: true },
    });
    await tx.board.update({
      where: { id: boardId },
      data: {
        proCount: side === "PRO" ? { increment: 1 } : undefined,
        conCount: side === "CON" ? { increment: 1 } : undefined,
        updatedAt: new Date(),
      },
    });
    // 참여자 수는 distinct 작가 수. 의견 만들 때마다 다시 계산하면 비용 큼.
    // 단순 휴리스틱: 같은 작가의 의견이 처음일 때만 +1.
    const otherPins = await tx.pin.count({
      where: { boardId, authorId: session.user.id, id: { not: created.id } },
    });
    if (otherPins === 0) {
      await tx.board.update({
        where: { id: boardId },
        data: { participantCount: { increment: 1 } },
      });
    }
    return created;
  });

  return NextResponse.json({ ok: true, id: pin.id }, { status: 201 });
}

function unauthorized() {
  return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
}
function forbidden() {
  return NextResponse.json({ error: "이용 정지 상태입니다." }, { status: 403 });
}
function preconditionRequired(msg: string) {
  return NextResponse.json({ error: msg }, { status: 428 });
}
