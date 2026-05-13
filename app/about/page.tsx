import IntroCard from "@/components/intro/IntroCard";

export const metadata = {
  title: "소개",
  description: "끝장토론(polem.org) — 좌·우 영구 보관 토론 광장의 정체성과 운영 원칙.",
  alternates: { canonical: "/about" },
  openGraph: { title: "소개", type: "website" },
  twitter: { card: "summary" as const, title: "소개" },
};

export default function AboutPage() {
  return (
    <div className="max-w-narrow mx-auto px-6 pt-16 pb-20">
      <IntroCard />
    </div>
  );
}
