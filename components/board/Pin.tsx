"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { formatRelativeKo } from "@/lib/format";
import ChallengeModal from "./ChallengeModal";
import CommentTree from "./CommentTree";
import ReportModal from "./ReportModal";

export interface PinData {
  id: string;
  side: "PRO" | "CON";
  body: string;
  authorNickname: string | null;
  authorId: string;
  createdAt: Date;
  endorseCount: number;
  commentCount: number;
  challengeCount: number;
  blindAgreeRatio: number | null; // 0-100, 데이터 부족 시 null
  quoted: { authorNickname: string | null; body: string } | null;
  // 현재 사용자에 대한 상태 (없으면 비로그인)
  isEndorsedByMe: boolean;
}

interface Props {
  pin: PinData;
  currentUserId: string | null;
  onQuote?: (pin: PinData) => void;
}

export function Pin({ pin, currentUserId, onQuote }: Props) {
  const isPro = pin.side === "PRO";
  const isMine = currentUserId === pin.authorId;

  const [endorsed, setEndorsed] = useState(pin.isEndorsedByMe);
  const [endorseCount, setEndorseCount] = useState(pin.endorseCount);
  const [commentCount, setCommentCount] = useState(pin.commentCount);
  const [challengeCount, setChallengeCount] = useState(pin.challengeCount);
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const onEndorse = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast("로그인이 필요해요.");
      return;
    }
    if (isMine) {
      toast("자기 의견에는 동조할 수 없어요.");
      return;
    }
    if (busy) return;
    setBusy(true);
    const next = !endorsed;
    setEndorsed(next);
    setEndorseCount((c) => c + (next ? 1 : -1));
    try {
      const res = await fetch(`/api/pins/${pin.id}/endorse`, {
        method: next ? "POST" : "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "동조 처리 실패");
      if (typeof data.endorseCount === "number") setEndorseCount(data.endorseCount);
    } catch (err) {
      // 롤백
      setEndorsed(!next);
      setEndorseCount((c) => c + (next ? -1 : 1));
      toast.error(err instanceof Error ? err.message : "동조 처리 실패");
    } finally {
      setBusy(false);
    }
  };

  const baseClasses = isPro
    ? "bg-card text-ink border-[0.5px] border-ink"
    : "bg-dark text-[var(--paper-cream)]";

  return (
    <article className={`px-4 py-[14px] mb-2 last:mb-0 rounded-md transition-colors ${baseClasses}`}>
      {pin.quoted ? <PinQuote isPro={isPro} authorNickname={pin.quoted.authorNickname} body={pin.quoted.body} /> : null}

      <div
        className="text-pin leading-relaxed mb-2 cursor-pointer select-text"
        onClick={() => setExpanded((v) => !v)}
        role="button"
        aria-expanded={expanded}
      >
        {pin.body}
      </div>

      <div
        className={[
          "flex justify-between items-center text-eyebrow-tight gap-2 flex-wrap",
          isPro ? "text-ink-3" : "text-[var(--paper-cream-dim)]",
        ].join(" ")}
      >
        <div className="flex gap-[9px] items-center flex-wrap">
          <span>@{pin.authorNickname ?? "익명"}</span>
          <span>{formatRelativeKo(pin.createdAt)}</span>
          {challengeCount > 0 ? (
            <span
              className={
                isPro
                  ? "border-[0.5px] border-ink-3 px-1 text-ink font-medium"
                  : "bg-[var(--paper-cream)] text-ink px-1 font-medium"
              }
              title="출처 반박"
            >
              ⚠ {challengeCount}
            </span>
          ) : null}
        </div>

        <div className="flex gap-[9px] items-center">
          {pin.blindAgreeRatio != null ? (
            <span
              className={[
                "font-medium",
                isPro ? "text-[var(--accent-warm)]" : "text-[var(--accent-warm-light)]",
              ].join(" ")}
              title="블라인드 답변 동의율"
            >
              블라인드 {pin.blindAgreeRatio}%
            </span>
          ) : null}

          <button
            type="button"
            onClick={onEndorse}
            disabled={busy || isMine}
            className={[
              "transition-colors",
              endorsed ? (isPro ? "text-ink font-semibold" : "text-paper-cream font-semibold") : "",
              isMine ? "opacity-40 cursor-not-allowed" : "hover:opacity-80",
            ].join(" ")}
            title={isMine ? "자기 의견에는 동조할 수 없어요" : "동조"}
            aria-pressed={endorsed}
          >
            {endorsed ? "↑●" : "↑"} {endorseCount}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            className="hover:opacity-80 transition-colors"
            title="댓글"
          >
            댓 {commentCount}
          </button>

          {!isMine ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUserId) return toast("로그인이 필요해요.");
                onQuote?.(pin);
              }}
              className="hover:opacity-80 transition-colors"
              title="이 의견을 인용해서 의견 남기기"
            >
              인용
            </button>
          ) : null}

          {!isMine ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUserId) return toast("로그인이 필요해요.");
                setShowChallenge(true);
              }}
              className="hover:opacity-80 transition-colors"
              title="출처 반박"
            >
              반박
            </button>
          ) : null}

          {!isMine ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUserId) return toast("로그인이 필요해요.");
                setShowReport(true);
              }}
              className="hover:opacity-80 transition-colors opacity-70"
              title="신고"
              aria-label="이 의견 신고"
            >
              ⋯
            </button>
          ) : null}
        </div>
      </div>

      {expanded ? (
        <div className={`mt-3 pt-3 border-t-[0.5px] ${isPro ? "border-border-soft" : "border-[#3E342B]"}`}>
          <CommentTree
            pinId={pin.id}
            isPro={isPro}
            currentUserId={currentUserId}
            onCommentAdded={() => setCommentCount((c) => c + 1)}
          />
        </div>
      ) : null}

      {showChallenge ? (
        <ChallengeModal
          pinId={pin.id}
          onClose={() => setShowChallenge(false)}
          onSuccess={(count) => {
            setChallengeCount(count);
            setShowChallenge(false);
            toast.success("반박이 등록되었어요.");
          }}
        />
      ) : null}

      {showReport ? (
        <ReportModal
          targetType="PIN"
          targetId={pin.id}
          onClose={() => setShowReport(false)}
        />
      ) : null}
    </article>
  );
}

function PinQuote({ isPro, authorNickname, body }: { isPro: boolean; authorNickname: string | null; body: string }) {
  return (
    <div
      className={[
        "px-3 py-2 mb-2 text-tiny leading-relaxed border-l-2",
        isPro
          ? "bg-soft text-ink-2 border-[var(--accent-warm)]"
          : "bg-[#3E342B] text-[var(--ink-soft)] border-[var(--accent-warm-light)]",
      ].join(" ")}
    >
      <span
        className={[
          "text-eyebrow-tight tracking-wider uppercase mr-1",
          isPro ? "text-ink-3" : "text-[var(--paper-cream-dim)]",
        ].join(" ")}
      >
        인용 ─
      </span>
      @{authorNickname ?? "익명"} · &ldquo;{body}&rdquo;
    </div>
  );
}
