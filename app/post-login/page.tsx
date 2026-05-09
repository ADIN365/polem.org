import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { kstStartOfToday } from "@/lib/time";

interface Props {
  searchParams: { next?: string };
}

/**
 * 카카오 OAuth 직후 도착하는 라우터 페이지. 명세 §5 가입 흐름:
 *   카카오 OAuth → 닉네임 설정 → 사상검증 안내 → (하루 첫 로그인이면) 오늘의 3문항 → 토론 주제
 * 신규 사용자(닉네임 null)는 강제로 /onboarding/nickname.
 * 그 외에는 KST 오늘 *첫* 로그인이고 답할 박제가 있으면 /three 로, 아니면 next 로.
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

  // 외부 링크로 의도 가지고 들어온 케이스 (/boards/123, /admin 등) 는 그대로 진행.
  // 그냥 '로그인' 만 누른 일반 흐름 (next === "/") 일 때만 헌법 §5 의 "오늘의 3문항 먼저" 적용.
  if (next === "/") {
    const since = kstStartOfToday();
    const [answeredToday, candidateCount] = await Promise.all([
      prisma.blindAnswer.count({
        where: { userId: session.user.id, createdAt: { gte: since } },
      }),
      prisma.pin.count({
        where: {
          blindQuestion: { not: null },
          hidden: false,
          deleted: false,
          authorId: { not: session.user.id },
          blindAnswers: { none: { userId: session.user.id } },
        },
      }),
    ]);
    if (answeredToday === 0 && candidateCount > 0) {
      redirect("/three");
    }
  }

  redirect(next);
}

// open-redirect 방어: 절대 URL · 외부 도메인은 거절
function sanitizeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
