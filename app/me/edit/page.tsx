import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireOnboarded } from "@/lib/session";
import { nextNicknameChangeAt } from "@/lib/validation";

import EditForm from "./EditForm";

export const metadata = { title: "내 정보 수정" };
export const dynamic = "force-dynamic";

export default async function EditMePage() {
  const session = await requireOnboarded("/me/edit");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { nickname: true, email: true, nicknameUpdatedAt: true },
  });
  if (!user) {
    // banned/탈퇴 등 — requireOnboarded 가 처리하지만 type narrowing 차원
    throw new Error("user not found");
  }

  const nicknameNextAt = nextNicknameChangeAt(user.nicknameUpdatedAt);

  return (
    <div className="max-w-narrow mx-auto px-6 pt-12 pb-20 space-y-6">
      <header className="flex items-baseline justify-between">
        <h1
          className="font-serif font-semibold tracking-tight text-ink"
          style={{ fontSize: "var(--fs-title-h1)" }}
        >
          내 정보 수정
        </h1>
        <Link
          href="/me"
          className="text-meta text-ink-3 hover:text-ink underline underline-offset-2"
        >
          ← 돌아가기
        </Link>
      </header>

      <EditForm
        initialNickname={user.nickname ?? ""}
        initialEmail={user.email ?? ""}
        nicknameNextChangeAt={nicknameNextAt?.toISOString() ?? null}
      />
    </div>
  );
}
