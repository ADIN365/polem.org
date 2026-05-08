/**
 * 찬·반 비율 막대. 흰색 = PRO, 잉크 = CON. 헌법 2.4 진영색 회피.
 * proCount/conCount 가 0/0 일 때는 빈 막대 (50:50 표시 안 함, 헌법 2.1 AI 50:50 와 혼동 방지).
 */
export function Gauge({
  proCount,
  conCount,
  height = 5,
  showRow = true,
}: {
  proCount: number;
  conCount: number;
  height?: number;
  showRow?: boolean;
}) {
  const total = proCount + conCount;
  const proPct = total === 0 ? 0 : Math.round((proCount / total) * 100);
  const conPct = total === 0 ? 0 : 100 - proPct;

  return (
    <div>
      <div
        className="flex border-[0.5px] border-border bg-card overflow-hidden"
        style={{ height }}
        role="meter"
        aria-label="찬반 비율"
        aria-valuenow={proPct}
      >
        <div className="bg-card border-r-[0.5px] border-border" style={{ width: `${proPct}%` }} />
        <div className="bg-dark" style={{ width: `${conPct}%` }} />
      </div>
      {showRow && total > 0 ? (
        <div className="flex justify-between text-eyebrow-tight text-ink-2 mt-[3px]">
          <span>{proPct}%</span>
          <span>{conPct}%</span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * 게시판 헤더용 더 크고 숫자도 노출하는 변형.
 */
export function BoardBigGauge({ proCount, conCount }: { proCount: number; conCount: number }) {
  const total = proCount + conCount;
  const proPct = total === 0 ? 50 : Math.round((proCount / total) * 100);
  const conPct = total === 0 ? 50 : 100 - proPct;
  return (
    <div>
      <div
        className="flex border-[0.5px] border-border bg-card overflow-hidden"
        style={{ height: 6 }}
        role="meter"
        aria-label="찬반 비율"
        aria-valuenow={proPct}
      >
        <div className="bg-card border-r-[0.5px] border-border" style={{ width: `${proPct}%` }} />
        <div className="bg-dark" style={{ width: `${conPct}%` }} />
      </div>
      <div className="flex justify-between text-meta text-ink-2 font-medium mt-2">
        <span>찬성 {proCount.toLocaleString()} ({proPct}%)</span>
        <span>반대 {conCount.toLocaleString()} ({conPct}%)</span>
      </div>
    </div>
  );
}
