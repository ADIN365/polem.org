import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { SITE_NAME } from "@/lib/constants";
import LoginButton from "./LoginButton";

interface Props {
  searchParams: { callbackUrl?: string; error?: string };
}

export const metadata = { title: "로그인" };

export default async function LoginPage({ searchParams }: Props) {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect(session.user.nickname ? "/" : "/onboarding/nickname");
  }

  const callbackUrl = searchParams.callbackUrl ?? "/";
  const error = searchParams.error;

  return (
    <div className="max-w-narrow mx-auto px-6 pt-20 pb-20">
      <div className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden max-w-[460px] mx-auto">
        <div className="px-8 pt-10 pb-6 text-center">
          <div
            className="font-serif font-semibold tracking-tight text-ink mb-2"
            style={{ fontSize: "var(--fs-title-modal)" }}
          >
            {SITE_NAME}
          </div>
          <p className="text-meta text-ink-3 leading-relaxed">
            한국어 정치 토론. 의제별 좌우 분할 영구 보관.
            <br />
            카카오 계정으로 로그인하면 *닉네임*만 사이트에 보입니다.
          </p>
        </div>

        <div className="px-8 pb-8">
          <LoginButton callbackUrl={callbackUrl} />
          {error ? (
            <p className="text-tiny text-accent-warn mt-3 text-center">
              로그인에 실패했어요. 잠시 후 다시 시도해주세요.
            </p>
          ) : null}
          <p className="text-tiny text-ink-3 mt-6 leading-relaxed text-center">
            로그인 시 <a href="/terms" className="underline underline-offset-2">이용약관</a>
            과{" "}
            <a href="/privacy" className="underline underline-offset-2">
              개인정보처리방침
            </a>
            에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}
