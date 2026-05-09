"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";

export default function MarkAllRead() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await fetch("/api/me/notifications", { method: "POST" });
          router.refresh();
        } catch {
          toast.error("실패");
        } finally {
          setBusy(false);
        }
      }}
      className="px-3 py-[7px] text-button text-ink-2 hover:text-ink border-[0.5px] border-border-soft rounded-md transition-colors disabled:opacity-50"
    >
      모두 읽음
    </button>
  );
}
