import Link from "next/link";

import { SITE_DOMAIN, SITE_NAME } from "@/lib/constants";
import { CATEGORIES } from "@/lib/categories";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-50 bg-page/[0.92] backdrop-blur-md backdrop-saturate-150 border-b-[0.5px] border-border">
      <div className="max-w-site mx-auto px-6 py-[14px] flex items-center justify-between gap-4">
        <Link href="/" className="brand flex items-baseline gap-[10px] flex-shrink-0">
          <span
            className="font-serif font-semibold tracking-tight text-ink"
            style={{ fontSize: "var(--fs-brand)" }}
          >
            {SITE_NAME}
          </span>
          <span className="font-sans text-tiny text-ink-3 tracking-widest font-normal hidden sm:inline">
            · {SITE_DOMAIN}
          </span>
        </Link>

        <nav className="flex items-center gap-3 md:gap-5 text-small text-ink-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/c/${c.slug}`}
              className="whitespace-nowrap hover:text-ink transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
