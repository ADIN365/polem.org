import Link from "next/link";

import { CATEGORY_LABEL } from "@/lib/constants";
import { formatRelativeKo } from "@/lib/format";
import { prisma } from "@/lib/prisma";
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

  const [proposals, notifications] = await Promise.all([
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
        <p className="text-meta text-ink-3 mt-1">
          공개 정보와 비공개 정보가 분리되어 있어요. (Private-by-Design)
        </p>
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

      <Section title="계정">
        <dl className="divide-y divide-[var(--border-soft)]">
          <Row label="닉네임" value={user.nickname} bold />
          <Row
            label="이메일"
            value={user.email ?? "미수신"}
            mono
            note="비공개"
          />
          <Row label="권한" value={labelRole(user.role)} />
        </dl>
      </Section>

      <Section title="가치관 프리즘 · 자기 거울" subtitle="Phase 5~7 예정">
        <div className="px-5 py-8 text-center text-meta text-ink-3 leading-relaxed">
          사상검증(12 Likert)을 끝내면 4축 점수가 본인에게만 보입니다.
          <br />
          오늘의 3문항에 답하면, 박제한 입장과의 *불일치*도 본인에게만 비춰집니다.
        </div>
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
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-[0.5px] border-border-soft rounded-md bg-card overflow-hidden">
      <div className="px-5 py-3 border-b-[0.5px] border-border-soft bg-soft flex justify-between items-center">
        <span className="text-eyebrow tracking-widest text-ink-3 uppercase">{title}</span>
        {subtitle ? <span className="text-tiny text-ink-3">{subtitle}</span> : null}
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
}: {
  label: string;
  value: string | null;
  bold?: boolean;
  mono?: boolean;
  note?: string;
}) {
  return (
    <div className="px-5 py-3 grid grid-cols-[100px_1fr] gap-3 items-baseline">
      <dt className="text-meta text-ink-3">{label}</dt>
      <dd
        className={`${bold ? "text-base font-medium text-ink" : "text-meta text-ink-2"} ${
          mono ? "font-mono" : ""
        }`}
      >
        {value ?? <span className="text-ink-3">—</span>}
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
