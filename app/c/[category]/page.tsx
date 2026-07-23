import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categoryBySlug, CATEGORIES } from "@/lib/categories";
import { getIssuesByCategory } from "@/lib/issues";
import IssueCard from "@/components/IssueCard";

export const revalidate = 120;

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export function generateMetadata({ params }: { params: { category: string } }): Metadata {
  const cat = categoryBySlug(params.category);
  if (!cat) return {};
  return {
    title: `${cat.label} 쟁점 모음`,
    description: `${cat.desc} — 찬반 근거 정리와 익명 투표.`,
  };
}

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const cat = categoryBySlug(params.category);
  if (!cat) notFound();

  const issues = await getIssuesByCategory(cat.key);

  return (
    <div className="max-w-site mx-auto px-6 py-10">
      <header className="mb-8">
        <div className="text-tiny text-ink-3 mb-1">{cat.emoji} 카테고리</div>
        <h1 className="font-serif font-bold text-ink mb-2" style={{ fontSize: "var(--fs-title-h2)" }}>
          {cat.label}
        </h1>
        <p className="text-ink-3 text-small">{cat.desc}</p>
      </header>

      {issues.length === 0 ? (
        <p className="text-ink-3 text-small py-12 text-center">
          이 카테고리에는 아직 쟁점이 없습니다.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} />
          ))}
        </div>
      )}
    </div>
  );
}
