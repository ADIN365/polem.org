"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export default function SignOutButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => {
        setLoading(true);
        signOut({ callbackUrl: "/" });
      }}
      className="px-4 py-[9px] text-button text-ink-2 hover:text-ink border-[0.5px] border-border-soft hover:border-border rounded-md transition-colors disabled:opacity-60"
    >
      {loading ? "로그아웃 중…" : "로그아웃"}
    </button>
  );
}
