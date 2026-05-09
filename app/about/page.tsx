import IntroCard from "@/components/intro/IntroCard";

export const metadata = { title: "소개" };

export default function AboutPage() {
  return (
    <div className="max-w-narrow mx-auto px-6 pt-16 pb-20">
      <IntroCard />
    </div>
  );
}
