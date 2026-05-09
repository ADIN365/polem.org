import { type ReactNode } from "react";

export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="max-w-narrow mx-auto px-6 pt-12 pb-20">
      <header className="mb-8">
        <div className="text-eyebrow tracking-widest text-ink-3 uppercase mb-1">법적 고지</div>
        <h1
          className="font-serif font-semibold tracking-tight text-ink m-0"
          style={{ fontSize: "var(--fs-title-h1)" }}
        >
          {title}
        </h1>
        <div className="text-tiny text-ink-3 mt-2">최종 업데이트 {updated}</div>
      </header>

      <div className="legal-prose space-y-5 leading-relaxed text-ink-2">{children}</div>
    </article>
  );
}
