import { formatRelativeKo } from "@/lib/format";
import { prisma } from "@/lib/prisma";

import ReportRow from "./ReportRow";

export const metadata = { title: "신고 처리" };
export const dynamic = "force-dynamic";

const REASON_LABEL: Record<string, string> = {
  PERSONAL_ATTACK: "인신공격",
  HATE_SPEECH: "혐오",
  AD_SPAM: "광고·스팸",
  FALSE_INFO: "허위사실",
  OTHER: "기타",
};

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      body: true,
      createdAt: true,
      reporter: { select: { nickname: true, name: true } },
      pin: {
        select: {
          body: true,
          author: { select: { id: true, nickname: true, name: true, warningCount: true, banned: true } },
          board: { select: { id: true, title: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1
        className="font-serif font-semibold tracking-tight text-ink mb-2"
        style={{ fontSize: "var(--fs-title-h2)" }}
      >
        신고 처리 ({reports.length})
      </h1>
      <p className="text-meta text-ink-3 mb-6 leading-relaxed">
        욕설·인신공격·혐오·광고만 처리. 논리 토론은 그대로 둡니다.
        <br />
        차단 단계: 경고 → 7일 정지 → 영구 정지.
      </p>

      {reports.length === 0 ? (
        <div className="border-[0.5px] border-dashed border-border-soft rounded-md px-5 py-8 text-center text-meta text-ink-3 bg-soft">
          처리할 신고가 없어요.
        </div>
      ) : (
        <ul className="space-y-3">
          {reports.map((r) => (
            <ReportRow
              key={r.id}
              id={r.id}
              targetType={r.targetType}
              targetId={r.targetId}
              reason={REASON_LABEL[r.reason] ?? r.reason}
              body={r.body}
              createdAt={formatRelativeKo(r.createdAt)}
              reporter={r.reporter.nickname ?? r.reporter.name}
              pinSnippet={r.pin?.body ?? null}
              author={r.pin?.author ?? null}
              boardTitle={r.pin?.board.title ?? null}
              boardId={r.pin?.board.id ?? null}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
