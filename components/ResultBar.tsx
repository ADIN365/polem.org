// 찬반 분포 막대 — 서버/클라 공용. proLabel(파랑) vs conLabel(웜레드).
export default function ResultBar({
  proLabel,
  conLabel,
  proVotes,
  conVotes,
  highlight,
}: {
  proLabel: string;
  conLabel: string;
  proVotes: number;
  conVotes: number;
  highlight?: "PRO" | "CON" | null;
}) {
  const total = proVotes + conVotes;
  const proPct = total === 0 ? 50 : Math.round((proVotes / total) * 100);
  const conPct = 100 - proPct;

  return (
    <div>
      <div className="flex items-center justify-between text-small mb-1.5">
        <span className={`font-medium ${highlight === "PRO" ? "text-pro" : "text-ink-2"}`}>
          {proLabel} {proPct}%
        </span>
        <span className={`font-medium ${highlight === "CON" ? "text-con" : "text-ink-2"}`}>
          {conLabel} {conPct}%
        </span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-soft" role="img"
        aria-label={`${proLabel} ${proPct}%, ${conLabel} ${conPct}%`}>
        <div
          className="bg-pro transition-[width] duration-500"
          style={{ width: `${proPct}%` }}
        />
        <div
          className="bg-con transition-[width] duration-500"
          style={{ width: `${conPct}%` }}
        />
      </div>
      <div className="text-tiny text-ink-3 mt-1.5 text-center tabular-nums">
        {total.toLocaleString()}명 참여
      </div>
    </div>
  );
}
