import Link from "next/link";
import { notFound } from "next/navigation";

import { formatRelativeKo } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface Props {
  params: { nickname: string };
}

export async function generateMetadata({ params }: Props) {
  const nickname = decodeURIComponent(params.nickname);
  return { title: `@${nickname}` };
}

export default async function PublicProfilePage({ params }: Props) {
  // Next.js 14.2 한글 dynamic param 자동 decode 안 함
  const nickname = decodeURIComponent(params.nickname);

  const user = await prisma.user.findFirst({
    where: { nickname },
    select: {
      id: true,
      nickname: true,
      createdAt: true,
      aiCitationCount: true,
      banned: true,
    },
  });
  if (!user || user.banned) notFound();

  const [pinCount, recentCitations] = await Promise.all([
    prisma.pin.count({
      where: { authorId: user.id, hidden: false, deleted: false },
    }),
    prisma.aISummaryCitation.findMany({
      where: { pin: { authorId: user.id } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        side: true,
        boardId: true,
        board: { select: { title: true } },
        pin: { select: { body: true } },
      },
    }),
  ]);

  return (
    <div className="max-w-narrow mx-auto px-6 pt-12 pb-20 space-y-6">
      <header>
        <h1
          className="font-serif font-semibold tracking-tight text-ink m-0"
          style={{ fontSize: "var(--fs-title-h1)" }}
        >
          @{user.nickname}
        </h1>
        <p className="text-meta text-ink-3 mt-1">
          가입 {formatRelativeKo(user.createdAt)}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="작성한 의견" value={pinCount} unit="개" />
        <Stat label="AI 의견정리 인용" value={user.aiCitationCount} unit="회" highlight />
      </div>

      <Section title="AI 의견정리에 인용된 의견" subtitle={recentCitations.length === 0 ? "아직 인용된 의견이 없어요." : undefined}>
        {recentCitations.length > 0 ? (
          <ul>
            {recentCitations.map((c, i) => (
              <li
                key={i}
                className="px-5 py-3 border-b-[0.5px] border-border-soft last:border-b-0"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-eyebrow-tight tracking-wider uppercase text-ink-3 mb-1">
                      {c.side === "PRO" ? "찬성 요약" : "반대 요약"}
                    </div>
                    <div className="text-meta text-ink truncate">{c.board.title}</div>
                    <div className="text-tiny text-ink-3 mt-1 line-clamp-2">
                      “{c.pin.body}”
                    </div>
                  </div>
                  <Link
                    href={`/boards/${c.boardId}`}
                    className="text-tiny text-ink underline shrink-0"
                  >
                    게시판 →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Section>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  highlight = false,
}: {
  label: string;
  value: number;
  unit: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "px-4 py-3 rounded-md border-[0.5px]",
        highlight ? "bg-dark text-paper-cream border-dark" : "bg-card border-border",
      ].join(" ")}
    >
      <div
        className={[
          "text-eyebrow-tight tracking-wider uppercase mb-1",
          highlight ? "text-[var(--paper-cream-dim)]" : "text-ink-3",
        ].join(" ")}
      >
        {label}
      </div>
      <div className="text-2xl font-semibold tabular-nums">
        {value}
        <span className="text-meta font-medium ml-1 opacity-70">{unit}</span>
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
    <section className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden">
      <div className="px-5 py-3 border-b-[0.5px] border-border-soft">
        <h2 className="text-meta font-semibold text-ink m-0">{title}</h2>
        {subtitle ? (
          <p className="text-tiny text-ink-3 mt-1">{subtitle}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
