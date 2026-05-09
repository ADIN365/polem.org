import Link from "next/link";

import { formatRelativeKo } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { requireOnboarded } from "@/lib/session";

import MarkAllRead from "./MarkAllRead";

export const metadata = { title: "알림" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await requireOnboarded("/notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="max-w-narrow mx-auto px-6 pt-10 pb-20">
      <header className="mb-6 flex justify-between items-end">
        <div>
          <div className="text-eyebrow tracking-widest text-ink-3 uppercase mb-[5px]">알림</div>
          <h1
            className="font-serif font-semibold tracking-tight text-ink m-0"
            style={{ fontSize: "var(--fs-title-h1)" }}
          >
            알림
            {unread > 0 ? (
              <span className="ml-2 text-meta text-ink-3 font-normal">
                · 읽지 않음 {unread}
              </span>
            ) : null}
          </h1>
        </div>
        {unread > 0 ? <MarkAllRead /> : null}
      </header>

      <section className="border-[0.5px] border-border-soft rounded-md bg-card overflow-hidden">
        {notifications.length === 0 ? (
          <div className="px-5 py-8 text-center text-meta text-ink-3">받은 알림이 없어요.</div>
        ) : (
          <ul>
            {notifications.map((n) => (
              <li
                key={n.id}
                className="px-5 py-4 border-b-[0.5px] border-border-soft last:border-b-0 flex justify-between items-start gap-3"
              >
                <div className="flex-1">
                  <div
                    className={`text-meta leading-relaxed whitespace-pre-line ${
                      n.read ? "text-ink-3" : "text-ink"
                    }`}
                  >
                    {n.body}
                  </div>
                  <div className="text-eyebrow-tight text-ink-3 mt-1">
                    {formatRelativeKo(n.createdAt)} · {labelType(n.type)}
                  </div>
                </div>
                {n.link ? (
                  <Link
                    href={n.link}
                    className="text-meta text-ink hover:underline shrink-0"
                  >
                    →
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function labelType(t: string) {
  const map: Record<string, string> = {
    PROPOSAL_APPROVED: "토론 주제 승인",
    PROPOSAL_REJECTED: "토론 주제 거절",
    REPORT_RESOLVED: "신고 처리",
    PIN_CHALLENGED: "출처 반박",
    WARNING: "경고",
    SUSPENSION: "정지",
  };
  return map[t] ?? t;
}
