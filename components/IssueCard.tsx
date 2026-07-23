import Link from "next/link";
import type { IssueCard as IssueCardData } from "@/lib/issues";
import { categoryMeta } from "@/lib/categories";
import ResultBar from "./ResultBar";

export default function IssueCard({ issue }: { issue: IssueCardData }) {
  const cat = categoryMeta(issue.category);
  return (
    <Link
      href={`/issue/${issue.slug}`}
      className="group block bg-card border-[0.5px] border-border rounded-lg p-5 hover:border-ink-4 hover:shadow-sm transition-all"
    >
      <div className="flex items-center gap-1.5 text-tiny text-ink-3 mb-2">
        <span>{cat.emoji}</span>
        <span>{cat.label}</span>
      </div>
      <h3
        className="font-serif font-semibold text-ink leading-snug mb-2 group-hover:text-accent-warm transition-colors"
        style={{ fontSize: "var(--fs-title-h4)" }}
      >
        {issue.question}
      </h3>
      {issue.summary ? (
        <p className="text-small text-ink-3 leading-relaxed mb-4 line-clamp-2">
          {issue.summary}
        </p>
      ) : null}
      <ResultBar
        proLabel={issue.proLabel}
        conLabel={issue.conLabel}
        proVotes={issue.proVotes}
        conVotes={issue.conVotes}
      />
    </Link>
  );
}
