"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

type Answer = "AGREE" | "DISAGREE" | "UNSURE";

interface Pin {
  id: string;
  question: string;
}

const CHOICES: { value: Answer; label: string }[] = [
  { value: "DISAGREE", label: "반대" },
  { value: "UNSURE", label: "잘 모름" },
  { value: "AGREE", label: "동의" },
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
            답한 뒤 다음 화면에서 어떤 의제·박제였는지 보여드립니다.
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

        <div className="px-7 pb-7 grid grid-cols-3 gap-2">
          {CHOICES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => onAnswer(c.value)}
              disabled={submitting}
              className="py-[18px] text-pin tracking-wide rounded-md transition-colors disabled:opacity-50 bg-card text-ink border-[0.5px] border-border hover:bg-soft"
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
