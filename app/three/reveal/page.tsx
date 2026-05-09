import Link from "next/link";

import { CATEGORY_LABEL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireOnboarded } from "@/lib/session";

export const metadata = { title: "정체 공개" };
export const dynamic = "force-dynamic";

const SINCE_MS = 5 * 60 * 1000; // 최근 5분 안 답변

export default async function RevealPage() {
  const session = await requireOnboarded("/three/reveal");

  const recent = await prisma.blindAnswer.findMany({
    where: {
      userId: session.user.id,
      createdAt: { gte: new Date(Date.now() - SINCE_MS) },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
    select: {
      answer: true,
      createdAt: true,
      pin: {
        select: {
          id: true,
          side: true,
          body: true,
          blindQuestion: true,
          board: { select: { id: true, title: true, category: true } },
        },
      },
    },
  });

  return (
    <div className="max-w-narrow mx-auto px-6 pt-10 pb-20">
      <div className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden max-w-[680px] mx-auto">
        <div className="px-7 pt-7 pb-3">
          <div
            className="font-serif font-semibold tracking-tight text-ink mb-1"
            style={{ fontSize: "var(--fs-title-h3)" }}
          >
            정체 공개
          </div>
          <p className="text-meta text-ink-3 leading-relaxed">
            방금 답하신 질문의 원본 토론 주제·의견 입니다. 본인만 볼 수 있어요.
          </p>
        </div>

        {recent.length === 0 ? (
          <div className="px-7 py-10 text-center text-meta text-ink-3">
            방금 답한 기록을 찾을 수 없어요.{" "}
            <Link href="/three" className="underline">
              오늘의 3문항으로
            </Link>
          </div>
        ) : (
          <ul>
            {recent.map((r, i) => {
              const aligned = isAligned(r.answer, r.pin.side);
              return (
                <li
                  key={r.pin.id + i}
                  className="px-7 py-5 border-t-[0.5px] border-border-soft"
                >
                  <div className="flex gap-2 items-baseline mb-2 text-eyebrow-tight tracking-wider text-ink-3 uppercase">
                    <span>{CATEGORY_LABEL[r.pin.board.category] ?? r.pin.board.category}</span>
                    <span>·</span>
                    <span>{r.pin.side === "PRO" ? "찬성 의견" : "반대 의견"}</span>
                  </div>

                  <Link
                    href={`/boards/${r.pin.board.id}`}
                    className="block text-base text-ink font-medium tracking-tight mb-2 hover:underline"
                  >
                    {r.pin.board.title}
                  </Link>

                  <div className="text-meta text-ink-2 leading-relaxed mb-3 px-3 py-2 bg-soft border-l-2 border-border-soft">
                    {r.pin.body}
                  </div>

                  <div className="flex gap-2 items-baseline text-tiny">
                    <span className="text-ink-3">블라인드 질문에 내 답변:</span>
                    <span className="font-medium text-ink">{labelAnswer(r.answer)}</span>
                    <StatusTag aligned={aligned} unsure={r.answer === "UNSURE"} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="px-7 py-5 border-t border-border bg-soft flex flex-wrap gap-2 justify-end">
          <Link
            href="/me"
            className="px-4 py-[9px] text-button bg-card text-ink border-[0.5px] border-border-soft hover:border-border rounded-md transition-colors"
          >
            내 정보
          </Link>
          <Link
            href="/"
            className="px-4 py-[9px] text-button bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors"
          >
            토론 주제로
          </Link>
        </div>
      </div>

      <p className="text-tiny text-ink-3 mt-3 text-center leading-relaxed">
        이 결과는 본인에게만 보입니다.
      </p>
    </div>
  );
}

function labelAnswer(a: "AGREE" | "DISAGREE" | "UNSURE") {
  if (a === "AGREE") return "동의";
  if (a === "DISAGREE") return "반대";
  return "잘 모름";
}

function isAligned(answer: "AGREE" | "DISAGREE" | "UNSURE", side: "PRO" | "CON") {
  if (answer === "AGREE") return side === "PRO";
  if (answer === "DISAGREE") return side === "CON";
  return null;
}

function StatusTag({ aligned, unsure }: { aligned: boolean | null; unsure: boolean }) {
  if (unsure) return null;
  if (aligned)
    return (
      <span className="ml-1 px-[6px] py-[1px] text-eyebrow-tight tracking-wide bg-ink text-paper-cream">
        입장 일치
      </span>
    );
  return (
    <span className="ml-1 px-[6px] py-[1px] text-eyebrow-tight tracking-wide border-[0.5px] border-[var(--accent-warn)] text-[var(--accent-warn)]">
      살펴볼 만함
    </span>
  );
}
