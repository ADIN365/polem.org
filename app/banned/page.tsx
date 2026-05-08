import SignOutButton from "@/app/me/SignOutButton";

export const metadata = { title: "이용 정지" };

export default function BannedPage() {
  return (
    <div className="max-w-narrow mx-auto px-6 pt-20 pb-20">
      <div className="border-[0.5px] border-border rounded-lg bg-card p-8 max-w-[520px] mx-auto text-center">
        <div
          className="font-serif font-semibold tracking-tight text-ink mb-3"
          style={{ fontSize: "var(--fs-title-h2)" }}
        >
          이용이 정지되었습니다
        </div>
        <p className="text-meta text-ink-2 leading-relaxed mb-6">
          이용약관 위반으로 계정이 정지되었습니다. 이의 신청은
          <br />
          <a href="mailto:contact@polem.org" className="underline underline-offset-2">
            contact@polem.org
          </a>{" "}
          으로 연락해주세요.
        </p>
        <SignOutButton />
      </div>
    </div>
  );
}
