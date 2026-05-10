import Link from "next/link";

import { CATEGORY_LABEL } from "@/lib/constants";
import type { MirrorRow, MirrorStatus } from "@/lib/profile/mirror";

const STATUS_LABEL: Record<MirrorStatus, string> = {
  match: "일치",
  warn: "살펴볼 만함",
  new: "새 발견",
  split: "갈림",
};

const STATUS_TONE: Record<MirrorStatus, string> = {
  match: "bg-ink text-paper-cream",
  warn: "border-[0.5px] border-[var(--accent-warn)] text-[var(--accent-warn)] bg-card",
  new: "border-[0.5px] border-ink-3 text-ink-2 bg-card",
  split: "bg-soft text-ink-2 border-[0.5px] border-border-soft",
};

const STATUS_HINT: Record<MirrorStatus, string> = {
  match: "의견한 입장과 블라인드 답변이 같은 방향.",
  warn: "의견 입장과 블라인드 답변이 다른 방향. 한 번 더 살펴볼 토론 주제.",
  new: "의견는 안 했지만 블라인드 답변이 한쪽으로 기울었어요.",
  split: "한 토론 주제 안에서 입장이 갈리는 중. 결정 미정.",
};

export default function MirrorTable({ rows }: { rows: MirrorRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-8 text-center text-meta text-ink-3 leading-relaxed">
        아직 비교할 데이터가 부족해요.
        <br />
        <Link href="/three" className="underline hover:text-ink">
          오늘의 3문항
        </Link>{" "}
        · 의견·동조가 더 쌓이면 토론 주제별로 자기 입장 정렬을 비춰드릴게요.
      </div>
    );
  }

  return (
    <ul>
      {rows.map((r) => (
        <li
          key={r.boardId}
          className="px-5 py-4 border-b-[0.5px] border-border-soft last:border-b-0"
        >
          <div className="flex justify-between items-baseline gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="text-eyebrow-tight tracking-wider text-ink-3 uppercase mb-[3px]">
                {CATEGORY_LABEL[r.category] ?? r.category}
              </div>
              <Link
                href={`/boards/${r.boardId}`}
                className="text-base text-ink font-medium tracking-tight hover:underline"
              >
                {r.boardTitle}
              </Link>
              <div className="mt-2 flex gap-3 text-tiny text-ink-3 flex-wrap">
                <Pair label="내 의견" pro={r.myPros} con={r.myCons} />
                <Pair label="블라인드" pro={r.blindEffPro} con={r.blindEffCon} unsure={r.blindUnsure} />
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span
                className={`px-[7px] py-[2px] text-eyebrow-tight tracking-wide ${STATUS_TONE[r.status]}`}
              >
                {STATUS_LABEL[r.status]}
              </span>
              <p className="text-tiny text-ink-3 mt-2 max-w-[180px] leading-relaxed">
                {STATUS_HINT[r.status]}
              </p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Pair({ label, pro, con, unsure }: { label: string; pro: number; con: number; unsure?: number }) {
  return (
    <span className="font-mono">
      <span className="text-ink-3 mr-1">{label}</span>
      <span className="text-ink">PRO {pro}</span>
      <span className="text-ink-3 mx-1">·</span>
      <span className="text-ink">CON {con}</span>
      {unsure ? (
        <>
          <span className="text-ink-3 mx-1">·</span>
          <span className="text-ink-3">? {unsure}</span>
        </>
      ) : null}
    </span>
  );
}
