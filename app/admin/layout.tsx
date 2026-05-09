import Link from "next/link";

import { requireAdmin } from "@/lib/admin";

export const metadata = { title: "관리자" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="max-w-site mx-auto px-6 pt-6 pb-20">
      <nav className="flex items-center gap-2 mb-6 text-meta">
        <span className="text-eyebrow tracking-widest text-ink-3 uppercase">관리자</span>
        <span className="text-ink-3">/</span>
        <Link href="/admin" className="text-ink-2 hover:text-ink transition-colors">
          대시보드
        </Link>
        <span className="text-ink-3">·</span>
        <Link href="/admin/proposals" className="text-ink-2 hover:text-ink transition-colors">
          의제 제안
        </Link>
      </nav>
      {children}
    </div>
  );
}
