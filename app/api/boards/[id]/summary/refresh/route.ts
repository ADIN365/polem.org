import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "관리자 권한이 필요해요." }, { status: 403 });
  }

  const boardId = decodeURIComponent(params.id);
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, status: true },
  });
  if (!board) {
    return NextResponse.json({ error: "게시판을 찾을 수 없어요." }, { status: 404 });
  }

  // 이미 pending/processing 요청 있으면 중복 방지
  const existing = await prisma.aISummaryRequest.findFirst({
    where: {
      boardId: board.id,
      status: { in: ["PENDING", "PROCESSING"] },
    },
    select: { id: true, status: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: "이미 갱신 요청이 처리 중이에요.", requestId: existing.id, status: existing.status },
      { status: 409 },
    );
  }

  const request = await prisma.aISummaryRequest.create({
    data: {
      boardId: board.id,
      requestedById: session.user.id,
    },
    select: { id: true, status: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, request }, { status: 202 });
}
