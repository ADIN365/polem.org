import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "사상검증 안내" };
export const dynamic = "force-dynamic";

interface Props {
  searchParams: { next?: string };
}

export default async function IdeologyOnboardingPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const next = sanitizeNext(searchParams.next) ?? "/";

  if (!session?.user)
    redirect(`/login?callbackUrl=${encodeURIComponent(`/onboarding/ideology?next=${next}`)}`);
  if (!session.user.nickname)
    redirect(`/onboarding/nickname?next=${encodeURIComponent(`/onboarding/ideology?next=${next}`)}`);

  // 이미 사상검증 완료한 사람은 next 로
  const score = await prisma.prismScore.findUnique({
    where: { userId: session.user.id },
    select: { likertCompletedAt: true },
  });
  if (score?.likertCompletedAt) redirect(next);

  return (
    <div className="max-w-narrow mx-auto px-6 pt-16 pb-20">
      <div className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden max-w-[520px] mx-auto">
        <div className="px-8 pt-10 pb-3 text-center">
          <div
            className="font-serif font-semibold tracking-tight text-ink mb-3"
            style={{ fontSize: "var(--fs-title-modal)" }}
          >
            가치관 4축 측정
          </div>
          <p className="text-meta text-ink-2 leading-relaxed mb-2">
            12문항 · 약 5분. 답하시면 4축 가치관 좌표가 본인에게만 보입니다.
          </p>
          <p className="text-tiny text-ink-3 leading-relaxed mt-4">
            건너뛰셔도 됩니다. *오늘의 3문항* 에 답하면서 점수가 점진적으로 채워져요.
          </p>
        </div>

        <div className="px-8 py-5 bg-soft border-t-[0.5px] border-border-soft">
          <ul className="text-meta text-ink-2 space-y-2 leading-relaxed">
            <li>· 공동체 ↔ 개인</li>
            <li>· 보편 원칙 ↔ 상황 맥락</li>
            <li>· 안정·분배 ↔ 성장·위험</li>
            <li>· 전통·보존 ↔ 혁신·개방</li>
          </ul>
        </div>

        <div className="px-8 pt-5 pb-8 flex flex-col gap-2">
          <Link
            href={`/onboarding/likert?next=${encodeURIComponent(next)}`}
            className="text-center px-4 py-[14px] text-button-large font-medium bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors"
          >
            시작하기 (5분)
          </Link>
          <Link
            href={next}
            className="text-center px-4 py-2 text-meta text-ink-3 hover:text-ink transition-colors"
          >
            나중에
          </Link>
        </div>
      </div>
    </div>
  );
}

function sanitizeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
