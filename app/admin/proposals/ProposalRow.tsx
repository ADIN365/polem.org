"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  id: string;
  proposer: string | null;
  createdAt: string;
  rawTitle: string;
  rawBody: string | null;
  aiTitle: string | null;
  aiCategory: string | null;
  filterReason: string | null;
  blocked: boolean;
}

export default function ProposalRow({
  id,
  proposer,
  createdAt,
  rawTitle,
  rawBody,
  aiTitle,
  aiCategory,
  filterReason,
  blocked,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [editedTitle, setEditedTitle] = useState(aiTitle ?? "");
  const [editedCategory, setEditedCategory] = useState(aiCategoryToValue(aiCategory));

  const approve = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          aiTitle: editedTitle.trim(),
          aiCategory: editedCategory,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "승인 실패");
      toast.success("승인됐어요. 게시판이 생성됐습니다.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "승인 실패");
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/proposals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", rejectionReason: rejectReason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "거절 실패");
      toast.success("거절됐어요.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "거절 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="border-[0.5px] border-border rounded-md bg-card px-5 py-4 mb-3">
      <div className="text-eyebrow-tight text-ink-3 mb-2 flex gap-2 items-center">
        <span>@{proposer ?? "익명"}</span>
        <span>·</span>
        <span>{createdAt}</span>
        {blocked ? (
          <span className="ml-auto text-[var(--accent-warn)] font-medium">⚠ AI 차단</span>
        ) : null}
      </div>

      <details className="mb-3">
        <summary className="text-meta text-ink-3 cursor-pointer hover:text-ink">원본 보기</summary>
        <div className="mt-2 px-3 py-2 bg-soft border-[0.5px] border-border-soft rounded-md text-meta text-ink-2 leading-relaxed">
          <div className="font-medium text-ink mb-1">{rawTitle}</div>
          {rawBody ? <div className="whitespace-pre-wrap">{rawBody}</div> : null}
        </div>
      </details>

      {filterReason ? (
        <div className="mb-3 px-3 py-2 bg-soft border-l-2 border-[var(--accent-warn)] text-meta text-ink-2 leading-relaxed">
          <span className="text-eyebrow-tight uppercase tracking-wider mr-2 text-ink-3">
            AI 차단 사유
          </span>
          {filterReason}
        </div>
      ) : null}

      {!blocked ? (
        <div className="space-y-2 mb-3">
          <label className="block">
            <span className="text-meta text-ink-2 block mb-1">정제된 제목</span>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              maxLength={80}
              className="w-full px-3 py-[8px] border-[0.5px] border-border bg-card text-input text-ink rounded-md outline-none focus:border-ink"
            />
          </label>
          <label className="block">
            <span className="text-meta text-ink-2 block mb-1">카테고리</span>
            <select
              value={editedCategory}
              onChange={(e) => setEditedCategory(e.target.value)}
              className="px-3 py-[8px] border-[0.5px] border-border bg-card text-meta text-ink rounded-md outline-none cursor-pointer"
            >
              <option value="POLITICS">정치</option>
              <option value="ECONOMY">경제</option>
              <option value="SOCIETY">사회</option>
              <option value="CULTURE">문화</option>
              <option value="FOREIGN_AFFAIRS">외교·안보</option>
              <option value="ENVIRONMENT">환경·과학</option>
            </select>
          </label>
        </div>
      ) : null}

      {rejectMode ? (
        <div className="mb-3">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={2}
            placeholder="거절 사유 (제안자에게 알림으로 전달)"
            className="w-full px-3 py-[8px] border-[0.5px] border-border bg-card text-input text-ink rounded-md outline-none focus:border-ink resize-none"
          />
        </div>
      ) : null}

      <div className="flex gap-2 justify-end">
        {!blocked && !rejectMode ? (
          <button
            type="button"
            onClick={approve}
            disabled={busy || editedTitle.trim().length < 5}
            className="px-4 py-[8px] text-button bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors disabled:opacity-50"
          >
            {busy ? "처리 중…" : "승인 → 게시판 생성"}
          </button>
        ) : null}
        {!rejectMode ? (
          <button
            type="button"
            onClick={() => setRejectMode(true)}
            disabled={busy}
            className="px-4 py-[8px] text-button bg-card text-ink-2 hover:text-ink border-[0.5px] border-border-soft rounded-md transition-colors"
          >
            거절
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={reject}
              disabled={busy || rejectReason.trim().length < 2}
              className="px-4 py-[8px] text-button bg-[var(--accent-warn)] text-paper-cream rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {busy ? "처리 중…" : "거절 확정"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRejectMode(false);
                setRejectReason("");
              }}
              disabled={busy}
              className="px-4 py-[8px] text-button text-ink-3 hover:text-ink"
            >
              취소
            </button>
          </>
        )}
      </div>
    </article>
  );
}

function aiCategoryToValue(label: string | null): string {
  if (!label) return "POLITICS";
  // label 은 한국어 (CATEGORY_LABEL 적용된). 역매핑.
  const map: Record<string, string> = {
    "정치": "POLITICS",
    "경제": "ECONOMY",
    "사회": "SOCIETY",
    "문화": "CULTURE",
    "외교·안보": "FOREIGN_AFFAIRS",
    "환경·과학": "ENVIRONMENT",
  };
  return map[label] ?? label;
}
