import { requireOnboarded } from "@/lib/session";
import SignOutButton from "./SignOutButton";

export const metadata = { title: "내 정보" };

/**
 * Phase 1 임시 화면 — 닉네임·이메일 확인 + 로그아웃.
 * Phase 5/6/7 에서 4축 가치관 프리즘 · 의제별 자기 거울 추가.
 */
export default async function MePage() {
  const session = await requireOnboarded("/me");
  const { user } = session;

  return (
    <div className="max-w-narrow mx-auto px-6 pt-12 pb-20">
      <header className="mb-8">
        <h1
          className="font-serif font-semibold tracking-tight text-ink"
          style={{ fontSize: "var(--fs-title-h1)" }}
        >
          내 정보
        </h1>
        <p className="text-meta text-ink-3 mt-1">
          공개 정보와 비공개 정보가 분리되어 있어요. (Private-by-Design)
        </p>
      </header>

      <section className="border-[0.5px] border-border-soft rounded-md bg-card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b-[0.5px] border-border-soft bg-soft">
          <span className="text-eyebrow tracking-widest text-ink-3 uppercase">계정</span>
        </div>
        <dl className="divide-y divide-[var(--border-soft)]">
          <div className="px-5 py-4 grid grid-cols-[100px_1fr] gap-3 items-baseline">
            <dt className="text-meta text-ink-3">닉네임</dt>
            <dd className="text-base text-ink font-medium">{user.nickname}</dd>
          </div>
          <div className="px-5 py-4 grid grid-cols-[100px_1fr] gap-3 items-baseline">
            <dt className="text-meta text-ink-3">이메일</dt>
            <dd className="text-meta text-ink-2 font-mono">
              {user.email ?? <span className="text-ink-3">미수신</span>}
              <span className="ml-2 text-tiny text-ink-3">(비공개)</span>
            </dd>
          </div>
          <div className="px-5 py-4 grid grid-cols-[100px_1fr] gap-3 items-baseline">
            <dt className="text-meta text-ink-3">권한</dt>
            <dd className="text-meta text-ink-2">{labelRole(user.role)}</dd>
          </div>
        </dl>
      </section>

      <section className="border-[0.5px] border-border-soft rounded-md bg-card overflow-hidden">
        <div className="px-5 py-4 border-b-[0.5px] border-border-soft bg-soft flex justify-between items-center">
          <span className="text-eyebrow tracking-widest text-ink-3 uppercase">
            가치관 프리즘 · 자기 거울
          </span>
          <span className="text-tiny text-ink-3">Phase 5~7 예정</span>
        </div>
        <div className="px-5 py-8 text-center text-meta text-ink-3 leading-relaxed">
          사상검증(12 Likert)을 끝내면 4축 점수가 본인에게만 보입니다.
          <br />
          오늘의 3문항에 답하면, 박제한 입장과의 *불일치*도 본인에게만 비춰집니다.
        </div>
      </section>

      <div className="mt-8 flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}

function labelRole(role: string) {
  if (role === "ADMIN") return "관리자";
  if (role === "MODERATOR") return "모더레이터";
  return "일반";
}
