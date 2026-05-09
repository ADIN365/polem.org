import Link from "next/link";
import { SITE_DOMAIN, SITE_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t-[0.5px] border-border-soft mt-16">
      <div className="max-w-site mx-auto px-6 py-10 flex flex-col gap-4 md:flex-row md:justify-between md:items-end">
        <div>
          <div className="font-serif font-semibold text-ink" style={{ fontSize: "var(--fs-title-h4)" }}>
            {SITE_NAME}
          </div>
          <div className="text-tiny text-ink-3 mt-1 tracking-wider">
            {SITE_DOMAIN} · 한국어 정치 토론 플랫폼
          </div>
        </div>
        <nav className="flex gap-4 text-meta text-ink-3 flex-wrap">
          <Link href="/about" className="hover:text-ink transition-colors">
            이런 광장입니다
          </Link>
          <Link href="/terms" className="hover:text-ink transition-colors">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-ink transition-colors">
            개인정보처리방침
          </Link>
          <Link href="/policy" className="hover:text-ink transition-colors">
            운영정책
          </Link>
        </nav>
      </div>
    </footer>
  );
}
