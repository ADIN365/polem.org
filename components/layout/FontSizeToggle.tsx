"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "polem-fs";
type FontSize = "default" | "fs-large" | "fs-xlarge";

const SIZES: { value: FontSize; label: string; aria: string }[] = [
  { value: "default", label: "가", aria: "기본 글자 크기" },
  { value: "fs-large", label: "가", aria: "큰 글자 크기" },
  { value: "fs-xlarge", label: "가", aria: "더 큰 글자 크기" },
];

export default function FontSizeToggle() {
  const [size, setSize] = useState<FontSize>("default");

  // 첫 마운트 시 localStorage 읽어서 body class 반영
  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as FontSize | null) ?? "default";
    setSize(saved);
    applyFontSize(saved);
  }, []);

  const apply = (next: FontSize) => {
    setSize(next);
    applyFontSize(next);
    localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <div
      className="flex items-center bg-card border-[0.5px] border-border-soft rounded-md overflow-hidden mr-2"
      role="group"
      aria-label="글자 크기"
    >
      {SIZES.map((s, i) => {
        const active = size === s.value;
        const fontSize = i === 0 ? 11 : i === 1 ? 13 : 15;
        return (
          <button
            key={s.value}
            type="button"
            onClick={() => apply(s.value)}
            aria-label={s.aria}
            aria-pressed={active}
            className={[
              "px-2 py-[5px] min-w-[26px] font-medium leading-none transition-colors",
              i < SIZES.length - 1 ? "border-r-[0.5px] border-border-soft" : "",
              active
                ? "bg-dark text-paper-cream"
                : "bg-transparent text-ink-3 hover:bg-soft hover:text-ink",
            ].join(" ")}
            style={{ fontSize: `${fontSize}px` }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

function applyFontSize(size: FontSize) {
  const body = document.body;
  body.classList.remove("fs-large", "fs-xlarge");
  if (size !== "default") body.classList.add(size);
}
