"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";

import { LIKERT_SCALE, type LikertQuestion } from "@/lib/likert/questions";

interface Props {
  questions: LikertQuestion[];
  next: string;
}

export default function LikertRunner({ questions, next }: Props) {
  const router = useRouter();
  const { update } = useSession();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const total = questions.length;
  const current = questions[index];
  const progressDone = Object.keys(answers).length;

  const submit = async (final: Record<string, number>) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/likert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: final }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");
      await update();
      toast.success("측정 완료. 4축 좌표가 내 정보에 표시됩니다.");
      router.push(next);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
      setSubmitting(false);
    }
  };

  const onAnswer = (value: number) => {
    const updated = { ...answers, [current.id]: value };
    setAnswers(updated);
    if (index + 1 < total) {
      // 약간의 지연으로 사용자에게 선택 피드백 시간을 줌
      setTimeout(() => setIndex(index + 1), 120);
    } else {
      void submit(updated);
    }
  };

  const onBack = () => {
    if (index === 0) return;
    setIndex(index - 1);
  };

  return (
    <div className="max-w-narrow mx-auto px-6 pt-12 pb-20">
      <div className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden max-w-[620px] mx-auto">
        <div className="px-5 py-3 border-b border-border flex justify-between items-center">
          <span className="text-eyebrow tracking-widest text-ink-3 uppercase">가치관 4축 측정</span>
          <span className="text-tiny text-ink-3 font-mono">
            {index + 1} / {total}
          </span>
        </div>

        <div className="px-6 py-3 border-b-[0.5px] border-border-soft bg-soft">
          <div className="flex justify-between items-center mb-2 text-tiny text-ink-2">
            <span>완료 {progressDone} / {total}</span>
            <button
              type="button"
              onClick={onBack}
              disabled={index === 0 || submitting}
              className="text-ink-3 hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← 이전
            </button>
          </div>
          <div className="flex gap-1 h-1">
            {questions.map((q, i) => (
              <div
                key={q.id}
                className={[
                  "flex-1 transition-colors",
                  answers[q.id] !== undefined ? "bg-ink" : i === index ? "bg-ink-3" : "bg-border-soft",
                ].join(" ")}
              />
            ))}
          </div>
        </div>

        <div className="px-9 py-12 text-center">
          <div className="text-eyebrow tracking-widest text-ink-3 uppercase mb-5">질문 {index + 1}</div>
          <p
            className="font-serif font-medium text-ink leading-relaxed tracking-tight max-w-[480px] mx-auto"
            style={{ fontSize: "var(--fs-question)" }}
          >
            {current.text}
          </p>
        </div>

        <div className="px-7 pb-6 grid grid-cols-5 gap-2">
          {LIKERT_SCALE.map((s) => {
            const selected = answers[current.id] === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => onAnswer(s.value)}
                disabled={submitting}
                className={[
                  "py-[18px] text-pin tracking-wide rounded-md transition-colors disabled:opacity-50",
                  selected
                    ? "bg-dark text-paper-cream"
                    : "bg-card text-ink border-[0.5px] border-border hover:bg-soft",
                ].join(" ")}
                aria-pressed={selected}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        <div className="px-6 py-3 border-t-[0.5px] border-border-soft bg-soft text-tiny text-ink-3 text-center">
          답을 누르면 자동으로 다음 문항. 마지막 답에서 자동 저장됩니다.
        </div>
      </div>
    </div>
  );
}
