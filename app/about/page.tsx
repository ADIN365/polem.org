import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "소개",
  description: `${SITE_NAME}은 찬반 양쪽 근거를 균형 있게 정리하고 익명으로 투표하는 곳입니다.`,
};

export default function AboutPage() {
  return (
    <div className="max-w-narrow mx-auto px-6 py-12">
      <h1 className="font-serif font-bold text-ink mb-6" style={{ fontSize: "var(--fs-title-h2)" }}>
        {SITE_NAME} 소개
      </h1>
      <div className="space-y-5 text-ink-2 leading-relaxed">
        <p>
          {SITE_NAME}은 하나의 쟁점을 두고 <strong className="text-pro">찬성</strong>과{" "}
          <strong className="text-con">반대</strong> 양쪽의 근거를 나란히 정리합니다. 어느
          쪽이 옳은지 판정하지 않습니다. 판단은 읽는 사람의 몫입니다.
        </p>
        <p>
          로그인 없이 익명으로 한 표를 던질 수 있고, 투표하면 전체 참여자의 분포가
          공개됩니다. 내 생각이 다수인지 소수인지, 남들은 어떻게 보는지 확인해 보세요.
        </p>
        <p>
          사형제·기본소득 같은 <strong>사회쟁점</strong>부터 전세 vs 월세, 워라밸 vs
          연봉 같은 <strong>일상의 밸런스</strong>까지 다룹니다. 특정 정당·후보에 대한
          지지나 비방은 다루지 않습니다.
        </p>
        <p className="text-small text-ink-3">
          근거 정리는 참고용이며, 사실관계는 각자 추가 확인을 권합니다.
        </p>
      </div>
    </div>
  );
}
