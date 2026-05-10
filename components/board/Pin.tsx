"use client";

import { useState } from "react";
import toast from "react-hot-toast";

import { formatRelativeKo } from "@/lib/format";
import ReportModal from "./ReportModal";

export interface PinData {
  id: string;
  side: "PRO" | "CON";
  body: string;
  authorNickname: string | null;
  authorId: string;
  createdAt: Date;
  endorseCount: number;
  quoteAgreeCount: number;
  quoteRebutCount: number;
  blindAgreeRatio: number | null; // 0-100, 데이터 부족 시 null
  quoted: { authorNickname: string | null; body: string; relation: "AGREE" | "REBUT" } | null;
  // 현재 사용자에 대한 상태 (없으면 비로그인)
  isEndorsedByMe: boolean;
}

interface Props {
  pin: PinData;
  currentUserId: string | null;
  onQuote?: (pin: PinData, relation: "AGREE" | "REBUT") => void;
}

export function Pin({ pin, currentUserId, onQuote }: Props) {
  const isPro = pin.side === "PRO";
  const isMine = currentUserId === pin.authorId;

  const [endorsed, setEndorsed] = useState(pin.isEndorsedByMe);
  const [endorseCount, setEndorseCount] = useState(pin.endorseCount);
  const [busy, setBusy] = useState(false);
  const [showReport, setShowReport] = useState(false);

  const onEndorse = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUserId) {
      toast("로그인이 필요해요.");
      return;
    }
    if (isMine) {
      toast("자기 의견에는 옳소를 보낼 수 없어요.");
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
      if (!res.ok) throw new Error(data.error ?? "옳소 처리 실패");
      if (typeof data.endorseCount === "number") setEndorseCount(data.endorseCount);
    } catch (err) {
      setEndorsed(!next);
      setEndorseCount((c) => c + (next ? -1 : 1));
      toast.error(err instanceof Error ? err.message : "옳소 처리 실패");
    } finally {
      setBusy(false);
    }
  };

  const baseClasses = isPro
    ? "bg-card text-ink border-[0.5px] border-ink"
    : "bg-dark text-[var(--paper-cream)]";

  return (
    <article className={`px-4 py-[14px] mb-2 last:mb-0 rounded-md transition-colors ${baseClasses}`}>
      {pin.quoted ? (
        <PinQuote
          isPro={isPro}
          authorNickname={pin.quoted.authorNickname}
          body={pin.quoted.body}
          relation={pin.quoted.relation}
        />
      ) : null}

      <div className="text-pin leading-relaxed mb-2 select-text">{pin.body}</div>

      <div
        className={[
          "flex justify-between items-center text-eyebrow-tight gap-2 flex-wrap",
          isPro ? "text-ink-3" : "text-[var(--paper-cream-dim)]",
        ].join(" ")}
      >
        <div className="flex gap-[9px] items-center flex-wrap">
          <span>@{pin.authorNickname ?? "익명"}</span>
          <span>{formatRelativeKo(pin.createdAt)}</span>
          {!isMine ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUserId) return toast("로그인이 필요해요.");
                setShowReport(true);
              }}
              className="inline-flex items-center opacity-50 hover:opacity-100 transition-opacity"
              title="신고"
              aria-label="이 의견 신고"
            >
              <SirenIcon />
            </button>
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
            title={isMine ? "자기 의견에는 옳소를 보낼 수 없어요" : "옳소 — 이 의견에 동의 표시"}
            aria-pressed={endorsed}
          >
            {endorsed ? "↑●" : "↑"} 옳소 {endorseCount}
          </button>

          {!isMine ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUserId) return toast("로그인이 필요해요.");
                onQuote?.(pin, "AGREE");
              }}
              className="hover:opacity-80 transition-colors"
              title="이 의견에 동의하는 의견 남기기"
            >
              인용 {pin.quoteAgreeCount}
            </button>
          ) : (
            <span className="opacity-50">인용 {pin.quoteAgreeCount}</span>
          )}

          {!isMine ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!currentUserId) return toast("로그인이 필요해요.");
                onQuote?.(pin, "REBUT");
              }}
              className="hover:opacity-80 transition-colors"
              title="이 의견에 반박하는 의견 남기기"
            >
              반박 {pin.quoteRebutCount}
            </button>
          ) : (
            <span className="opacity-50">반박 {pin.quoteRebutCount}</span>
          )}

        </div>
      </div>

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

function SirenIcon() {
  // 미니멀 흑백 사이렌 (lucide siren 단순화). 12x12.
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M7 18a5 5 0 0 1 10 0" />
      <path d="M5 21h14" />
      <path d="M5 21v-3a7 7 0 0 1 14 0v3" />
      <path d="M12 6V3" />
      <circle cx="12" cy="6" r="1" />
    </svg>
  );
}

function PinQuote({
  isPro,
  authorNickname,
  body,
  relation,
}: {
  isPro: boolean;
  authorNickname: string | null;
  body: string;
  relation: "AGREE" | "REBUT";
}) {
  const label = relation === "AGREE" ? "동의" : "반박";
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
        {label} ─
      </span>
      @{authorNickname ?? "익명"} · &ldquo;{body}&rdquo;
    </div>
  );
}
