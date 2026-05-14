"use client";

import Link from "next/link";
import { useState } from "react";
import toast from "react-hot-toast";

import PinFormModal, { type PinSide } from "./PinFormModal";

export default function WriteButtons({
  boardId,
  currentUserId,
  hasNickname,
}: {
  boardId: string;
  currentUserId: string | null;
  hasNickname: boolean;
}) {
  const [openSide, setOpenSide] = useState<PinSide | null>(null);

  const open = (side: PinSide) => {
    if (!currentUserId) {
      toast("로그인이 필요해요.");
      return;
    }
    if (!hasNickname) {
      toast("닉네임을 먼저 설정해주세요.");
      return;
    }
    setOpenSide(side);
  };

  if (!currentUserId) {
    return (
      <div className="px-[18px] py-[14px] border-b border-border bg-soft">
        <Link
          href={`/login?callbackUrl=/boards/${boardId}`}
          className="block w-full text-center py-3 rounded-md bg-ink text-card text-button font-semibold hover:opacity-90 transition-opacity"
        >
          로그인하고 의견 남기기
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="px-[18px] py-[14px] border-b border-border bg-soft">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => open("PRO")}
            className="flex items-center justify-center gap-2 py-3 rounded-md bg-card text-ink border-[0.5px] border-ink text-button font-semibold hover:bg-paper-cream transition-colors"
            aria-label="찬성 의견 남기기"
          >
            <span aria-hidden="true" className="inline-block w-[9px] h-[9px] rounded-full bg-paper-cream border-[1.5px] border-ink" />
            찬성 의견 남기기
          </button>
          <button
            type="button"
            onClick={() => open("CON")}
            className="flex items-center justify-center gap-2 py-3 rounded-md bg-paper-cream text-ink border-[0.5px] border-ink text-button font-semibold hover:bg-card transition-colors"
            aria-label="반대 의견 남기기"
          >
            <span aria-hidden="true" className="inline-block w-[9px] h-[9px] rounded-full bg-ink" />
            반대 의견 남기기
          </button>
        </div>
      </div>

      {openSide ? (
        <PinFormModal
          boardId={boardId}
          side={openSide}
          quoting={null}
          quotedRelation={null}
          onClose={() => setOpenSide(null)}
        />
      ) : null}
    </>
  );
}
