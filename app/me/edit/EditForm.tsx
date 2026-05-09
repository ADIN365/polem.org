"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import toast from "react-hot-toast";

import { EMAIL_REGEX, NICKNAME_REGEX } from "@/lib/validation";

interface Props {
  initialNickname: string;
  initialEmail: string;
  nicknameNextChangeAt: string | null; // ISO. null = 즉시 변경 가능
}

export default function EditForm({
  initialNickname,
  initialEmail,
  nicknameNextChangeAt,
}: Props) {
  const router = useRouter();
  const { update } = useSession();

  const canChangeNickname =
    !nicknameNextChangeAt || new Date(nicknameNextChangeAt).getTime() <= Date.now();

  return (
    <div className="space-y-6">
      <NicknameSection
        initial={initialNickname}
        canChange={canChangeNickname}
        nextChangeAt={nicknameNextChangeAt}
        onSaved={async () => {
          await update();
          router.refresh();
        }}
      />
      <EmailSection
        initial={initialEmail}
        onSaved={async () => {
          await update();
          router.refresh();
        }}
      />
    </div>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-[0.5px] border-border-soft rounded-md bg-card overflow-hidden">
      <div className="px-5 py-3 border-b-[0.5px] border-border-soft bg-soft">
        <div className="text-eyebrow tracking-widest text-ink-3 uppercase">{title}</div>
        {subtitle ? (
          <div className="text-tiny text-ink-3 mt-1 leading-relaxed">{subtitle}</div>
        ) : null}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
}

function NicknameSection({
  initial,
  canChange,
  nextChangeAt,
  onSaved,
}: {
  initial: string;
  canChange: boolean;
  nextChangeAt: string | null;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtitle = canChange
    ? "30일에 한 번 변경할 수 있어요. 신중하게 결정해주세요."
    : nextChangeAt
      ? `다음 변경 가능: ${formatDateKo(nextChangeAt)}`
      : "지금은 변경할 수 없어요.";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = value.trim();
    if (trimmed === initial) {
      toast.success("닉네임은 그대로예요.");
      return;
    }
    if (!NICKNAME_REGEX.test(trimmed)) {
      setError("2~12자, 한글·영문·숫자·언더스코어만 사용할 수 있어요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/me/nickname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "변경에 실패했어요.");
        setSubmitting(false);
        return;
      }
      toast.success("닉네임을 변경했어요.");
      await onSaved();
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Section title="닉네임" subtitle={subtitle}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={20}
          autoComplete="off"
          disabled={!canChange}
          className="w-full px-3 py-[10px] border-[0.5px] border-border bg-card text-ink text-input rounded-md outline-none focus:border-ink disabled:bg-soft disabled:text-ink-3 disabled:cursor-not-allowed"
        />
        {error ? <p className="text-tiny text-accent-warn">{error}</p> : null}
        <button
          type="submit"
          disabled={!canChange || submitting || value.trim() === initial}
          className="self-end px-4 py-[9px] text-button rounded-md bg-dark text-paper-cream hover:bg-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "저장 중…" : "닉네임 변경"}
        </button>
      </form>
    </Section>
  );
}

function EmailSection({
  initial,
  onSaved,
}: {
  initial: string;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const [submitting, setSubmitting] = useState(false);
  const [action, setAction] = useState<"save" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const trimmed = value.trim();
  const dirty = trimmed !== initial;
  const hasInitial = initial.length > 0;

  const subtitle =
    "카카오 로그인이 이메일을 자동 전달하지 않아요. 알림이나 확인용으로 직접 등록할 수 있어요. 검증 메일은 발송되지 않아요.";

  const submit = async (next: string | null) => {
    setError(null);
    if (next && !EMAIL_REGEX.test(next)) {
      setError("이메일 형식이 올바르지 않아요.");
      return;
    }
    setSubmitting(true);
    setAction(next === null ? "remove" : "save");
    try {
      const res = await fetch("/api/me/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "변경에 실패했어요.");
        setSubmitting(false);
        setAction(null);
        return;
      }
      toast.success(next === null ? "이메일을 삭제했어요." : "이메일을 저장했어요.");
      if (next === null) setValue("");
      await onSaved();
    } catch {
      setError("네트워크 오류가 발생했어요.");
    } finally {
      setSubmitting(false);
      setAction(null);
    }
  };

  return (
    <Section title="이메일" subtitle={subtitle}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(trimmed.length === 0 ? null : trimmed);
        }}
        className="flex flex-col gap-3"
      >
        <input
          type="email"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="you@example.com"
          maxLength={254}
          autoComplete="email"
          inputMode="email"
          className="w-full px-3 py-[10px] border-[0.5px] border-border bg-card text-ink text-input rounded-md outline-none focus:border-ink font-mono"
        />
        {error ? <p className="text-tiny text-accent-warn">{error}</p> : null}
        <div className="flex justify-end gap-2">
          {hasInitial ? (
            <button
              type="button"
              disabled={submitting}
              onClick={() => submit(null)}
              className="px-3 py-[9px] text-button text-ink-3 hover:text-ink underline underline-offset-2 disabled:opacity-50"
            >
              {action === "remove" ? "삭제 중…" : "삭제"}
            </button>
          ) : null}
          <button
            type="submit"
            disabled={submitting || !dirty || trimmed.length === 0}
            className="px-4 py-[9px] text-button rounded-md bg-dark text-paper-cream hover:bg-deep transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {action === "save" ? "저장 중…" : hasInitial ? "이메일 변경" : "이메일 등록"}
          </button>
        </div>
      </form>
    </Section>
  );
}

function formatDateKo(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
