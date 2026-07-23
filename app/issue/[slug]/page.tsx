import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { argList, getIssueBySlug, getVisibleComments } from "@/lib/issues";
import { categoryMeta } from "@/lib/categories";
import { currentVoterHash } from "@/lib/anon";
import VoteBox from "@/components/VoteBox";
import Comments from "@/components/Comments";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const issue = await getIssueBySlug(params.slug);
  if (!issue) return {};
  return {
    title: issue.title,
    description: issue.summary ?? issue.question,
    openGraph: {
      title: issue.title,
      description: issue.summary ?? issue.question,
      url: `/issue/${issue.slug}`,
      type: "article",
    },
  };
}

export default async function IssuePage({ params }: { params: { slug: string } }) {
  const issue = await getIssueBySlug(params.slug);
  if (!issue || issue.status !== "PUBLISHED") notFound();

  const cat = categoryMeta(issue.category);
  const proArgs = argList(issue.proArgs);
  const conArgs = argList(issue.conArgs);
  const comments = await getVisibleComments(issue.id);

  // 조회수 증가 (fire-and-forget, 렌더 블로킹 안 함)
  prisma.issue
    .update({ where: { id: issue.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  // 이미 투표했는지 — 투표했으면 결과를 먼저 보여줌
  const voterHash = currentVoterHash();
  let myVote: "PRO" | "CON" | null = null;
  if (voterHash) {
    const v = await prisma.vote.findUnique({
      where: { issueId_voterHash: { issueId: issue.id, voterHash } },
      select: { side: true },
    });
    myVote = (v?.side as "PRO" | "CON" | undefined) ?? null;
  }

  return (
    <article className="max-w-narrow mx-auto px-6 py-10">
      <nav className="text-tiny text-ink-3 mb-4">
        <Link href="/" className="hover:text-ink">홈</Link>
        <span className="mx-1.5">·</span>
        <Link href={`/c/${cat.slug}`} className="hover:text-ink">{cat.emoji} {cat.label}</Link>
      </nav>

      <h1 className="font-serif font-bold text-ink leading-tight mb-4" style={{ fontSize: "var(--fs-title-h1)" }}>
        {issue.question}
      </h1>

      {issue.body ? (
        <p className="text-ink-2 leading-relaxed mb-8 whitespace-pre-line">{issue.body}</p>
      ) : null}

      {/* 투표 위젯 — 접힌 결과/투표 */}
      <div className="mb-10">
        <VoteBox
          slug={issue.slug}
          proLabel={issue.proLabel}
          conLabel={issue.conLabel}
          initialPro={issue.proVotes}
          initialCon={issue.conVotes}
          initialVote={myVote}
        />
      </div>

      {/* 찬반 근거 — 좌우 대칭 */}
      <div className="grid gap-6 md:grid-cols-2 mb-10">
        <section className="bg-card border-[0.5px] border-border rounded-lg p-5">
          <h2 className="font-serif font-semibold text-pro mb-3" style={{ fontSize: "var(--fs-title-h4)" }}>
            {issue.proLabel} 근거
          </h2>
          <ul className="space-y-3">
            {proArgs.map((a, i) => (
              <li key={i} className="text-small text-ink-2 leading-relaxed flex gap-2">
                <span className="text-pro font-semibold flex-shrink-0">{i + 1}.</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-card border-[0.5px] border-border rounded-lg p-5">
          <h2 className="font-serif font-semibold text-con mb-3" style={{ fontSize: "var(--fs-title-h4)" }}>
            {issue.conLabel} 근거
          </h2>
          <ul className="space-y-3">
            {conArgs.map((a, i) => (
              <li key={i} className="text-small text-ink-2 leading-relaxed flex gap-2">
                <span className="text-con font-semibold flex-shrink-0">{i + 1}.</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {issue.aiBalance ? (
        <section className="bg-soft border-[0.5px] border-border-soft rounded-lg p-5 mb-8">
          <h2 className="text-tiny text-ink-3 mb-2 tracking-wide">균형 요약</h2>
          <p className="text-small text-ink-2 leading-relaxed">{issue.aiBalance}</p>
        </section>
      ) : null}

      <p className="text-tiny text-ink-4 text-center">
        근거 정리는 참고용이며 특정 입장을 지지하지 않습니다.
      </p>

      <Comments
        slug={issue.slug}
        proLabel={issue.proLabel}
        conLabel={issue.conLabel}
        initial={comments}
      />
    </article>
  );
}
