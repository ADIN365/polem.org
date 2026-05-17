"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type Answer =
  | "STRONGLY_DISAGREE"
  | "DISAGREE"
  | "SLIGHTLY_DISAGREE"
  | "SLIGHTLY_AGREE"
  | "AGREE"
  | "STRONGLY_AGREE";

interface Pin {
  id: string;
  question: string;
}

const CHOICES: { value: Answer; label: string; tone: "con" | "pro" }[] = [
  { value: "STRONGLY_DISAGREE", label: "매우 반대", tone: "con" },
  { value: "DISAGREE", label: "반대", tone: "con" },
  { value: "SLIGHTLY_DISAGREE", label: "약간 반대", tone: "con" },
  { value: "SLIGHTLY_AGREE", label: "약간 동의", tone: "pro" },
  { value: "AGREE", label: "동의", tone: "pro" },
  { value: "STRONGLY_AGREE", label: "매우 동의", tone: "pro" },
];

export default function ThreeRunner({ pins }: { pins: Pin[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const total = pins.length;
  const current = pins[index];

  const onAnswer = async (answer: Answer) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/three/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinId: current.id, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");

      if (index + 1 < total) {
        setIndex(index + 1);
        setSubmitting(false);
      } else {
        // 마지막 답변 — reveal 페이지로
        toast.success("답변 완료");
        router.push("/three/reveal");
        router.refresh();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "저장 실패");
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-narrow mx-auto px-6 pt-12 pb-20">
      <div className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden max-w-[620px] mx-auto">
        <div className="px-5 py-3 border-b border-border flex justify-between items-center">
          <span className="text-eyebrow tracking-widest text-ink-3 uppercase">오늘의 3문항</span>
          <span className="text-tiny text-ink-3 font-mono">
            {index + 1} / {total}
          </span>
        </div>

        <div className="px-5 pt-3 pb-3 border-b-[0.5px] border-border-soft bg-soft">
          <div className="flex gap-1 h-1">
            {pins.map((p, i) => (
              <div
                key={p.id}
                className={[
                  "flex-1 transition-colors",
                  i < index ? "bg-ink" : i === index ? "bg-ink-3" : "bg-border-soft",
                ].join(" ")}
              />
            ))}
          </div>
          <p className="text-tiny text-ink-3 mt-2 leading-relaxed">
            답한 뒤 다음 화면에서 어떤 토론 주제·의견였는지 보여드립니다.
          </p>
        </div>

        <div className="px-9 py-12 text-center">
          <p
            className="font-serif font-medium text-ink leading-relaxed tracking-tight max-w-[480px] mx-auto"
            style={{ fontSize: "var(--fs-question)" }}
          >
            {current.question}
          </p>
        </div>

        <div className="px-7 pb-7 grid grid-cols-3 md:grid-cols-6 gap-2">
          {CHOICES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onAnswer(c.value)}
              disabled={submitting}
              className={[
                "py-[14px] px-1 text-meta md:text-pin tracking-wide rounded-md transition-colors disabled:opacity-50 border-[0.5px] border-border",
                c.tone === "con"
                  ? "bg-paper-cream text-ink hover:bg-card"
                  : "bg-card text-ink hover:bg-paper-cream",
              ].join(" ")}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
