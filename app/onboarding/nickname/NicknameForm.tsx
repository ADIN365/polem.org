"use client";

import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";

import { NICKNAME_REGEX } from "@/lib/validation";

export default function NicknameForm({ next = "/" }: { next?: string }) {
  const router = useRouter();
  const { update } = useSession();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = value.trim();
    if (!NICKNAME_REGEX.test(trimmed)) {
      setError("2~12자, 한글·영문·숫자·언더스코어만 사용할 수 있어요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/me/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "닉네임 설정에 실패했어요.");
        setSubmitting(false);
        return;
      }
      // 세션 새로고침해서 nickname 반영
      await update();
      toast.success("환영합니다!");
      router.push(next);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했어요.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="px-8 pb-4">
      <div className="mb-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="예: 광장의시민"
          autoFocus
          maxLength={20}
          autoComplete="off"
          className="w-full px-3 py-[10px] border-[0.5px] border-border bg-card text-ink text-input rounded-md outline-none focus:border-ink"
        />
        {error ? (
          <p className="text-tiny text-accent-warn mt-2">{error}</p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full px-4 py-[12px] text-button-large font-medium rounded-md bg-dark text-paper-cream hover:bg-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {submitting ? "저장 중…" : "다음"}
      </button>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full mt-2 px-4 py-2 text-meta text-ink-3 hover:text-ink transition-colors"
      >
        취소하고 로그아웃
      </button>
    </form>
  );
}
