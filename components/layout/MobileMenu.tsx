"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import FontSizeToggle from "./FontSizeToggle";

export interface MobileMenuLink {
  href: string;
  label: string;
  active?: boolean;
}

/**
 * 모바일 햄버거 메뉴. md 이상에서는 숨김.
 * 외부 클릭·Esc 로 닫힘. 글자 크기 토글도 메뉴 안에 포함.
 */
export default function MobileMenu({ links }: { links: MobileMenuLink[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="md:hidden relative">
      <button
        type="button"
        aria-label="메뉴 열기"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-2 text-ink-2 hover:text-ink text-base"
      >
        {open ? "✕" : "☰"}
      </button>

      {open ? (
        <div className="absolute top-full right-0 mt-1 min-w-[220px] bg-card border-[0.5px] border-border rounded-sm shadow-[0_4px_16px_rgba(0,0,0,0.08)] z-50 py-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={[
                "block px-[18px] py-[11px] text-base border-b-[0.5px] border-border-soft last:border-b-0",
                l.active ? "text-ink font-medium" : "text-ink-2 hover:text-ink",
              ].join(" ")}
            >
              {l.label}
            </Link>
          ))}
          <div className="px-[18px] py-3 border-t-[0.5px] border-border-soft">
            <div className="text-eyebrow tracking-widest text-ink-3 uppercase mb-2">글자 크기</div>
            <FontSizeToggle />
          </div>
        </div>
      ) : null}
    </div>
  );
}
