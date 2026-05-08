import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

interface Props {
  searchParams: { next?: string };
}

/**
 * 카카오 OAuth 직후 도착하는 라우터 페이지. 명세 §5 가입 흐름:
 *   카카오 OAuth → 닉네임 설정 → 사상검증 안내 → 의제 색인
 * 신규 사용자(닉네임 null)는 강제로 /onboarding/nickname.
 * 이미 닉네임 있는 사용자는 next 파라미터(또는 /)로 이동.
 */
export default async function PostLoginPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const next = sanitizeNext(searchParams.next) ?? "/";

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(next)}`);
  }
  if (session.user.banned) {
    redirect("/banned");
  }
  if (!session.user.nickname) {
    redirect(`/onboarding/nickname?next=${encodeURIComponent(next)}`);
  }
  redirect(next);
}

// open-redirect 방어: 절대 URL · 외부 도메인은 거절
function sanitizeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
