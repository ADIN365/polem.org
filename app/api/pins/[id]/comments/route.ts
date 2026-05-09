import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { checkProfanity, looksLikeSpam } from "@/lib/moderation/profanity";
import { prisma } from "@/lib/prisma";
import { COMMENT_BODY_MAX, COMMENT_BODY_MIN } from "@/lib/validation";

interface Ctx {
  params: { id: string };
}

const Body = z.object({
  body: z
    .string()
    .trim()
    .min(COMMENT_BODY_MIN)
    .max(COMMENT_BODY_MAX, `${COMMENT_BODY_MAX}자 이내로 작성해주세요.`),
  parentId: z.string().optional().nullable(),
});

export async function GET(_req: Request, { params }: Ctx) {
  const rows = await prisma.comment.findMany({
    where: { pinId: params.id, deleted: false, hidden: false },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      parentId: true,
      body: true,
      createdAt: true,
      author: { select: { nickname: true, name: true } },
    },
  });
  return NextResponse.json({
    comments: rows.map((r) => ({
      id: r.id,
      parentId: r.parentId,
      body: r.body,
      createdAt: r.createdAt,
      authorNickname: r.author.nickname ?? r.author.name,
    })),
  });
}

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

  const prof = checkProfanity(parsed.data.body);
  if (!prof.ok) return NextResponse.json({ error: prof.reason }, { status: 422 });
  if (looksLikeSpam(parsed.data.body))
    return NextResponse.json({ error: "광고·스팸 으로 보이는 패턴이 감지됐어요." }, { status: 422 });

  const pin = await prisma.pin.findUnique({
    where: { id: params.id },
    select: { id: true, hidden: true, deleted: true },
  });
  if (!pin || pin.hidden || pin.deleted) {
    return NextResponse.json({ error: "박제를 찾을 수 없어요." }, { status: 404 });
  }

  if (parsed.data.parentId) {
    const parent = await prisma.comment.findUnique({
      where: { id: parsed.data.parentId },
      select: { pinId: true, deleted: true, hidden: true },
    });
    if (!parent || parent.pinId !== pin.id || parent.deleted || parent.hidden) {
      return NextResponse.json({ error: "상위 댓글을 찾을 수 없어요." }, { status: 400 });
    }
  }

  const created = await prisma.comment.create({
    data: {
      pinId: pin.id,
      authorId: session.user.id,
      parentId: parsed.data.parentId ?? null,
      body: parsed.data.body,
    },
    select: {
      id: true,
      parentId: true,
      body: true,
      createdAt: true,
      author: { select: { nickname: true, name: true } },
    },
  });

  return NextResponse.json(
    {
      ok: true,
      comment: {
        id: created.id,
        parentId: created.parentId,
        body: created.body,
        createdAt: created.createdAt,
        authorNickname: created.author.nickname ?? created.author.name,
      },
    },
    { status: 201 },
  );
}
