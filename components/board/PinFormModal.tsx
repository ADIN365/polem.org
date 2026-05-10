"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { PIN_BODY_MAX, PIN_BODY_MIN } from "@/lib/validation";

export type PinSide = "PRO" | "CON";

export interface QuoteSource {
  id: string;
  body: string;
  authorNickname: string | null;
}

export default function PinFormModal({
  boardId,
  side,
  quoting,
  quotedRelation,
  onClose,
}: {
  boardId: string;
  side: PinSide;
  quoting: QuoteSource | null;
  quotedRelation: "AGREE" | "REBUT" | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = body.trim();
    if (trimmed.length < PIN_BODY_MIN) return;
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardId,
          // 인용·반박은 서버가 quotedRelation 으로 side 자동 결정. 신규 의견만 side 직접.
          side: quoting ? undefined : side,
          body: trimmed,
          quotedPinId: quoting?.id ?? null,
          quotedRelation: quoting ? quotedRelation : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "의견 등록 실패");
      toast.success("의견이 등록됐어요.");
      onClose();
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "의견 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  const isPro = side === "PRO";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[90] bg-[rgba(43,38,32,0.45)] flex items-center justify-center p-5"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border-[0.5px] border-border rounded-lg max-w-[560px] w-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      >
        <div className="px-7 pt-7 pb-3 text-center">
          <div
            className="font-serif font-semibold tracking-tight text-ink mb-2"
            style={{ fontSize: "var(--fs-title-h3)" }}
          >
            {quoting
              ? quotedRelation === "AGREE"
                ? "동의 의견 남기기"
                : "반박 의견 남기기"
              : isPro
                ? "찬성 의견 남기기"
                : "반대 의견 남기기"}
          </div>
          <p className="text-meta text-ink-3 leading-relaxed">
            {quoting
              ? quotedRelation === "AGREE"
                ? `이 의견과 같은 ${isPro ? "찬성" : "반대"} 입장으로 등록됩니다.`
                : `이 의견과 반대 ${isPro ? "찬성" : "반대"} 입장으로 등록됩니다.`
              : "등록 후 수정·삭제는 모더레이션 대상에 한해 가능합니다."}
          </p>
        </div>

        {quoting ? (
          <div className="mx-7 mb-3 px-3 py-2 bg-soft border-l-2 border-[var(--accent-warm)] text-tiny text-ink-2 leading-relaxed">
            <span className="text-eyebrow-tight tracking-wider uppercase mr-1 text-ink-3">
              {quotedRelation === "AGREE" ? "동의" : "반박"} ─
            </span>
            @{quoting.authorNickname ?? "익명"} · &ldquo;{quoting.body}&rdquo;
          </div>
        ) : null}

        <div className="px-7 py-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            maxLength={PIN_BODY_MAX}
            required
            autoFocus
            placeholder={
              isPro
                ? "찬성하는 입장과 근거를 적어주세요."
                : "반대하는 입장과 근거를 적어주세요."
            }
            className="w-full px-3 py-[10px] border-[0.5px] border-border bg-card text-input text-ink rounded-md outline-none focus:border-ink resize-none"
          />
          <div className="flex justify-between text-tiny text-ink-3 mt-1">
            <span>{PIN_BODY_MIN}~{PIN_BODY_MAX}자</span>
            <span>{body.trim().length} / {PIN_BODY_MAX}</span>
          </div>
        </div>

        <div className="px-7 py-4 bg-soft border-t-[0.5px] border-border-soft flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-[9px] text-button text-ink-2 hover:text-ink border-[0.5px] border-border-soft rounded-md transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={submitting || body.trim().length < PIN_BODY_MIN}
            className={[
              "px-5 py-[9px] text-button rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium",
              isPro
                ? "bg-card text-ink border-[0.5px] border-ink hover:bg-soft"
                : "bg-dark text-paper-cream hover:bg-deep",
            ].join(" ")}
          >
            {submitting ? "등록 중…" : isPro ? "＋ 찬성 의견" : "＋ 반대 의견"}
          </button>
        </div>
      </form>
    </div>
  );
}
