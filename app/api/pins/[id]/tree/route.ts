import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { fetchAncestors, fetchChildren, fetchPin } from "@/lib/pins";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ?? null;

  const [selected, ancestors, children] = await Promise.all([
    fetchPin(params.id, currentUserId),
    fetchAncestors(params.id, currentUserId),
    fetchChildren(params.id, currentUserId),
  ]);

  if (!selected) {
    return NextResponse.json({ error: "의견을 찾을 수 없어요." }, { status: 404 });
  }

  return NextResponse.json({
    selected,
    ancestors,
    children,
  });
}
