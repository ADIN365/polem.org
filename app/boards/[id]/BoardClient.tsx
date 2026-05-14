"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import type { PinData } from "@/components/board/Pin";
import { Pin } from "@/components/board/Pin";
import PinFormModal, { type PinSide, type QuoteSource } from "@/components/board/PinFormModal";

interface Props {
  boardId: string;
  proPins: PinData[];
  conPins: PinData[];
  proPage: number;
  conPage: number;
  proTotal: number;
  conTotal: number;
  pageSize: number;
  currentUserId: string | null;
  hasNickname: boolean;
}

type ComposerState =
  | { mode: "NEW"; side: PinSide }
  | { mode: "QUOTE"; quoting: QuoteSource; relation: "AGREE" | "REBUT"; side: PinSide };

interface TreeData {
  selected: PinData;
  ancestors: PinData[]; // root → 직계 부모
  childrenAgree: PinData[];
  childrenRebut: PinData[];
}

function reviveDates<T extends { createdAt: Date | string }>(p: T): T {
  return { ...p, createdAt: new Date(p.createdAt) };
}

export default function BoardClient({
  boardId,
  proPins,
  conPins,
  proPage,
  conPage,
  proTotal,
  conTotal,
  pageSize,
  currentUserId,
  hasNickname,
}: Props) {
  const [composer, setComposer] = useState<ComposerState | null>(null);
  const [tree, setTree] = useState<TreeData | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);
  const [expandedPinIds, setExpandedPinIds] = useState<Set<string>>(new Set());

  const selectedPinId = tree?.selected.id ?? null;
  const treeMode = tree !== null;

  // Esc 닫기
  useEffect(() => {
    if (!treeMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !composer) closeTree();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeMode, composer]);

  const closeTree = () => setTree(null);

  const openTree = async (pin: PinData) => {
    // 자식 없는 카드 (인용·반박 0) → 트리 진입 안 하고 본문만 펼침 토글
    if (pin.quoteAgreeCount + pin.quoteRebutCount === 0) {
      setExpandedPinIds((prev) => {
        const next = new Set(prev);
        if (next.has(pin.id)) next.delete(pin.id);
        else next.add(pin.id);
        return next;
      });
      return;
    }
    if (selectedPinId === pin.id) {
      closeTree();
      return;
    }
    setTreeLoading(true);
    try {
      const res = await fetch(`/api/pins/${pin.id}/tree`);
      if (!res.ok) throw new Error("트리 조회 실패");
      const raw = await res.json();
      setTree({
        selected: reviveDates(raw.selected),
        ancestors: raw.ancestors.map(reviveDates),
        childrenAgree: raw.children.agree.map(reviveDates),
        childrenRebut: raw.children.rebut.map(reviveDates),
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "트리 조회 실패");
    } finally {
      setTreeLoading(false);
    }
  };

  const guard = () => {
    if (!currentUserId) {
      toast("로그인이 필요해요.");
      return false;
    }
    if (!hasNickname) {
      toast("닉네임을 먼저 설정해주세요.");
      return false;
    }
    return true;
  };

  const openNew = (side: PinSide) => {
    if (!guard()) return;
    setComposer({ mode: "NEW", side });
  };

  const handleQuote = (pin: PinData, relation: "AGREE" | "REBUT") => {
    if (!guard()) return;
    const side: PinSide = relation === "AGREE" ? pin.side : pin.side === "PRO" ? "CON" : "PRO";
    setComposer({
      mode: "QUOTE",
      quoting: { id: pin.id, body: pin.body, authorNickname: pin.authorNickname },
      relation,
      side,
    });
  };

  // 트리 모드일 때 진영별 트리 카드 (depth 오름차순)
  const { proTreeCards, conTreeCards } = useMemo(() => {
    if (!tree) return { proTreeCards: [] as TreeCard[], conTreeCards: [] as TreeCard[] };
    const all: TreeCard[] = [
      ...tree.ancestors.map((a, i) => ({ ...a, depth: i })),
      { ...tree.selected, depth: tree.ancestors.length },
      ...tree.childrenAgree.map((c) => ({ ...c, depth: tree.ancestors.length + 1 })),
      ...tree.childrenRebut.map((c) => ({ ...c, depth: tree.ancestors.length + 1 })),
    ];
    const sortFn = (a: TreeCard, b: TreeCard) =>
      a.depth - b.depth || b.createdAt.getTime() - a.createdAt.getTime();
    return {
      proTreeCards: all.filter((p) => p.side === "PRO").sort(sortFn),
      conTreeCards: all.filter((p) => p.side === "CON").sort(sortFn),
    };
  }, [tree]);

  return (
    <>
      {!currentUserId ? (
        <div className="px-[18px] pt-3 pb-1 text-center text-tiny text-ink-3">
          의견 작성·동조·인용·반박은{" "}
          <Link href={`/login?callbackUrl=/boards/${boardId}`} className="underline">
            로그인
          </Link>{" "}
          후 가능해요.
        </div>
      ) : null}

      {treeMode ? (
        <div className="flex justify-between items-center px-[18px] py-[10px] border-y border-border bg-soft text-tiny">
          <span className="text-ink-3">
            의견 트리 · 깊이 {tree!.ancestors.length + 1}
          </span>
          <button
            type="button"
            onClick={closeTree}
            className="inline-flex items-center gap-1 text-ink-3 hover:text-ink hover:bg-card px-2 py-1 -my-1 rounded transition-colors"
            aria-label="트리 닫기 (Esc)"
            title="트리 닫기 (Esc)"
          >
            <span aria-hidden="true">✕</span>
            <span>닫기</span>
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] p-[18px] bg-page">
        <Column
          side="PRO"
          pins={proPins}
          page={proPage}
          otherPage={conPage}
          total={proTotal}
          pageSize={pageSize}
          boardId={boardId}
          currentUserId={currentUserId}
          onQuote={handleQuote}
          onAdd={() => openNew("PRO")}
          onCardClick={openTree}
          treeMode={treeMode}
          treeCards={proTreeCards}
          selectedPinId={selectedPinId}
          treeLoading={treeLoading}
          expandedPinIds={expandedPinIds}
        />
        <Column
          side="CON"
          pins={conPins}
          page={conPage}
          otherPage={proPage}
          total={conTotal}
          pageSize={pageSize}
          boardId={boardId}
          currentUserId={currentUserId}
          onQuote={handleQuote}
          onAdd={() => openNew("CON")}
          onCardClick={openTree}
          treeMode={treeMode}
          treeCards={conTreeCards}
          selectedPinId={selectedPinId}
          treeLoading={treeLoading}
          expandedPinIds={expandedPinIds}
        />
      </div>

      {composer ? (
        <PinFormModal
          boardId={boardId}
          side={composer.side}
          quoting={composer.mode === "QUOTE" ? composer.quoting : null}
          quotedRelation={composer.mode === "QUOTE" ? composer.relation : null}
          onClose={() => setComposer(null)}
        />
      ) : null}
    </>
  );
}

type TreeCard = PinData & { depth: number };

function Column({
  side,
  pins,
  page,
  otherPage,
  total,
  pageSize,
  boardId,
  currentUserId,
  onQuote,
  onAdd,
  onCardClick,
  treeMode,
  treeCards,
  selectedPinId,
  treeLoading,
  expandedPinIds,
}: {
  side: "PRO" | "CON";
  pins: PinData[];
  page: number;
  otherPage: number;
  total: number;
  pageSize: number;
  boardId: string;
  currentUserId: string | null;
  onQuote: (pin: PinData, relation: "AGREE" | "REBUT") => void;
  onAdd: () => void;
  onCardClick: (pin: PinData) => void;
  treeMode: boolean;
  treeCards: TreeCard[];
  selectedPinId: string | null;
  treeLoading: boolean;
  expandedPinIds: Set<string>;
}) {
  const isPro = side === "PRO";
  const label = isPro ? "찬성" : "반대";
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const renderedCards = treeMode ? treeCards : pins;

  return (
    <div className="min-h-[380px]">
      <div className="flex justify-between items-center mb-[14px] px-1">
        <div className="flex items-center gap-[9px]">
          <span
            className={[
              "inline-block w-[9px] h-[9px] rounded-full",
              isPro ? "bg-paper-cream border-[1.5px] border-ink" : "bg-ink",
            ].join(" ")}
          />
          <span className="text-meta font-semibold tracking-wide text-ink">{label}</span>
          <span className="text-tiny text-ink-3 font-medium">
            {treeMode ? `트리 ${treeCards.length}` : `${total}개`}
          </span>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-2 py-1 -my-1 text-tiny font-medium text-ink-3 hover:text-ink hover:bg-soft rounded transition-colors"
          aria-label={`${label} 의견 추가`}
          title={`${label} 의견 추가`}
        >
          <span aria-hidden="true">＋</span>
          <span className="hidden sm:inline">{label} 의견</span>
        </button>
      </div>

      {renderedCards.length > 0 ? (
        renderedCards.map((p, i) => (
          <div key={p.id} className="mb-2 last:mb-0">
            {treeMode && i > 0 ? <Connector /> : null}
            <Pin
              pin={p}
              currentUserId={currentUserId}
              onQuote={onQuote}
              onCardClick={onCardClick}
              selected={treeMode && p.id === selectedPinId}
              expanded={!treeMode && expandedPinIds.has(p.id)}
            />
          </div>
        ))
      ) : (
        <div className="text-tiny text-ink-3 px-1 py-8 text-center leading-relaxed">
          {treeMode ? (
            treeLoading ? "트리 불러오는 중…" : `이 가지에는 ${label} 의견이 없어요.`
          ) : (
            <>
              {label} 의견이 비어 있어요.
              <br />위 *＋ {label} 의견* 버튼으로 첫 의견을 남겨보세요.
            </>
          )}
        </div>
      )}

      {!treeMode && totalPages > 1 ? (
        <Pagination
          boardId={boardId}
          side={side}
          page={page}
          otherPage={otherPage}
          totalPages={totalPages}
        />
      ) : null}
    </div>
  );
}

function Connector() {
  return (
    <div
      aria-hidden="true"
      className="mx-auto w-px h-3 -mt-2 mb-0 bg-ink/40"
    />
  );
}

function Pagination({
  boardId,
  side,
  page,
  otherPage,
  totalPages,
}: {
  boardId: string;
  side: "PRO" | "CON";
  page: number;
  otherPage: number;
  totalPages: number;
}) {
  const sideKey = side === "PRO" ? "proPage" : "conPage";
  const otherKey = side === "PRO" ? "conPage" : "proPage";
  const hrefFor = (p: number) => {
    const params = new URLSearchParams();
    if (p > 1) params.set(sideKey, String(p));
    if (otherPage > 1) params.set(otherKey, String(otherPage));
    const qs = params.toString();
    return qs ? `/boards/${boardId}?${qs}#${sideKey}` : `/boards/${boardId}#${sideKey}`;
  };
  const prev = page > 1 ? page - 1 : null;
  const next = page < totalPages ? page + 1 : null;

  const candidates = [1, page - 1, page, page + 1, totalPages];
  const visible = Array.from(new Set(candidates))
    .filter((n) => n >= 1 && n <= totalPages)
    .sort((a, b) => a - b);

  return (
    <nav
      id={sideKey}
      className="flex items-center justify-center gap-1 mt-3 px-1 text-tiny text-ink-3"
      aria-label={`${side === "PRO" ? "찬성" : "반대"} 페이지네이션`}
    >
      {prev ? (
        <Link
          href={hrefFor(prev)}
          className="px-2 py-1 hover:text-ink hover:bg-soft rounded transition-colors"
        >
          ←
        </Link>
      ) : (
        <span className="px-2 py-1 opacity-40">←</span>
      )}
      {visible.map((n, i) => {
        const gap = i > 0 && n - visible[i - 1] > 1;
        return (
          <span key={n} className="flex items-center">
            {gap ? <span className="px-1 opacity-40">…</span> : null}
            {n === page ? (
              <span className="px-2 py-1 font-semibold text-ink">{n}</span>
            ) : (
              <Link
                href={hrefFor(n)}
                className="px-2 py-1 hover:text-ink hover:bg-soft rounded transition-colors"
              >
                {n}
              </Link>
            )}
          </span>
        );
      })}
      {next ? (
        <Link
          href={hrefFor(next)}
          className="px-2 py-1 hover:text-ink hover:bg-soft rounded transition-colors"
        >
          →
        </Link>
      ) : (
        <span className="px-2 py-1 opacity-40">→</span>
      )}
    </nav>
  );
}
