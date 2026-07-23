"use client";

import { useState } from "react";
import ResultBar from "./ResultBar";

interface Props {
  slug: string;
  proLabel: string;
  conLabel: string;
  initialPro: number;
  initialCon: number;
  initialVote: "PRO" | "CON" | null; // 이미 투표했으면 결과 먼저 보여줌
}

export default function VoteBox({
  slug,
  proLabel,
  conLabel,
  initialPro,
  initialCon,
  initialVote,
}: Props) {
  const [pro, setPro] = useState(initialPro);
  const [con, setCon] = useState(initialCon);
  const [voted, setVoted] = useState<"PRO" | "CON" | null>(initialVote);
  const [pending, setPending] = useState<"PRO" | "CON" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function vote(side: "PRO" | "CON") {
    if (voted || pending) return;
    setPending(side);
    setError(null);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, side }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "투표에 실패했습니다");
      setPro(data.proVotes);
      setCon(data.conVotes);
      setVoted(data.side ?? side);
    } catch (e) {
      setError(e instanceof Error ? e.message : "투표에 실패했습니다");
    } finally {
      setPending(null);
    }
  }

  if (voted) {
    return (
      <div className="bg-card border-[0.5px] border-border rounded-lg p-6">
        <div className="text-small text-ink-3 mb-4 text-center">
          당신의 선택:{" "}
          <span className={`font-semibold ${voted === "PRO" ? "text-pro" : "text-con"}`}>
            {voted === "PRO" ? proLabel : conLabel}
          </span>
        </div>
        <ResultBar
          proLabel={proLabel}
          conLabel={conLabel}
          proVotes={pro}
          conVotes={con}
          highlight={voted}
        />
        <ShareRow slug={slug} />
      </div>
    );
  }

  return (
    <div className="bg-card border-[0.5px] border-border rounded-lg p-6">
      <p className="text-center text-small text-ink-2 mb-4">
        당신의 생각은? <span className="text-ink-4">· 익명, 로그인 필요 없음</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => vote("PRO")}
          disabled={!!pending}
          className="py-4 rounded-lg border-[1.5px] border-pro/40 bg-pro/5 text-pro font-semibold hover:bg-pro/10 active:scale-[0.98] transition disabled:opacity-50"
        >
          {pending === "PRO" ? "..." : proLabel}
        </button>
        <button
          onClick={() => vote("CON")}
          disabled={!!pending}
          className="py-4 rounded-lg border-[1.5px] border-con/40 bg-con/5 text-con font-semibold hover:bg-con/10 active:scale-[0.98] transition disabled:opacity-50"
        >
          {pending === "CON" ? "..." : conLabel}
        </button>
      </div>
      {error ? <p className="text-tiny text-con mt-3 text-center">{error}</p> : null}
      <p className="text-tiny text-ink-4 mt-3 text-center">
        투표하면 전체 분포가 공개됩니다
      </p>
    </div>
  );
}

function ShareRow({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `https://polem.org/issue/${slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* 사용자가 취소 — 무시 */
    }
  }
  return (
    <button
      onClick={share}
      className="mt-5 w-full py-2.5 text-small text-ink-2 border-[0.5px] border-border rounded-lg hover:bg-soft transition-colors"
    >
      {copied ? "링크 복사됨 ✓" : "친구는 어느 쪽일까? 공유하기"}
    </button>
  );
}
