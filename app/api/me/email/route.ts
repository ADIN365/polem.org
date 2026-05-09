import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMAIL_MAX, EMAIL_REGEX } from "@/lib/validation";

// email=null 이면 등록 해제 (계정에서 분리)
const Body = z.object({
  email: z
    .string()
    .trim()
    .max(EMAIL_MAX, "이메일이 너무 길어요.")
    .regex(EMAIL_REGEX, "이메일 형식이 올바르지 않아요.")
    .nullable()
    .or(z.literal("").transform(() => null)),
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

  const email = parsed.data.email?.toLowerCase() ?? null;

  try {
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      // 사용자가 직접 입력한 이메일은 *검증되지 않은* 값. emailVerified 는 NULL 유지.
      data: { email, emailVerified: null },
      select: { id: true, email: true },
    });
    return NextResponse.json({ ok: true, email: updated.email });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "이미 다른 계정에서 사용 중인 이메일이에요." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "저장 중 오류가 발생했어요." }, { status: 500 });
  }
}
