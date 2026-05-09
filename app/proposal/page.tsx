import { requireOnboarded } from "@/lib/session";
import ProposalForm from "./ProposalForm";

export const metadata = { title: "토론 주제 만들기" };

export default async function ProposalPage() {
  await requireOnboarded("/proposal");

  return (
    <div className="max-w-narrow mx-auto px-6 pt-10 pb-20">
      <header className="mb-6">
        <div className="text-eyebrow tracking-widest text-ink-3 uppercase mb-[5px]">토론 주제 만들기</div>
        <h1
          className="font-serif font-semibold tracking-tight text-ink m-0"
          style={{ fontSize: "var(--fs-title-h1)" }}
        >
          새 토론 주제 만들기
        </h1>
        <p className="text-meta text-ink-3 mt-2 leading-relaxed">
          보내주신 내용은 *AI 가 토론 주제 형식으로 정제* 후, *관리자 검토* 를 거쳐 게시판이 됩니다.
          <br />
          정제·검토는 보통 *1~2일* 안에 끝나요. 결과는 알림으로 받습니다.
        </p>
      </header>

      <ProposalForm />

      <section className="mt-8 px-5 py-4 bg-soft border-[0.5px] border-border-soft rounded-md">
        <div className="text-eyebrow tracking-widest text-ink-3 uppercase mb-2">
          좋은 토론 주제의 조건
        </div>
        <ul className="text-meta text-ink-2 leading-relaxed space-y-1 pl-4 list-disc">
          <li>찬·반으로 명확히 갈릴 수 있는 정책·제도·사회 사안</li>
          <li>의문문 형식 — &quot;○○에 찬성하십니까?&quot; / &quot;○○를 도입해야 하는가?&quot;</li>
          <li>한 사람·집단을 비하하는 표현은 자제</li>
          <li>특정 정책·정당·인명은 그대로 적되, 가치 판단 어휘 자제</li>
        </ul>
      </section>
    </div>
  );
}
