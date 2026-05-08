import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import NicknameForm from "./NicknameForm";

export const metadata = { title: "닉네임 설정" };

interface Props {
  searchParams: { next?: string };
}

export default async function NicknameOnboardingPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  const next = sanitizeNext(searchParams.next) ?? "/";

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/onboarding/nickname?next=${next}`)}`);
  }
  if (session.user.nickname) {
    redirect(next);
  }

  return (
    <div className="max-w-narrow mx-auto px-6 pt-20 pb-20">
      <div className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden max-w-[520px] mx-auto">
        <div className="px-8 pt-10 pb-4 text-center">
          <div
            className="font-serif font-semibold tracking-tight text-ink mb-3"
            style={{ fontSize: "var(--fs-title-modal)" }}
          >
            닉네임을 정해주세요
          </div>
          <p className="text-meta text-ink-3 leading-relaxed">
            사이트에 표시되는 *유일한* 이름이에요. 카카오 본명·이메일은 노출되지 않습니다.
            <br />
            나중에 변경할 수 있습니다.
          </p>
        </div>

        <NicknameForm next={next} />

        <div className="px-8 pb-7">
          <p className="text-tiny text-ink-3 leading-relaxed text-center">
            2~12자, 한글·영문·숫자·언더스코어. 이미 사용 중인 닉네임은 거절됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function sanitizeNext(next: string | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}
