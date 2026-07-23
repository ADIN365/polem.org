import Link from "next/link";
import { getHotIssues, getRecentIssues } from "@/lib/issues";
import { CATEGORIES } from "@/lib/categories";
import IssueCard from "@/components/IssueCard";

export const revalidate = 120; // 2분 ISR

export default async function HomePage() {
  const [hot, recent] = await Promise.all([getHotIssues(4), getRecentIssues(24)]);

  return (
    <div className="max-w-site mx-auto px-6 py-10">
      {/* 히어로 */}
      <section className="text-center mb-12 max-w-narrow mx-auto">
        <h1
          className="font-serif font-bold text-ink leading-tight mb-3"
          style={{ fontSize: "var(--fs-title-h1)" }}
        >
          찬성과 반대, 양쪽을 다 보고 한 표.
        </h1>
        <p className="text-ink-3 leading-relaxed">
          사회쟁점부터 일상 밸런스까지 — 균형 잡힌 근거를 읽고, 익명으로 투표하고,
          전체 분포를 확인하세요.
        </p>
      </section>

      {/* 카테고리 진입 */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {CATEGORIES.map((c) => (
          <Link
            key={c.slug}
            href={`/c/${c.slug}`}
            className="px-4 py-2 rounded-full border-[0.5px] border-border text-small text-ink-2 hover:bg-card hover:border-ink-4 transition-colors"
          >
            <span className="mr-1">{c.emoji}</span>
            {c.label}
          </Link>
        ))}
      </div>

      {hot.length > 0 ? (
        <section className="mb-12">
          <h2 className="font-serif font-semibold text-ink mb-4" style={{ fontSize: "var(--fs-title-h3)" }}>
            지금 뜨거운 쟁점
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {hot.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2 className="font-serif font-semibold text-ink mb-4" style={{ fontSize: "var(--fs-title-h3)" }}>
          최근 올라온 쟁점
        </h2>
        {recent.length === 0 ? (
          <p className="text-ink-3 text-small py-12 text-center">
            아직 쟁점이 없습니다. 곧 채워집니다.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
