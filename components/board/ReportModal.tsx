"use client";

import { useState } from "react";
import toast from "react-hot-toast";

const BASE_REASONS = [
  { value: "PERSONAL_ATTACK", label: "인신공격", hint: "사람 자체를 비하 (주장 비판은 OK)" },
  { value: "HATE_SPEECH", label: "혐오·차별 표현" },
  { value: "AD_SPAM", label: "광고·스팸" },
  { value: "FALSE_INFO", label: "허위사실" },
] as const;

const PIN_ONLY_REASONS = [
  {
    value: "MISCLASSIFIED_SIDE",
    label: "진영 분류 오류",
    hint: "찬성에 반대 의견·반대에 찬성 의견으로 등록됨",
  },
] as const;

const OTHER_REASON = [{ value: "OTHER", label: "기타" }] as const;

type Reason =
  | (typeof BASE_REASONS)[number]["value"]
  | (typeof PIN_ONLY_REASONS)[number]["value"]
  | (typeof OTHER_REASON)[number]["value"];

export default function ReportModal({
  targetType,
  targetId,
  onClose,
}: {
  targetType: "PIN" | "COMMENT" | "USER";
  targetId: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<Reason | null>(null);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reasons = [
    ...BASE_REASONS,
    ...(targetType === "PIN" ? PIN_ONLY_REASONS : []),
    ...OTHER_REASON,
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          body: body.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "신고 실패");
      toast.success("신고 접수됐어요. 검토 후 알림으로 결과 알려드릴게요.");
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "신고 실패");
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
        className="bg-card border-[0.5px] border-border rounded-lg max-w-[500px] w-full overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.18)]"
      >
        <div className="px-7 pt-7 pb-3">
          <div
            className="font-serif font-semibold tracking-tight text-ink mb-2"
            style={{ fontSize: "var(--fs-title-h3)" }}
          >
            신고
          </div>
          <p className="text-meta text-ink-3 leading-relaxed">
            주장 비판은 신고 대상이 아닙니다. 사람·집단을 향한 공격·혐오·광고만 처리합니다.
          </p>
        </div>

        <div className="px-7 pb-3 space-y-1">
          {reasons.map((r) => (
            <label
              key={r.value}
              className={[
                "flex gap-3 items-start px-3 py-[10px] border-[0.5px] rounded-md cursor-pointer transition-colors",
                reason === r.value ? "border-ink bg-soft" : "border-border-soft hover:bg-soft",
              ].join(" ")}
            >
              <input
                type="radio"
                name="reason"
                value={r.value}
                checked={reason === r.value}
                onChange={() => setReason(r.value)}
                className="mt-[3px]"
              />
              <span className="flex-1">
                <span className="block text-meta text-ink font-medium">{r.label}</span>
                {"hint" in r && r.hint ? (
                  <span className="block text-tiny text-ink-3 mt-[2px]">{r.hint}</span>
                ) : null}
              </span>
            </label>
          ))}
        </div>

        <div className="px-7 pb-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={800}
            placeholder="추가 설명 (선택)"
            className="w-full px-3 py-[8px] border-[0.5px] border-border bg-card text-input text-ink rounded-md outline-none focus:border-ink resize-none"
          />
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
            disabled={!reason || submitting}
            className="px-4 py-[9px] text-button bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "보내는 중…" : "신고 보내기"}
          </button>
        </div>
      </form>
    </div>
  );
}
