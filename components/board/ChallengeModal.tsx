"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function ChallengeModal({
  pinId,
  onClose,
  onSuccess,
}: {
  pinId: string;
  onClose: () => void;
  onSuccess: (challengeCount: number) => void;
}) {
  const [body, setBody] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pins/${pinId}/challenge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), sourceUrl: sourceUrl.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "도전 등록 실패");
      onSuccess(data.challengeCount);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "도전 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

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
        className="bg-card border-[0.5px] border-border rounded-lg max-w-[520px] w-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      >
        <div className="px-7 pt-7 pb-3 text-center">
          <div
            className="font-serif font-semibold tracking-tight text-ink mb-2"
            style={{ fontSize: "var(--fs-title-h3)" }}
          >
            출처 도전
          </div>
          <p className="text-meta text-ink-3 leading-relaxed">
            도전자도 *다른 출처*를 첨부해야 합니다. 단순 다수결 X — 헌법 2.2.
          </p>
        </div>

        <div className="px-7 py-3 space-y-3">
          <label className="block">
            <span className="text-meta text-ink-2 block mb-1">도전 내용</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={800}
              required
              className="w-full px-3 py-[10px] border-[0.5px] border-border bg-card text-input text-ink rounded-md outline-none focus:border-ink resize-none"
              placeholder="이 박제의 어떤 사실관계에 동의할 수 없는지 적어주세요."
            />
          </label>
          <label className="block">
            <span className="text-meta text-ink-2 block mb-1">출처 URL (필수)</span>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              required
              placeholder="https://"
              className="w-full px-3 py-[10px] border-[0.5px] border-border bg-card text-input text-ink rounded-md outline-none focus:border-ink font-mono"
            />
          </label>
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
            disabled={submitting || body.trim().length < 10 || !sourceUrl.trim()}
            className="px-4 py-[9px] text-button bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "등록 중…" : "도전 등록"}
          </button>
        </div>
      </form>
    </div>
  );
}
