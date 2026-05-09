import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  NICKNAME_REGEX,
  canChangeNicknameNow,
  isReservedNickname,
  nextNicknameChangeAt,
} from "@/lib/validation";

const Body = z.object({
  nickname: z.string().regex(NICKNAME_REGEX, "닉네임 형식이 올바르지 않아요."),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요." },
      { status: 400 },
    );
  }

  const nickname = parsed.data.nickname.trim();
  if (isReservedNickname(nickname)) {
    return NextResponse.json({ error: "사용할 수 없는 닉네임이에요." }, { status: 400 });
  }

  // 첫 설정 (nickname=null) 은 게이트 통과. 이미 있으면 30일 게이트 적용.
  const current = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nickname: true, nicknameUpdatedAt: true },
  });
  if (!current) {
    return NextResponse.json({ error: "사용자를 찾지 못했어요." }, { status: 404 });
  }

  if (current.nickname === nickname) {
    return NextResponse.json({ ok: true, nickname, unchanged: true });
  }

  const isChange = !!current.nickname;
  if (isChange && !canChangeNicknameNow(current.nicknameUpdatedAt)) {
    const next = nextNicknameChangeAt(current.nicknameUpdatedAt);
    return NextResponse.json(
      {
        error: "닉네임은 30일에 한 번만 변경할 수 있어요.",
        nextChangeAt: next?.toISOString(),
      },
      { status: 429 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        nickname,
        ...(isChange ? { nicknameUpdatedAt: new Date() } : {}),
      },
      select: { id: true, nickname: true, nicknameUpdatedAt: true },
    });
    return NextResponse.json({
      ok: true,
      nickname: updated.nickname,
      nextChangeAt: nextNicknameChangeAt(updated.nicknameUpdatedAt)?.toISOString() ?? null,
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "이미 사용 중인 닉네임이에요." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "저장 중 오류가 발생했어요." }, { status: 500 });
  }
}
