"use client";

import { useState } from "react";
import type { CommentView } from "@/lib/issues";

interface Props {
  slug: string;
  proLabel: string;
  conLabel: string;
  initial: CommentView[];
}

const MAX = 140;

export default function Comments({ slug, proLabel, conLabel, initial }: Props) {
  const [list, setList] = useState<CommentView[]>(initial);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "등록에 실패했습니다");
      setList((prev) => [data.comment, ...prev]);
      setBody("");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "등록에 실패했습니다");
    } finally {
      setBusy(false);
    }
  }

  async function report(id: string) {
    if (!confirm("이 의견을 신고할까요?")) return;
    try {
      const res = await fetch("/api/comment/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (data?.hidden) setList((prev) => prev.filter((c) => c.id !== id));
      alert(data?.hidden ? "신고 접수 — 숨김 처리되었습니다" : "신고가 접수되었습니다");
    } catch {
      alert("신고에 실패했습니다");
    }
  }

  return (
    <section className="mt-12">
      <h2 className="font-serif font-semibold text-ink mb-4" style={{ fontSize: "var(--fs-title-h4)" }}>
        한 줄 의견 <span className="text-ink-4 text-small font-sans font-normal">{list.length}</span>
      </h2>

      {done ? (
        <p className="text-small text-ink-3 bg-soft border-[0.5px] border-border-soft rounded-lg p-4 mb-6">
          의견이 등록되었습니다. 이 쟁점에는 한 사람당 하나만 남길 수 있어요.
        </p>
      ) : (
        <form onSubmit={submit} className="mb-8">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX))}
            placeholder="왜 그렇게 생각하세요? (한 줄, 익명)"
            rows={2}
            className="w-full resize-none rounded-lg border-[0.5px] border-border bg-card p-3 text-ink text-small focus:outline-none focus:border-ink-4"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-tiny text-ink-4">
              {body.length}/{MAX} · 로그인 없이 익명
            </span>
            <button
              type="submit"
              disabled={busy || body.trim().length < 2}
              className="px-4 py-1.5 text-small rounded-lg bg-dark text-paper-cream disabled:opacity-40 hover:opacity-90 transition"
            >
              {busy ? "등록 중..." : "등록"}
            </button>
          </div>
          {error ? <p className="text-tiny text-con mt-2">{error}</p> : null}
        </form>
      )}

      {list.length === 0 ? (
        <p className="text-small text-ink-3 text-center py-8">
          아직 의견이 없습니다. 첫 의견을 남겨보세요.
        </p>
      ) : (
        <ul className="space-y-3">
          {list.map((c) => (
            <li key={c.id} className="bg-card border-[0.5px] border-border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {c.side ? (
                    <span
                      className={`inline-block text-tiny font-medium mb-1 ${c.side === "PRO" ? "text-pro" : "text-con"}`}
                    >
                      {c.side === "PRO" ? proLabel : conLabel} 측
                    </span>
                  ) : null}
                  <p className="text-small text-ink-2 leading-relaxed break-words">{c.body}</p>
                </div>
                <button
                  onClick={() => report(c.id)}
                  className="text-tiny text-ink-4 hover:text-con flex-shrink-0"
                  aria-label="신고"
                >
                  신고
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
