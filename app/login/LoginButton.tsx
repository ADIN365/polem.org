"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginButton({ callbackUrl }: { callbackUrl: string }) {
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        // 가입 흐름은 항상 /post-login 을 거치고, next 로 원래 목적지를 전달.
        await signIn("kakao", {
          callbackUrl: `/post-login?next=${encodeURIComponent(callbackUrl)}`,
        });
      }}
      className="w-full px-4 py-[14px] text-button-large font-medium rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ background: "#FEE500", color: "#191600" }}
    >
      {loading ? "이동 중…" : "카카오로 시작하기"}
    </button>
  );
}
