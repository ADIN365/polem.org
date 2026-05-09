import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireOnboarded } from "@/lib/session";

import ThreeRunner from "./ThreeRunner";

export const metadata = { title: "오늘의 3문항" };
export const dynamic = "force-dynamic";

export default async function ThreePage() {
  const session = await requireOnboarded("/three");

  // 후보: 변환된 blindQuestion 가 있고, 본인 박제가 아니고, 본인이 아직 답 안 한 박제.
  // 50개 가져와 셔플 → 3개. (사용자 수 적을 때 단순 — 나중 PostgreSQL ORDER BY RANDOM()).
  const candidates = await prisma.pin.findMany({
    where: {
      blindQuestion: { not: null },
      hidden: false,
      deleted: false,
      authorId: { not: session.user.id },
      blindAnswers: { none: { userId: session.user.id } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      blindQuestion: true,
    },
  });

  const picked = shuffle(candidates).slice(0, 3);

  if (picked.length === 0) {
    return (
      <div className="max-w-narrow mx-auto px-6 pt-16 pb-20 text-center">
        <div
          className="font-serif font-semibold text-ink mb-3"
          style={{ fontSize: "var(--fs-title-h2)" }}
        >
          오늘의 3문항
        </div>
        <p className="text-meta text-ink-2 leading-relaxed mb-6">
          답하지 않은 블라인드 질문이 모두 소진됐어요.
          <br />
          박제가 더 쌓이면 새 질문이 변환됩니다.
        </p>
        <Link
          href="/"
          className="inline-block px-4 py-[10px] text-button bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors"
        >
          의제 색인으로
        </Link>
      </div>
    );
  }

  // 부족하면 부족한 대로 (1~2개) — 사용자에게 그대로 노출
  return <ThreeRunner pins={picked.map((p) => ({ id: p.id, question: p.blindQuestion! }))} />;
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
