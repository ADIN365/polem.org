import { CATEGORY_LABEL } from "@/lib/constants";
import { formatRelativeKo } from "@/lib/format";
import { prisma } from "@/lib/prisma";

import ProposalRow from "./ProposalRow";

export const dynamic = "force-dynamic";
export const metadata = { title: "주제 검토" };

export default async function AdminProposalsPage() {
  const proposals = await prisma.proposal.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: {
      id: true,
      rawTitle: true,
      rawBody: true,
      aiTitle: true,
      aiCategory: true,
      aiFiltered: true,
      rejectionReason: true,
      createdAt: true,
      proposer: { select: { nickname: true, name: true } },
    },
  });

  const refined = proposals.filter((p) => !p.aiFiltered && p.aiTitle);
  const blocked = proposals.filter((p) => p.aiFiltered);
  const queued = proposals.filter((p) => !p.aiFiltered && !p.aiTitle);

  return (
    <div>
      <h1
        className="font-serif font-semibold tracking-tight text-ink mb-6"
        style={{ fontSize: "var(--fs-title-h2)" }}
      >
        주제 검토
      </h1>

      <Group title={`검토 대기 (${refined.length})`} description="AI 정제 끝. 승인 시 게시판 생성.">
        {refined.length === 0 ? (
          <Empty>검토 대기 중인 정제된 주제가 없어요.</Empty>
        ) : (
          refined.map((p) => (
            <ProposalRow
              key={p.id}
              id={p.id}
              proposer={p.proposer.nickname ?? p.proposer.name}
              createdAt={formatRelativeKo(p.createdAt)}
              rawTitle={p.rawTitle}
              rawBody={p.rawBody}
              aiTitle={p.aiTitle}
              aiCategory={p.aiCategory ? CATEGORY_LABEL[p.aiCategory] ?? p.aiCategory : null}
              filterReason={null}
              blocked={false}
            />
          ))
        )}
      </Group>

      <Group
        title={`AI 차단됨 (${blocked.length})`}
        description="AI 가 차단했지만 false positive 가능 — 검토 후 거절·승인 결정."
      >
        {blocked.length === 0 ? (
          <Empty>차단된 주제가 없어요.</Empty>
        ) : (
          blocked.map((p) => (
            <ProposalRow
              key={p.id}
              id={p.id}
              proposer={p.proposer.nickname ?? p.proposer.name}
              createdAt={formatRelativeKo(p.createdAt)}
              rawTitle={p.rawTitle}
              rawBody={p.rawBody}
              aiTitle={null}
              aiCategory={null}
              filterReason={p.rejectionReason}
              blocked
            />
          ))
        )}
      </Group>

      <Group
        title={`정제 대기 (${queued.length})`}
        description="cron worker 가 5분마다 처리. 시간이 지나도 머무르면 worker 점검 필요."
      >
        {queued.length === 0 ? (
          <Empty>정제 대기 중인 주제가 없어요.</Empty>
        ) : (
          queued.map((p) => (
            <div
              key={p.id}
              className="border-[0.5px] border-border-soft rounded-md bg-card px-5 py-4 mb-2"
            >
              <div className="text-eyebrow-tight text-ink-3 mb-1">
                @{p.proposer.nickname ?? p.proposer.name} · {formatRelativeKo(p.createdAt)}
              </div>
              <div className="text-base text-ink">{p.rawTitle}</div>
            </div>
          ))
        )}
      </Group>
    </div>
  );
}

function Group({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-3">
        <h2
          className="font-serif font-semibold text-ink"
          style={{ fontSize: "var(--fs-title-h3)" }}
        >
          {title}
        </h2>
        <p className="text-meta text-ink-3 mt-1 leading-relaxed">{description}</p>
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-[0.5px] border-dashed border-border-soft rounded-md px-5 py-6 text-center text-meta text-ink-3 bg-soft">
      {children}
    </div>
  );
}
