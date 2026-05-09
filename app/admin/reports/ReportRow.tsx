"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  id: string;
  targetType: "PIN" | "COMMENT" | "USER";
  targetId: string;
  reason: string;
  body: string | null;
  createdAt: string;
  reporter: string | null;
  pinSnippet: string | null;
  author: { id: string; nickname: string | null; name: string | null; warningCount: number; banned: boolean } | null;
  boardTitle: string | null;
  boardId: string | null;
}

export default function ReportRow({
  id,
  targetType,
  reason,
  body,
  createdAt,
  reporter,
  pinSnippet,
  author,
  boardTitle,
  boardId,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const action = async (
    payload:
      | { action: "resolve"; sanction: "WARN" | "SUSPEND_7D" | "BAN"; hideContent: boolean }
      | { action: "dismiss" },
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "처리 실패");
      toast.success(payload.action === "dismiss" ? "기각 처리 완료" : "처리 완료");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "처리 실패");
      setBusy(false);
    }
  };

  return (
    <li className="border-[0.5px] border-border rounded-md bg-card px-5 py-4">
      <div className="flex justify-between items-baseline mb-2 text-eyebrow-tight text-ink-3">
        <span>
          @{reporter ?? "익명"} · {createdAt} · 사유 *{reason}*
        </span>
        <span className="font-mono">{targetType}</span>
      </div>

      {boardTitle && boardId ? (
        <Link
          href={`/boards/${boardId}`}
          className="block text-meta text-ink hover:underline mb-2"
        >
          {boardTitle}
        </Link>
      ) : null}

      {pinSnippet ? (
        <div className="px-3 py-2 mb-2 bg-soft border-l-2 border-border-soft text-meta text-ink-2 leading-relaxed">
          {pinSnippet}
        </div>
      ) : null}

      {body ? (
        <div className="text-meta text-ink-3 mb-2">
          <span className="text-eyebrow-tight uppercase mr-1">신고자 메모</span>
          {body}
        </div>
      ) : null}

      {author ? (
        <div className="text-tiny text-ink-3 mb-3">
          위반자: @{author.nickname ?? author.name} · 누적 위반 {author.warningCount}
          {author.banned ? " · 영구 정지 상태" : ""}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 justify-end">
        <button
          type="button"
          disabled={busy}
          onClick={() => action({ action: "resolve", sanction: "WARN", hideContent: true })}
          className="px-3 py-[7px] text-button bg-card text-ink border-[0.5px] border-border-soft rounded-md hover:bg-soft transition-colors disabled:opacity-50"
        >
          경고 + 숨김
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => action({ action: "resolve", sanction: "SUSPEND_7D", hideContent: true })}
          className="px-3 py-[7px] text-button bg-card text-ink border-[0.5px] border-ink rounded-md hover:bg-soft transition-colors disabled:opacity-50"
        >
          7일 정지 + 숨김
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => action({ action: "resolve", sanction: "BAN", hideContent: true })}
          className="px-3 py-[7px] text-button bg-[var(--accent-warn)] text-paper-cream rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          영구 정지
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => action({ action: "dismiss" })}
          className="px-3 py-[7px] text-button text-ink-3 hover:text-ink"
        >
          기각
        </button>
      </div>
    </li>
  );
}
