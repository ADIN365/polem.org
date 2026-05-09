import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [
    pendingProposals,
    refinedProposals,
    filteredProposals,
    pendingReports,
    activeBoards,
    totalUsers,
    bannedUsers,
  ] = await Promise.all([
    prisma.proposal.count({
      where: { status: "PENDING", aiTitle: null, aiFiltered: false },
    }),
    prisma.proposal.count({
      where: { status: "PENDING", aiTitle: { not: null } },
    }),
    prisma.proposal.count({
      where: { status: "PENDING", aiFiltered: true },
    }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.board.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.user.count({ where: { banned: true } }),
  ]);

  return (
    <div>
      <h1
        className="font-serif font-semibold tracking-tight text-ink mb-6"
        style={{ fontSize: "var(--fs-title-h2)" }}
      >
        대시보드
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Stat label="정제 대기" value={pendingProposals} hint="AI 정제 cron 실행 대기" />
        <Stat label="검토 대기" value={refinedProposals} hint="정제 끝, 관리자 승인 대기" highlight />
        <Stat label="AI 차단됨" value={filteredProposals} hint="관리자 검토 후 거절" />
        <Stat label="신고 처리 대기" value={pendingReports} highlight={pendingReports > 0} />
        <Stat label="활성 게시판" value={activeBoards} />
        <Stat label="가입자" value={totalUsers} hint={bannedUsers > 0 ? `정지 ${bannedUsers}` : undefined} />
      </div>

      <div className="mt-8 flex gap-2 flex-wrap">
        <Link
          href="/admin/proposals"
          className="px-4 py-[10px] text-button bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors"
        >
          의제 제안 큐
        </Link>
        <Link
          href="/admin/reports"
          className="px-4 py-[10px] text-button bg-card text-ink border-[0.5px] border-border rounded-md hover:bg-soft transition-colors"
        >
          신고 큐
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
  highlight,
}: {
  label: string;
  value: number;
  hint?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "border-[0.5px] rounded-md px-5 py-4 bg-card",
        highlight && value > 0 ? "border-ink" : "border-border-soft",
      ].join(" ")}
    >
      <div className="text-eyebrow tracking-widest text-ink-3 uppercase">{label}</div>
      <div
        className="font-serif font-semibold text-ink mt-1"
        style={{ fontSize: "var(--fs-stat-num)" }}
      >
        {value.toLocaleString()}
      </div>
      {hint ? <div className="text-tiny text-ink-3 mt-1">{hint}</div> : null}
    </div>
  );
}
