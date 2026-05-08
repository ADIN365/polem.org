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
