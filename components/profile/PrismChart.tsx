import { AXIS_LABEL, type Axis } from "@/lib/likert/questions";
import { scoreToPercent, summarizeScores } from "@/lib/likert/score";

interface PrismChartProps {
  scores: {
    society: number;
    ethics: number;
    economy: number;
    change: number;
  };
}

const AXIS_ROWS: {
  axis: Axis;
  field: keyof PrismChartProps["scores"];
  /** 한국어 카테고리명 (사용자가 한눈에 의미 파악) */
  category: string;
}[] = [
  { axis: "S", field: "society", category: "사회관" },
  { axis: "E_ethics", field: "ethics", category: "윤리관" },
  { axis: "E_economy", field: "economy", category: "경제관" },
  { axis: "C", field: "change", category: "변화관" },
];

/**
 * 4축 가치관 프리즘 표시. 본인만 조회 (헌법 §2.3).
 */
export default function PrismChart({ scores }: PrismChartProps) {
  const summary = summarizeScores(scores);
  return (
    <div className="px-5 py-5 space-y-3">
      <div className="px-4 py-3 bg-soft border-[0.5px] border-border-soft rounded-md">
        <div className="text-eyebrow-tight tracking-wider uppercase text-ink-3 mb-1">
          종합
        </div>
        <p className="text-pin leading-relaxed text-ink">{summary}</p>
      </div>
      {AXIS_ROWS.map(({ axis, field, category }) => (
        <PrismAxisRow
          key={axis}
          category={category}
          plus={AXIS_LABEL[axis].plus}
          minus={AXIS_LABEL[axis].minus}
          score={scores[field]}
        />
      ))}
    </div>
  );
}

function PrismAxisRow({
  category,
  plus,
  minus,
  score,
}: {
  category: string;
  plus: string;
  minus: string;
  score: number;
}) {
  const percent = scoreToPercent(score); // -1..+1 → 0..100
  const lean = leanSide(score);
  const strength = strengthLabel(score);
  const summary = lean === "center" ? "중간" : `${strength} ${lean === "plus" ? plus : minus} 쪽`;

  return (
    <div className="border-[0.5px] border-border-soft rounded-md px-4 py-3 bg-card">
      <div className="flex justify-between items-baseline mb-3">
        <div className="text-meta font-semibold text-ink">{category}</div>
        <div className="text-tiny text-ink-2">
          <span className="font-medium">{summary}</span>
          <span className="ml-2 font-mono text-ink-3">
            {score >= 0 ? `+${score.toFixed(2)}` : score.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center text-tiny mb-[6px]">
        <span className={lean === "minus" ? "text-ink font-semibold" : "text-ink-3"}>{minus}</span>
        <span className={lean === "plus" ? "text-ink font-semibold" : "text-ink-3"}>{plus}</span>
      </div>

      <div className="relative h-[10px] bg-soft border-[0.5px] border-border-soft rounded-full">
        {/* 중앙 (0) 표시선 */}
        <div className="absolute left-1/2 top-[-3px] bottom-[-3px] w-[1px] bg-ink-4 -translate-x-1/2 z-0" />
        {/* 점수 마커 (원형) */}
        <div
          className="absolute top-1/2 w-[16px] h-[16px] bg-ink border-[2px] border-card rounded-full z-10 shadow-sm"
          style={{ left: `${percent}%`, transform: "translate(-50%, -50%)" }}
          aria-label={`점수 ${score.toFixed(2)}`}
        />
      </div>
    </div>
  );
}

/** 점수 부호 → 어느 쪽으로 기울었는지. |score| < 0.1 이면 중간. */
function leanSide(score: number): "plus" | "minus" | "center" {
  if (Math.abs(score) < 0.1) return "center";
  return score > 0 ? "plus" : "minus";
}

/** |score| → 강도 자연어. */
function strengthLabel(score: number): string {
  const a = Math.abs(score);
  if (a < 0.3) return "조금";
  if (a < 0.6) return "꽤";
  return "강하게";
}
