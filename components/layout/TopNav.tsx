import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/constants";
import FontSizeToggle from "./FontSizeToggle";
import MobileMenu, { type MobileMenuLink } from "./MobileMenu";

export default async function TopNav() {
  const session = await getServerSession(authOptions);
  const initial = (session?.user?.nickname ?? session?.user?.name ?? "ㄱ").trim().charAt(0);
  const isAdmin = session?.user?.role === "ADMIN";

  // 모바일 햄버거 — 동그라미 아바타가 작아 진입 보조.
  // 데스크탑은 브랜드(홈) + 동그라미(/me) 만으로 충분해서 NAV_LINKS 비움.
  const mobileLinks: MobileMenuLink[] = [
    { href: "/", label: "의제" },
    ...(session?.user ? [{ href: "/proposal", label: "주제 만들기" }] : []),
    ...(session?.user ? [{ href: "/three", label: "오늘의 3문항" }] : []),
    ...(isAdmin ? [{ href: "/admin", label: "관리자" }] : []),
    { href: "/about", label: "이런 광장입니다" },
    session?.user
      ? { href: "/api/auth/signout", label: "로그아웃" }
      : { href: "/login", label: "로그인" },
  ];

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

        <div className="flex items-center gap-2 md:gap-[14px]">
          {isAdmin ? (
            <Link
              href="/admin"
              className="hidden md:inline-block px-[14px] py-2 text-small text-ink hover:text-ink rounded-sm transition-colors border-b border-ink"
            >
              관리자
            </Link>
          ) : null}

          <div className="hidden md:flex">
            <FontSizeToggle />
          </div>

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
              className="hidden md:inline-block px-3 py-[7px] text-small text-ink-2 hover:text-ink border-[0.5px] border-border rounded-sm transition-colors"
            >
              로그인
            </Link>
          )}

          <MobileMenu links={mobileLinks} />
        </div>
      </div>
    </header>
  );
}
