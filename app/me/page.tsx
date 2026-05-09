import Link from "next/link";

import MirrorTable from "@/components/profile/MirrorTable";
import PrismChart from "@/components/profile/PrismChart";
import { CATEGORY_LABEL } from "@/lib/constants";
import { formatRelativeKo } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { getMirrorRows } from "@/lib/profile/mirror";
import { requireOnboarded } from "@/lib/session";

import SignOutButton from "./SignOutButton";

export const metadata = { title: "내 정보" };
export const dynamic = "force-dynamic";

/**
 * Phase 4 단계 — 계정 + 자기 제안 + 알림.
 * Phase 5/6/7 에서 4축 가치관 프리즘 + 의제별 자기 거울 추가.
 */
export default async function MePage() {
  const session = await requireOnboarded("/me");
  const { user } = session;

  const [proposals, notifications, prismScore, mirrorRows] = await Promise.all([
    prisma.proposal.findMany({
      where: { proposerId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        rawTitle: true,
        aiTitle: true,
        aiCategory: true,
        status: true,
        createdAt: true,
        rejectionReason: true,
        createdBoardId: true,
      },
    }),
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        body: true,
        link: true,
        read: true,
        createdAt: true,
      },
    }),
    prisma.prismScore.findUnique({
      where: { userId: user.id },
      select: {
        society: true,
        ethics: true,
        economy: true,
        change: true,
        likertCompletedAt: true,
        blindCount: true,
      },
    }),
    getMirrorRows(user.id),
  ]);

  return (
    <div className="max-w-narrow mx-auto px-6 pt-12 pb-20 space-y-6">
      <header>
        <h1
          className="font-serif font-semibold tracking-tight text-ink"
          style={{ fontSize: "var(--fs-title-h1)" }}
        >
          내 정보
        </h1>
      </header>

      <Section title="알림" subtitle={notifications.some((n) => !n.read) ? "읽지 않은 알림이 있어요." : undefined}>
        {notifications.length === 0 ? (
          <Empty>받은 알림이 없어요.</Empty>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li
                key={n.id}
                className="px-5 py-3 border-b-[0.5px] border-border-soft last:border-b-0 flex justify-between items-start gap-3"
              >
                <div className="flex-1">
                  <div
                    className={`text-meta leading-relaxed whitespace-pre-line ${
                      n.read ? "text-ink-3" : "text-ink"
                    }`}
                  >
                    {n.body}
                  </div>
                  <div className="text-eyebrow-tight text-ink-3 mt-1">
                    {formatRelativeKo(n.createdAt)}
                  </div>
                </div>
                {n.link ? (
                  <Link
                    href={n.link}
                    className="text-meta text-ink hover:underline shrink-0"
                  >
                    →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="내가 낸 의제 제안">
        {proposals.length === 0 ? (
          <Empty>
            아직 제안한 의제가 없어요. <Link href="/proposal" className="underline">의제 제안</Link>
          </Empty>
        ) : (
          <ul>
            {proposals.map((p) => (
              <li key={p.id} className="px-5 py-3 border-b-[0.5px] border-border-soft last:border-b-0">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="text-base text-ink">
                      {p.aiTitle ?? p.rawTitle}
                    </div>
                    {p.aiTitle && p.aiTitle !== p.rawTitle ? (
                      <div className="text-tiny text-ink-3 mt-[2px]">
                        원문: {p.rawTitle}
                      </div>
                    ) : null}
                    {p.aiCategory ? (
                      <div className="text-eyebrow-tight tracking-wider uppercase text-ink-3 mt-1">
                        {CATEGORY_LABEL[p.aiCategory] ?? p.aiCategory}
                      </div>
                    ) : null}
                    {p.status === "REJECTED" && p.rejectionReason ? (
                      <div className="text-meta text-[var(--accent-warn)] mt-1">
                        거절 사유: {p.rejectionReason}
                      </div>
                    ) : null}
                  </div>
                  <div className="text-tiny shrink-0 flex flex-col items-end gap-1">
                    <StatusBadge status={p.status} />
                    <span className="text-ink-3">{formatRelativeKo(p.createdAt)}</span>
                    {p.createdBoardId ? (
                      <Link href={`/boards/${p.createdBoardId}`} className="text-ink underline">
                        게시판 →
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title="계정"
        action={
          <Link
            href="/me/edit"
            className="text-tiny text-ink-3 hover:text-ink underline underline-offset-2"
          >
            수정
          </Link>
        }
      >
        <dl className="divide-y divide-[var(--border-soft)]">
          <Row label="닉네임" value={user.nickname} bold />
          <Row
            label="이메일"
            value={user.email}
            mono
            placeholder="등록 안 함"
          />
          <Row label="권한" value={labelRole(user.role)} />
        </dl>
      </Section>

      <Section
        title="가치관 4축"
        subtitle={
          prismScore?.likertCompletedAt
            ? `측정 ${formatRelativeKo(prismScore.likertCompletedAt)}`
            : undefined
        }
      >
        {prismScore?.likertCompletedAt ? (
          <>
            <PrismChart scores={prismScore} />
            <div className="px-5 pb-4 text-tiny text-ink-3 text-center">
              <Link href="/onboarding/likert?next=/me" className="underline hover:text-ink">
                다시 측정
              </Link>
            </div>
          </>
        ) : (
          <div className="px-5 py-8 text-center text-meta text-ink-3 leading-relaxed">
            아직 사상검증을 끝내지 않으셨어요.
            <br />
            <Link
              href="/onboarding/likert?next=/me"
              className="inline-block mt-3 px-4 py-[9px] text-button bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors"
            >
              12문항 측정하기 (5분)
            </Link>
          </div>
        )}
      </Section>

      <Section
        title="의제별 자기 거울"
        subtitle={
          prismScore?.blindCount
            ? `블라인드 답변 ${prismScore.blindCount}회 누적`
            : undefined
        }
      >
        <MirrorTable rows={mirrorRows} />
      </Section>

      <div className="flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="border-[0.5px] border-border-soft rounded-md bg-card overflow-hidden">
      <div className="px-5 py-3 border-b-[0.5px] border-border-soft bg-soft flex justify-between items-center">
        <span className="text-eyebrow tracking-widest text-ink-3 uppercase">{title}</span>
        {action ?? (subtitle ? <span className="text-tiny text-ink-3">{subtitle}</span> : null)}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-6 text-center text-meta text-ink-3">{children}</div>
  );
}

function Row({
  label,
  value,
  bold,
  mono,
  note,
  placeholder,
}: {
  label: string;
  value: string | null;
  bold?: boolean;
  mono?: boolean;
  note?: string;
  placeholder?: string;
}) {
  return (
    <div className="px-5 py-3 grid grid-cols-[100px_1fr] gap-3 items-baseline">
      <dt className="text-meta text-ink-3">{label}</dt>
      <dd
        className={`${bold ? "text-base font-medium text-ink" : "text-meta text-ink-2"} ${
          mono ? "font-mono" : ""
        }`}
      >
        {value ?? <span className="text-ink-3">{placeholder ?? "—"}</span>}
        {note ? <span className="ml-2 text-tiny text-ink-3">({note})</span> : null}
      </dd>
    </div>
  );
}

function StatusBadge({ status }: { status: "PENDING" | "APPROVED" | "REJECTED" }) {
  const map = {
    PENDING: { label: "검토 중", style: "bg-soft text-ink-2 border-[0.5px] border-border-soft" },
    APPROVED: { label: "승인", style: "bg-ink text-paper-cream" },
    REJECTED: { label: "거절", style: "bg-card text-[var(--accent-warn)] border-[0.5px] border-[var(--accent-warn)]" },
  } as const;
  const m = map[status];
  return <span className={`px-[6px] py-[2px] text-eyebrow-tight tracking-wide ${m.style}`}>{m.label}</span>;
}

function labelRole(role: string) {
  if (role === "ADMIN") return "관리자";
  if (role === "MODERATOR") return "모더레이터";
  return "일반";
}
