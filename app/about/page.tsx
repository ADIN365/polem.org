import IntroCard from "@/components/intro/IntroCard";

export const metadata = { title: "이런 광장입니다" };

export default function AboutPage() {
  return (
    <div className="max-w-narrow mx-auto px-6 pt-16 pb-20">
      <header className="text-center mb-10">
        <div className="text-eyebrow tracking-widest text-ink-3 uppercase mb-2">소개</div>
        <h1
          className="font-serif font-semibold tracking-tight text-ink m-0"
          style={{ fontSize: "var(--fs-title-h1)" }}
        >
          이런 광장입니다
        </h1>
      </header>

      <IntroCard />
    </div>
  );
}
