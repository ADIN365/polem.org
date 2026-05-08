import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { NAV_LINKS, SITE_DOMAIN, SITE_NAME } from "@/lib/constants";
import FontSizeToggle from "./FontSizeToggle";

export default async function TopNav() {
  const session = await getServerSession(authOptions);
  const initial = (session?.user?.nickname ?? session?.user?.name ?? "ㄱ").trim().charAt(0);

  return (
    <header className="sticky top-0 z-50 bg-page/[0.92] backdrop-blur-md backdrop-saturate-150 border-b-[0.5px] border-border">
      <div className="max-w-site mx-auto px-6 py-[14px] flex items-center justify-between gap-[14px] relative">
        <Link href="/" className="brand flex items-baseline gap-[10px] flex-shrink-0">
          <span
            className="font-serif font-semibold tracking-tight text-ink"
            style={{ fontSize: "var(--fs-brand)" }}
          >
            {SITE_NAME}
          </span>
          <span className="font-sans text-tiny text-ink-3 tracking-widest font-normal">
            · {SITE_DOMAIN}
          </span>
        </Link>

        <div className="flex items-center gap-[14px]">
          <nav className="hidden md:flex gap-1 items-center">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="px-[14px] py-2 text-small text-ink-2 hover:text-ink rounded-sm transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <FontSizeToggle />

          {session?.user ? (
            <Link
              href="/me"
              aria-label="내 정보"
              className="w-8 h-8 rounded-full bg-dark text-paper-cream flex items-center justify-center text-tiny font-medium font-serif flex-shrink-0"
            >
              {initial}
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-3 py-[7px] text-small text-ink-2 hover:text-ink border-[0.5px] border-border rounded-sm transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
