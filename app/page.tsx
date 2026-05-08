import Link from "next/link";

import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/constants";

/**
 * Phase 0 placeholder. Phase 2 에서 의제 색인 (Board list) 으로 교체.
 * polem.html `view-index` 디자인 참조.
 */
export default function Home() {
  return (
    <div className="max-w-narrow mx-auto px-6 pt-16 pb-20">
      <header className="mb-10">
        <h1
          className="font-serif font-semibold tracking-tight text-ink"
          style={{ fontSize: "var(--fs-title-h1)" }}
        >
          {SITE_NAME}
        </h1>
        <p className="text-meta text-ink-3 mt-2 leading-relaxed">{SITE_DESCRIPTION}</p>
      </header>

      <section className="border-[0.5px] border-border-soft rounded-md bg-card p-6">
        <div
          className="font-serif font-semibold text-ink mb-3"
          style={{ fontSize: "var(--fs-title-h3)" }}
        >
          Phase 0 — 골격 작동 중
        </div>
        <ul className="text-meta text-ink-2 space-y-1 leading-relaxed">
          <li>· Next.js 14 + TypeScript + Tailwind</li>
          <li>· Prisma + PostgreSQL 모델 (v1.0)</li>
          <li>· NextAuth (카카오 OAuth — Phase 1 에서 활성)</li>
          <li>· 디자인 토큰 + 글자 크기 토글</li>
        </ul>
        <div className="text-tiny text-ink-3 mt-5 pt-4 border-t-[0.5px] border-border-soft">
          다음: Phase 1 — 카카오 OAuth · 닉네임 온보딩 · User 모델 활성화
        </div>
        <div className="flex gap-2 mt-5">
          <Link
            href="/login"
            className="px-4 py-[9px] text-button bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors"
          >
            로그인 (Phase 1)
          </Link>
          <Link
            href="/proposal"
            className="px-4 py-[9px] text-button bg-card text-ink border-[0.5px] border-border rounded-md hover:bg-soft transition-colors"
          >
            의제 제안 (Phase 4)
          </Link>
        </div>
      </section>
    </div>
  );
}
