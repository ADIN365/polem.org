import Link from "next/link";

import { CATEGORY_LABEL } from "@/lib/constants";
import { formatCount } from "@/lib/format";
import { Gauge } from "@/components/ui/Gauge";

export interface BoardRowData {
  id: string;
  title: string;
  category: string;
  proCount: number;
  conCount: number;
  participantCount: number;
  viewCount: number;
  updatedAt: Date;
  status: string;
  /** 데스크탑에만 표시되는 page-relative 자리 번호. 토론 주제 영구 ID 아님. */
  number: number;
  isNew?: boolean;
}

export function BoardRow({ board }: { board: BoardRowData }) {
  const total = board.proCount + board.conCount;
  const dimmed = total === 0 || board.status !== "ACTIVE";
  const tight = total >= 8 && Math.abs(board.proCount - board.conCount) / total < 0.1;

  return (
    <Link
      href={`/boards/${board.id}`}
      className="grid grid-cols-[1fr] md:grid-cols-[60px_1fr_180px_110px] gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-[14px] border-b-[0.5px] border-border-soft items-center hover:bg-soft transition-colors"
      style={{ opacity: dimmed ? 0.7 : 1 }}
    >
      <div className="hidden md:block font-mono text-tiny text-ink-3">
        #{String(board.number).padStart(3, "0")}
      </div>

      <div className="min-w-0">
        <div className="flex gap-2 items-baseline mb-[2px] text-eyebrow-tight tracking-wider text-ink-3 uppercase flex-wrap">
          <span>{CATEGORY_LABEL[board.category] ?? board.category}</span>
          {board.isNew ? (
            <span className="text-paper-cream bg-ink px-[5px] font-medium">새 토론 주제</span>
          ) : null}
          {tight ? (
            <span className="text-ink border-[0.5px] border-ink px-1 font-medium">팽팽</span>
          ) : null}
        </div>
        <div className="text-base text-ink font-medium tracking-tight">{board.title}</div>
        {/* 모바일에서만 — 비율 막대 인라인 */}
        <div className="md:hidden mt-2">
          <Gauge proCount={board.proCount} conCount={board.conCount} height={4} />
        </div>
      </div>

      <div className="hidden md:block">
        <Gauge proCount={board.proCount} conCount={board.conCount} />
      </div>

      <div className="text-right hidden md:block">
        <div className="text-meta text-ink-2">{formatCount(board.participantCount)}</div>
        <div className="text-eyebrow-tight text-ink-3">관람 {formatCount(board.viewCount)}</div>
      </div>
    </Link>
  );
}
