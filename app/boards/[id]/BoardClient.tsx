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

export default function BoardClient({
  boardId,
  proPins,
  conPins,
  currentUserId,
  hasNickname,
}: Props) {
  const [composer, setComposer] = useState<{ side: PinSide; quoting: QuoteSource | null } | null>(null);

  const openCompose = (side: PinSide, quoting: QuoteSource | null = null) => {
    if (!currentUserId) {
      toast("로그인이 필요해요.");
      return;
    }
    if (!hasNickname) {
      toast("닉네임을 먼저 설정해주세요.");
      return;
    }
    setComposer({ side, quoting });
  };

  const handleQuote = (pin: PinData) => {
    // 인용 의견는 같은 side 로 가는 게 자연스럽지만 사용자가 변경 가능. 디폴트는 인용된 의견와 같은 side.
    openCompose(pin.side, {
      id: pin.id,
      body: pin.body,
      authorNickname: pin.authorNickname,
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[18px] p-[18px] bg-page">
        <Column
          side="PRO"
          pins={proPins}
          currentUserId={currentUserId}
          onQuote={handleQuote}
        />
        <Column
          side="CON"
          pins={conPins}
          currentUserId={currentUserId}
          onQuote={handleQuote}
        />
      </div>

      <div className="px-[18px] py-[14px] border-t border-border bg-card flex gap-2">
        <button
          type="button"
          onClick={() => openCompose("PRO")}
          className="flex-1 px-[14px] py-[11px] text-pin bg-card text-ink border-[0.5px] border-ink rounded-md hover:bg-soft transition-colors font-medium"
        >
          ＋ 찬성 의견
        </button>
        <button
          type="button"
          onClick={() => openCompose("CON")}
          className="flex-1 px-[14px] py-[11px] text-pin bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors font-medium"
        >
          ＋ 반대 의견
        </button>
      </div>

      {!currentUserId ? (
        <div className="px-[18px] pt-3 pb-1 text-center text-tiny text-ink-3">
          의견·동조·댓글은 <Link href={`/login?callbackUrl=/boards/${boardId}`} className="underline">로그인</Link> 후 가능해요.
        </div>
      ) : null}

      {composer ? (
        <PinFormModal
          boardId={boardId}
          side={composer.side}
          quoting={composer.quoting}
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
  onQuote: (pin: PinData) => void;
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
            {isPro ? "PRO · 찬성" : "CON · 반대"}
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
