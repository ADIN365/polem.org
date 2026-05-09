import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Ctx {
  params: { id: string };
}

const Body = z.discriminatedUnion("action", [
  // 신고 인정 + 대상 조치
  z.object({
    action: z.literal("resolve"),
    /** 위반자에게 적용할 단계 */
    sanction: z.enum(["WARN", "SUSPEND_7D", "BAN"]),
    /** 박제·댓글이면 본문 숨김 처리 */
    hideContent: z.boolean().default(true),
    note: z.string().trim().max(500).optional(),
  }),
  // 신고 기각
  z.object({
    action: z.literal("dismiss"),
    note: z.string().trim().max(500).optional(),
  }),
]);

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "MODERATOR")) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success)
    return NextResponse.json({ error: "입력 오류" }, { status: 400 });

  const report = await prisma.report.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      status: true,
      targetType: true,
      targetId: true,
      pinId: true,
      reason: true,
    },
  });
  if (!report) return NextResponse.json({ error: "신고를 찾을 수 없어요." }, { status: 404 });
  if (report.status !== "PENDING")
    return NextResponse.json({ error: "이미 처리된 신고입니다." }, { status: 409 });

  if (parsed.data.action === "dismiss") {
    await prisma.report.update({
      where: { id: report.id },
      data: {
        status: "DISMISSED",
        resolvedById: session.user.id,
        resolvedAt: new Date(),
      },
    });
    return NextResponse.json({ ok: true });
  }

  // resolve — 위반자 식별 후 단계별 조치
  const { sanction, hideContent } = parsed.data;
  const offenderId = await findOffenderId(report);
  if (!offenderId) {
    return NextResponse.json({ error: "위반자를 식별할 수 없어요." }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    // 1) 신고 처리
    await tx.report.update({
      where: { id: report.id },
      data: {
        status: "RESOLVED",
        resolvedById: session.user.id,
        resolvedAt: new Date(),
      },
    });

    // 2) 대상 콘텐츠 숨김 (박제·댓글)
    if (hideContent) {
      if (report.targetType === "PIN") {
        await tx.pin.update({ where: { id: report.targetId }, data: { hidden: true } });
      } else if (report.targetType === "COMMENT") {
        await tx.comment.update({ where: { id: report.targetId }, data: { hidden: true } });
      }
    }

    // 3) 사용자 차단 단계 적용
    const offender = await tx.user.findUnique({
      where: { id: offenderId },
      select: { warningCount: true },
    });
    if (!offender) return;

    if (sanction === "WARN") {
      await tx.user.update({
        where: { id: offenderId },
        data: { warningCount: { increment: 1 } },
      });
      await tx.notification.create({
        data: {
          userId: offenderId,
          type: "WARNING",
          body: "이용약관 위반으로 경고를 받았습니다. 누적 위반 시 일시·영구 정지될 수 있어요.",
        },
      });
    } else if (sanction === "SUSPEND_7D") {
      await tx.user.update({
        where: { id: offenderId },
        data: {
          warningCount: { increment: 1 },
          suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
      await tx.notification.create({
        data: {
          userId: offenderId,
          type: "SUSPENSION",
          body: "이용약관 위반으로 7일간 이용이 정지됐습니다. 누적 시 영구 정지될 수 있어요.",
        },
      });
    } else if (sanction === "BAN") {
      await tx.user.update({
        where: { id: offenderId },
        data: {
          banned: true,
          warningCount: { increment: 1 },
        },
      });
      await tx.notification.create({
        data: {
          userId: offenderId,
          type: "SUSPENSION",
          body: "이용약관 위반으로 *영구 정지* 됐습니다. 이의 신청은 contact@polem.org",
        },
      });
    }

    // 4) 신고자에게 처리 결과 알림
    await tx.notification.create({
      data: {
        userId: (await tx.report.findUnique({ where: { id: report.id }, select: { reporterId: true } }))!.reporterId,
        type: "REPORT_RESOLVED",
        body: "신고하신 건이 처리됐어요. 검토해 주셔서 감사합니다.",
      },
    });
  });

  return NextResponse.json({ ok: true });
}

async function findOffenderId(report: {
  targetType: "PIN" | "COMMENT" | "USER";
  targetId: string;
}): Promise<string | null> {
  if (report.targetType === "USER") return report.targetId;
  if (report.targetType === "PIN") {
    const pin = await prisma.pin.findUnique({
      where: { id: report.targetId },
      select: { authorId: true },
    });
    return pin?.authorId ?? null;
  }
  if (report.targetType === "COMMENT") {
    const c = await prisma.comment.findUnique({
      where: { id: report.targetId },
      select: { authorId: true },
    });
    return c?.authorId ?? null;
  }
  return null;
}
