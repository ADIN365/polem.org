import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Category } from "@prisma/client";

interface Ctx {
  params: { id: string };
}

const ApproveBody = z.object({
  action: z.literal("approve"),
  aiTitle: z.string().trim().min(5).max(80),
  aiCategory: z.nativeEnum(Category),
});

const RejectBody = z.object({
  action: z.literal("reject"),
  rejectionReason: z.string().trim().min(2).max(500),
});

const Body = z.discriminatedUnion("action", [ApproveBody, RejectBody]);

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력 오류" },
      { status: 400 },
    );
  }

  const proposal = await prisma.proposal.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, proposerId: true, rawTitle: true, rawBody: true },
  });
  if (!proposal) return NextResponse.json({ error: "제안을 찾을 수 없어요." }, { status: 404 });
  if (proposal.status !== "PENDING")
    return NextResponse.json({ error: "이미 처리된 제안이에요." }, { status: 409 });

  if (parsed.data.action === "approve") {
    const { aiTitle, aiCategory } = parsed.data;
    const result = await prisma.$transaction(async (tx) => {
      const board = await tx.board.create({
        data: {
          title: aiTitle,
          body: proposal.rawBody,
          category: aiCategory,
          proposerId: proposal.proposerId,
        },
        select: { id: true, title: true },
      });
      await tx.proposal.update({
        where: { id: proposal.id },
        data: {
          status: "APPROVED",
          aiTitle,
          aiCategory,
          aiFiltered: false,
          rejectionReason: null,
          reviewerId: session.user.id,
          reviewedAt: new Date(),
          createdBoardId: board.id,
        },
      });
      await tx.notification.create({
        data: {
          userId: proposal.proposerId,
          type: "PROPOSAL_APPROVED",
          body: `의제가 승인됐어요: ${board.title}`,
          link: `/boards/${board.id}`,
        },
      });
      return board;
    });
    return NextResponse.json({ ok: true, boardId: result.id });
  }

  // reject
  const { rejectionReason } = parsed.data;
  await prisma.$transaction([
    prisma.proposal.update({
      where: { id: proposal.id },
      data: {
        status: "REJECTED",
        reviewerId: session.user.id,
        reviewedAt: new Date(),
        rejectionReason,
      },
    }),
    prisma.notification.create({
      data: {
        userId: proposal.proposerId,
        type: "PROPOSAL_REJECTED",
        body: `의제가 거절됐어요: ${proposal.rawTitle.slice(0, 30)}…\n사유: ${rejectionReason}`,
      },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
