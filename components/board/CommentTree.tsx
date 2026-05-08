"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { formatRelativeKo } from "@/lib/format";
import { COMMENT_BODY_MAX } from "@/lib/validation";

interface CommentRow {
  id: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  authorNickname: string | null;
}

/** 명세 §6 Phase 3: 깊이 무한, 자동 접힘 없음. */
export default function CommentTree({
  pinId,
  isPro,
  currentUserId,
  onCommentAdded,
}: {
  pinId: string;
  isPro: boolean;
  currentUserId: string | null;
  onCommentAdded?: () => void;
}) {
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useEffect(() => {
    let aborted = false;
    fetch(`/api/pins/${pinId}/comments`)
      .then((r) => r.json())
      .then((data) => {
        if (aborted) return;
        setComments(data.comments ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (aborted) return;
        setLoading(false);
      });
    return () => {
      aborted = true;
    };
  }, [pinId]);

  const onPosted = (c: CommentRow) => {
    setComments((prev) => [...prev, c]);
    setReplyTo(null);
    onCommentAdded?.();
  };

  const tree = useTree(comments);

  return (
    <div className={isPro ? "text-ink" : "text-paper-cream"}>
      {loading ? (
        <div className="text-tiny text-ink-3">댓글을 불러오는 중…</div>
      ) : null}

      {!loading && tree.length === 0 ? (
        <div className="text-tiny opacity-70 mb-3">아직 댓글이 없어요.</div>
      ) : null}

      <ul className="space-y-2 mb-3">
        {tree.map((node) => (
          <CommentNode
            key={node.id}
            node={node}
            depth={0}
            isPro={isPro}
            currentUserId={currentUserId}
            replyTo={replyTo}
            setReplyTo={setReplyTo}
            pinId={pinId}
            onPosted={onPosted}
          />
        ))}
      </ul>

      {replyTo == null ? (
        <CommentForm
          pinId={pinId}
          parentId={null}
          isPro={isPro}
          currentUserId={currentUserId}
          onPosted={onPosted}
          onCancel={() => setReplyTo(null)}
        />
      ) : null}
    </div>
  );
}

interface TreeNode extends CommentRow {
  children: TreeNode[];
}

function useTree(comments: CommentRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  const roots: TreeNode[] = [];
  for (const c of comments) {
    map.set(c.id, { ...c, children: [] });
  }
  for (const c of comments) {
    const node = map.get(c.id)!;
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function CommentNode({
  node,
  depth,
  isPro,
  currentUserId,
  replyTo,
  setReplyTo,
  pinId,
  onPosted,
}: {
  node: TreeNode;
  depth: number;
  isPro: boolean;
  currentUserId: string | null;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  pinId: string;
  onPosted: (c: CommentRow) => void;
}) {
  const indent = Math.min(depth, 6) * 12;
  return (
    <li>
      <div className="flex gap-2 items-baseline" style={{ paddingLeft: indent }}>
        <span className="text-eyebrow-tight font-medium opacity-80">
          @{node.authorNickname ?? "익명"}
        </span>
        <span className="text-eyebrow-tight opacity-60">
          {formatRelativeKo(new Date(node.createdAt))}
        </span>
      </div>
      <div className="text-small leading-relaxed mb-1" style={{ paddingLeft: indent }}>
        {node.body}
      </div>
      <div className="flex gap-2 mb-2" style={{ paddingLeft: indent }}>
        <button
          type="button"
          onClick={() => setReplyTo(replyTo === node.id ? null : node.id)}
          className="text-eyebrow-tight opacity-70 hover:opacity-100 transition-opacity"
        >
          {replyTo === node.id ? "답글 취소" : "답글"}
        </button>
      </div>

      {replyTo === node.id ? (
        <div style={{ paddingLeft: indent + 12 }}>
          <CommentForm
            pinId={pinId}
            parentId={node.id}
            isPro={isPro}
            currentUserId={currentUserId}
            onPosted={onPosted}
            onCancel={() => setReplyTo(null)}
          />
        </div>
      ) : null}

      {node.children.map((child) => (
        <CommentNode
          key={child.id}
          node={child}
          depth={depth + 1}
          isPro={isPro}
          currentUserId={currentUserId}
          replyTo={replyTo}
          setReplyTo={setReplyTo}
          pinId={pinId}
          onPosted={onPosted}
        />
      ))}
    </li>
  );
}

function CommentForm({
  pinId,
  parentId,
  isPro,
  currentUserId,
  onPosted,
  onCancel,
}: {
  pinId: string;
  parentId: string | null;
  isPro: boolean;
  currentUserId: string | null;
  onPosted: (c: CommentRow) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast("로그인이 필요해요.");
      return;
    }
    const trimmed = body.trim();
    if (trimmed.length < 1) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pins/${pinId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: trimmed, parentId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "댓글 등록 실패");
      onPosted(data.comment);
      setBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "댓글 등록 실패");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2 items-start">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={currentUserId ? "댓글" : "로그인 후 댓글을 남길 수 있어요."}
        rows={2}
        maxLength={COMMENT_BODY_MAX}
        disabled={!currentUserId || submitting}
        className={[
          "flex-1 px-3 py-2 text-small leading-relaxed rounded-md outline-none resize-none",
          isPro
            ? "bg-soft text-ink border-[0.5px] border-border-soft focus:border-ink"
            : "bg-[#3E342B] text-paper-cream border-[0.5px] border-[var(--ink-3)] focus:border-paper-cream-dim",
        ].join(" ")}
      />
      <div className="flex flex-col gap-1">
        <button
          type="submit"
          disabled={!body.trim() || submitting}
          className={[
            "px-3 py-[7px] text-button rounded-md transition-colors disabled:opacity-50",
            isPro
              ? "bg-dark text-paper-cream hover:bg-deep"
              : "bg-paper-cream text-ink hover:bg-[#E8E4DC]",
          ].join(" ")}
        >
          등록
        </button>
        {parentId ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-tiny opacity-70 hover:opacity-100"
          >
            취소
          </button>
        ) : null}
      </div>
    </form>
  );
}
