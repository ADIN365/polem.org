"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function SummaryRefreshButton({
  boardId,
  hasActiveRequest,
}: {
  boardId: string;
  hasActiveRequest: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/summary/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.status === 409) {
        toast("이미 갱신 요청이 처리 중이에요.");
      } else if (!res.ok) {
        throw new Error(data.error ?? "갱신 요청 실패");
      } else {
        toast.success("갱신 요청을 보냈어요. 잠시 후 반영됩니다.");
      }
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "갱신 요청 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy || hasActiveRequest}
      className="inline-flex items-center gap-1 px-2 py-1 -my-1 text-tiny text-[var(--paper-cream-dim)] hover:text-paper-cream hover:bg-deep rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title={hasActiveRequest ? "갱신 처리 중" : "AI 의견정리 갱신 (관리자)"}
      aria-label="AI 의견정리 갱신"
    >
      <span aria-hidden="true">🔄</span>
      <span>{hasActiveRequest ? "갱신 중…" : busy ? "요청 중…" : "갱신"}</span>
    </button>
  );
}
