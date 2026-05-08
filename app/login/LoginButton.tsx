"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type Provider = "kakao" | "naver";

export default function LoginButton({ callbackUrl }: { callbackUrl: string }) {
  const [busy, setBusy] = useState<Provider | null>(null);

  const start = async (provider: Provider) => {
    setBusy(provider);
    // 가입 흐름은 항상 /post-login 을 거치고, next 로 원래 목적지를 전달.
    await signIn(provider, {
      callbackUrl: `/post-login?next=${encodeURIComponent(callbackUrl)}`,
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => start("kakao")}
        className="w-full px-4 py-[14px] text-button-large font-medium rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "#FEE500", color: "#191600" }}
      >
        {busy === "kakao" ? "이동 중…" : "카카오로 시작하기"}
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => start("naver")}
        className="w-full px-4 py-[14px] text-button-large font-medium rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ background: "#03C75A", color: "#ffffff" }}
      >
        {busy === "naver" ? "이동 중…" : "네이버로 시작하기"}
      </button>
    </div>
  );
}
