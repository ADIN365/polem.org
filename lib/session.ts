import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

export async function requireAuth(callbackUrl?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    const cb = callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : "";
    redirect(`/login${cb}`);
  }
  return session;
}

/**
 * 로그인 + 닉네임 설정 완료까지 강제. 닉네임 없으면 온보딩으로.
 * 가입 직후 사용자에게 사이트 본 기능을 차단하는 게이트.
 */
export async function requireOnboarded(callbackUrl?: string) {
  const session = await requireAuth(callbackUrl);
  if (!session.user.nickname) {
    redirect("/onboarding/nickname");
  }
  if (session.user.banned) {
    redirect("/banned");
  }
  return session as typeof session & { user: { nickname: string } };
}

/**
 * suspendedUntil 시점 통과 시 자동 해제. 단순 헬퍼.
 * API 라우트 등 데이터 변경 진입점에서 사용.
 */
export async function isSuspended(userId: string): Promise<{ suspended: boolean; until: Date | null }> {
  const { prisma } = await import("@/lib/prisma");
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { suspendedUntil: true, banned: true },
  });
  if (!u) return { suspended: true, until: null };
  if (u.banned) return { suspended: true, until: null };
  if (u.suspendedUntil && u.suspendedUntil.getTime() > Date.now()) {
    return { suspended: true, until: u.suspendedUntil };
  }
  return { suspended: false, until: null };
}
