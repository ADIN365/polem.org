import { formatRelativeKo } from "@/lib/format";

export interface PinData {
  id: string;
  side: "PRO" | "CON";
  body: string;
  authorNickname: string | null;
  createdAt: Date;
  endorseCount: number;
  commentCount: number;
  challengeCount: number;
  blindAgreeRatio: number | null; // 0-100, 데이터 부족 시 null
  quoted: { authorNickname: string | null; body: string } | null;
}

/**
 * 박제 카드. 찬성=흰 카드(잉크 글자), 반대=잉크 카드(크림 글자).
 * Phase 2 는 표시만. Phase 3 에서 클릭 시 댓글 펼침·동조 토글 등 인터랙션 추가.
 */
export function Pin({ pin }: { pin: PinData }) {
  const isPro = pin.side === "PRO";
  return (
    <article
      className={[
        "px-4 py-[14px] mb-2 last:mb-0 rounded-md",
        isPro
          ? "bg-card text-ink border-[0.5px] border-ink"
          : "bg-dark text-[var(--paper-cream)]",
      ].join(" ")}
    >
      {pin.quoted ? <PinQuote isPro={isPro} authorNickname={pin.quoted.authorNickname} body={pin.quoted.body} /> : null}

      <div className="text-pin leading-relaxed mb-2">{pin.body}</div>

      <div
        className={[
          "flex justify-between items-center text-eyebrow-tight",
          isPro ? "text-ink-3" : "text-[var(--paper-cream-dim)]",
        ].join(" ")}
      >
        <div className="flex gap-[9px] items-center">
          <span>@{pin.authorNickname ?? "익명"}</span>
          <span>{formatRelativeKo(pin.createdAt)}</span>
          {pin.challengeCount > 0 ? (
            <span
              className={
                isPro
                  ? "border-[0.5px] border-ink-3 px-1 text-ink font-medium"
                  : "bg-[var(--paper-cream)] text-ink px-1 font-medium"
              }
              title="출처 도전"
            >
              ⚠ {pin.challengeCount}
            </span>
          ) : null}
        </div>
        <div className="flex gap-[9px] items-center">
          {pin.blindAgreeRatio != null ? (
            <span
              className={[
                "font-medium",
                isPro ? "text-[var(--accent-warm)]" : "text-[var(--accent-warm-light)]",
              ].join(" ")}
              title="블라인드 답변 동의율"
            >
              블라인드 {pin.blindAgreeRatio}%
            </span>
          ) : null}
          <span>↑ {pin.endorseCount}</span>
          <span>댓 {pin.commentCount}</span>
        </div>
      </div>
    </article>
  );
}

function PinQuote({ isPro, authorNickname, body }: { isPro: boolean; authorNickname: string | null; body: string }) {
  return (
    <div
      className={[
        "px-3 py-2 mb-2 text-tiny leading-relaxed border-l-2",
        isPro
          ? "bg-soft text-ink-2 border-[var(--accent-warm)]"
          : "bg-[#3E342B] text-[var(--ink-soft)] border-[var(--accent-warm-light)]",
      ].join(" ")}
    >
      <span
        className={[
          "text-eyebrow-tight tracking-wider uppercase mr-1",
          isPro ? "text-ink-3" : "text-[var(--paper-cream-dim)]",
        ].join(" ")}
      >
        인용 ─
      </span>
      @{authorNickname ?? "익명"} · &ldquo;{body}&rdquo;
    </div>
  );
}
