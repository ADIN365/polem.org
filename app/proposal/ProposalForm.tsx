"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

import { PROPOSAL_BODY_MAX, PROPOSAL_TITLE_MAX } from "@/lib/validation";

export default function ProposalForm() {
  const router = useRouter();
  const [rawTitle, setRawTitle] = useState("");
  const [rawBody, setRawBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = rawTitle.trim();
    if (t.length < 5) {
      toast.error("발제 제목을 5자 이상 적어주세요.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawTitle: t, rawBody: rawBody.trim() || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "제출 실패");
      toast.success("검토 요청됐어요. 결과는 알림으로 알려드릴게요.");
      router.push("/me");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "제출 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden">
      <div className="px-6 py-5 space-y-4">
        <label className="block">
          <span className="text-meta text-ink-2 block mb-[6px]">발제 제목</span>
          <input
            type="text"
            value={rawTitle}
            onChange={(e) => setRawTitle(e.target.value)}
            maxLength={PROPOSAL_TITLE_MAX}
            placeholder="예: 다주택자 보유세 강화에 찬성하십니까?"
            className="w-full px-3 py-[10px] border-[0.5px] border-border bg-card text-input text-ink rounded-md outline-none focus:border-ink"
            required
          />
          <div className="text-tiny text-ink-3 mt-1 text-right">
            {rawTitle.trim().length} / {PROPOSAL_TITLE_MAX}
          </div>
        </label>

        <label className="block">
          <span className="text-meta text-ink-2 block mb-[6px]">
            배경 설명 <span className="text-ink-3 text-tiny ml-1">선택</span>
          </span>
          <textarea
            value={rawBody}
            onChange={(e) => setRawBody(e.target.value)}
            rows={6}
            maxLength={PROPOSAL_BODY_MAX}
            placeholder="이 의제가 왜 필요한지·어떤 맥락인지 짧게 적어주세요. 토론 시작점에 도움이 됩니다."
            className="w-full px-3 py-[10px] border-[0.5px] border-border bg-card text-input text-ink rounded-md outline-none focus:border-ink resize-none leading-relaxed"
          />
          <div className="text-tiny text-ink-3 mt-1 text-right">
            {rawBody.trim().length} / {PROPOSAL_BODY_MAX}
          </div>
        </label>
      </div>

      <div className="px-6 py-4 border-t border-border bg-soft flex justify-end gap-2">
        <button
          type="submit"
          disabled={submitting || rawTitle.trim().length < 5}
          className="px-5 py-[11px] text-button-large bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {submitting ? "보내는 중…" : "검토 요청 보내기"}
        </button>
      </div>
    </form>
  );
}
