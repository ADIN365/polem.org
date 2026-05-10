"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

import type { PinData } from "@/components/board/Pin";
import { Pin } from "@/components/board/Pin";
import PinFormModal, { type PinSide, type QuoteSource } from "@/components/board/PinFormModal";

interface Props {
  boardId: string;
  proPins: PinData[];
  conPins: PinData[];
  currentUserId: string | null;
  hasNickname: boolean;
}

type ComposerState =
  | { mode: "NEW"; side: PinSide }
  | { mode: "QUOTE"; quoting: QuoteSource; relation: "AGREE" | "REBUT"; side: PinSide };

export default function BoardClient({
  boardId,
  proPins,
  conPins,
  currentUserId,
  hasNickname,
}: Props) {
  const [composer, setComposer] = useState<ComposerState | null>(null);

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
    // 인용=같은 side, 반박=반대 side. 자동 결정.
    const side: PinSide = relation === "AGREE" ? pin.side : pin.side === "PRO" ? "CON" : "PRO";
    setComposer({
      mode: "QUOTE",
      quoting: { id: pin.id, body: pin.body, authorNickname: pin.authorNickname },
      relation,
      side,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] p-[18px] bg-page">
        <Column side="PRO" pins={proPins} currentUserId={currentUserId} onQuote={handleQuote} />
        <Column side="CON" pins={conPins} currentUserId={currentUserId} onQuote={handleQuote} />
      </div>

      <div className="px-[18px] py-[14px] border-t border-border bg-card flex gap-2">
        <button
          type="button"
          onClick={() => openNew("PRO")}
          className="flex-1 px-[14px] py-[11px] text-pin bg-card text-ink border-[0.5px] border-ink rounded-md hover:bg-soft transition-colors font-medium"
        >
          ＋ 찬성 의견
        </button>
        <button
          type="button"
          onClick={() => openNew("CON")}
          className="flex-1 px-[14px] py-[11px] text-pin bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors font-medium"
        >
          ＋ 반대 의견
        </button>
      </div>

      {!currentUserId ? (
        <div className="px-[18px] pt-3 pb-1 text-center text-tiny text-ink-3">
          의견 작성·동조·인용·반박은 <Link href={`/login?callbackUrl=/boards/${boardId}`} className="underline">로그인</Link> 후 가능해요.
        </div>
      ) : null}

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

function Column({
  side,
  pins,
  currentUserId,
  onQuote,
}: {
  side: "PRO" | "CON";
  pins: PinData[];
  currentUserId: string | null;
  onQuote: (pin: PinData, relation: "AGREE" | "REBUT") => void;
}) {
  const isPro = side === "PRO";
  return (
    <div className="min-h-[380px]">
      <div className="flex justify-between items-baseline mb-[14px] px-1">
        <div className="flex items-center gap-[9px]">
          <span
            className={[
              "inline-block w-[9px] h-[9px] rounded-full",
              isPro ? "bg-card border-[1.5px] border-ink" : "bg-ink",
            ].join(" ")}
          />
          <span className="text-meta font-semibold tracking-wide text-ink">
            {isPro ? "찬성" : "반대"}
          </span>
        </div>
        <div className="text-tiny text-ink-3 font-medium">{pins.length}개</div>
      </div>
      {pins.length > 0 ? (
        pins.map((p) => (
          <Pin key={p.id} pin={p} currentUserId={currentUserId} onQuote={onQuote} />
        ))
      ) : (
        <div className="text-tiny text-ink-3 px-1 py-8 text-center leading-relaxed">
          {isPro ? "찬성 의견이 비어 있어요." : "반대 의견이 비어 있어요."}
          <br />
          아래 *＋ {isPro ? "찬성" : "반대"} 의견* 버튼으로 첫 의견을 남겨보세요.
        </div>
      )}
    </div>
  );
}
