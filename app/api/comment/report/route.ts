import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AUTO_HIDE_REPORTS } from "@/lib/moderation";

const Body = z.object({ id: z.string().min(1).max(40) });

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "잘못된 요청입니다" }, { status: 400 });
  }

  const c = await prisma.comment.findUnique({
    where: { id: parsed.id },
    select: { id: true, reports: true, status: true },
  });
  if (!c) return NextResponse.json({ error: "없는 의견입니다" }, { status: 404 });

  const reports = c.reports + 1;
  await prisma.comment.update({
    where: { id: c.id },
    data: {
      reports,
      status: reports >= AUTO_HIDE_REPORTS ? "HIDDEN" : c.status,
    },
  });

  return NextResponse.json({ ok: true, hidden: reports >= AUTO_HIDE_REPORTS });
}
