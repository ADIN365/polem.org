import Link from "next/link";

import type { CitationView } from "@/lib/ai-summary";

import SummaryRefreshButton from "./SummaryRefreshButton";

interface Props {
  boardId: string;
  pro: string | null;
  con: string | null;
  at: Date | null;
  citationsPro: CitationView[];
  citationsCon: CitationView[];
  isAdmin: boolean;
  hasActiveRequest: boolean;
}

export default function SummaryCards({
  boardId,
  pro,
  con,
  at,
  citationsPro,
  citationsCon,
  isAdmin,
  hasActiveRequest,
}: Props) {
  const hasSummary = !!(pro || con);

  return (
    <section className="px-[18px] py-[14px] border-b-[0.5px] border-border-soft bg-[#cdcdcd]">
      <div className="flex justify-between items-center mb-2 px-1">
        <div className="text-eyebrow-tight tracking-wider uppercase text-ink-2">
          {at ? `AI 의견정리 ${formatDate(at)}` : "AI 의견정리"}
        </div>
        {isAdmin ? (
          <SummaryRefreshButton boardId={boardId} hasActiveRequest={hasActiveRequest} />
        ) : null}
      </div>

      {hasSummary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SummaryCard
            label="찬성 의견정리"
            body={pro}
            isPro
            citations={citationsPro}
          />
          <SummaryCard
            label="반대 의견정리"
            body={con}
            isPro={false}
            citations={citationsCon}
          />
        </div>
      ) : (
        <div className="text-tiny text-ink-3 py-3 text-center">
          {hasActiveRequest ? "AI 의견정리 생성 중…" : "아직 AI 의견정리가 없어요."}
        </div>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  body,
  isPro,
  citations,
}: {
  label: string;
  body: string | null;
  isPro: boolean;
  citations: CitationView[];
}) {
  const cardClasses = isPro
    ? "bg-card text-ink border-[0.5px] border-ink"
    : "bg-paper-cream text-ink border-[0.5px] border-ink";
  return (
    <article className={`px-4 py-3 rounded-md ${cardClasses}`}>
      <div className="flex items-center gap-2 mb-2">
        <span
          className={[
            "inline-block w-[8px] h-[8px] rounded-full",
            isPro ? "bg-paper-cream border-[1.5px] border-ink" : "bg-ink",
          ].join(" ")}
          aria-hidden="true"
        />
        <span className="text-eyebrow-tight tracking-wider uppercase">{label}</span>
      </div>
      <p className="text-pin leading-relaxed mb-3 select-text">{body ?? "—"}</p>
      {citations.length > 0 ? (
        <div
          className="text-tiny pt-2 border-t border-border-soft text-ink-3"
        >
          <span className="mr-2">인용</span>
          {citations.map((c, i) => (
            <span key={c.pinId}>
              {i > 0 ? <span aria-hidden="true"> · </span> : null}
              <Link
                href={c.authorNickname ? `/u/${encodeURIComponent(c.authorNickname)}` : "#"}
                className="hover:underline"
              >
                @{c.authorNickname ?? "익명"}
              </Link>
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ko", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
