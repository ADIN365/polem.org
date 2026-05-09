import { AXIS_LABEL, type Axis } from "@/lib/likert/questions";
import { scoreToPercent } from "@/lib/likert/score";

interface PrismChartProps {
  scores: {
    society: number;
    ethics: number;
    economy: number;
    change: number;
  };
}

const AXIS_ROWS: { axis: Axis; field: keyof PrismChartProps["scores"] }[] = [
  { axis: "S", field: "society" },
  { axis: "E_ethics", field: "ethics" },
  { axis: "E_economy", field: "economy" },
  { axis: "C", field: "change" },
];

/**
 * 4축 가치관 프리즘 표시. 본인만 조회 (헌법 §2.3).
 * 흑백 잉크 — 정당색 회피.
 */
export default function PrismChart({ scores }: PrismChartProps) {
  return (
    <div className="px-5 py-5 space-y-5">
      {AXIS_ROWS.map(({ axis, field }) => (
        <PrismAxisRow
          key={axis}
          plus={AXIS_LABEL[axis].plus}
          minus={AXIS_LABEL[axis].minus}
          score={scores[field]}
        />
      ))}
    </div>
  );
}

function PrismAxisRow({ plus, minus, score }: { plus: string; minus: string; score: number }) {
  const percent = scoreToPercent(score); // -1..+1 → 0..100
  return (
    <div>
      <div className="flex justify-between items-baseline text-eyebrow-tight tracking-wider text-ink-3 uppercase mb-[6px]">
        <span>{minus}</span>
        <span className="text-ink-2 font-mono normal-case tracking-normal">
          {score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}
        </span>
        <span>{plus}</span>
      </div>
      <div className="relative h-[6px] bg-border-soft rounded-sm overflow-hidden">
        {/* 중앙 (0) 표시선 */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-ink-3 -translate-x-1/2 z-0" />
        {/* 점수 마커 */}
        <div
          className="absolute top-0 bottom-0 w-[3px] bg-ink z-10 rounded-sm"
          style={{ left: `calc(${percent}% - 1.5px)` }}
        />
      </div>
    </div>
  );
}
