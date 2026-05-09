import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

/**
 * 사이트 의도 카피 카드. 두 곳에서 공유:
 *   1. /  토론 주제가 0개 + 필터 없음 일 때 (빈 상태 전용)
 *   2. /about  언제든 진입해서 볼 수 있는 별도 페이지
 *
 * 로그인 여부에 따라 우측 보조 버튼만 *로그인* / *내 정보* 로 바뀜.
 */
export default async function IntroCard() {
  const session = await getServerSession(authOptions);

  return (
    <>
      <section className="border-[0.5px] border-border rounded-lg bg-card overflow-hidden mb-6">
        <div className="px-7 py-10 text-center space-y-7">
          <p
            className="font-serif text-ink leading-snug tracking-tight"
            style={{ fontSize: "var(--fs-title-h2)" }}
          >
            토론은 건강한 사회를 위한 토양이 됩니다.
          </p>

          <div className="space-y-2">
            <p className="text-base text-ink-2 leading-relaxed">
              생각이 다르다는 것은 욕하고 비난할 이유가 아니라, 우리가 더 넓어질 기회입니다.
            </p>
            <p className="text-base text-ink-2 leading-relaxed">
              상대의 목소리에 귀를 기울일 때 비로소 논리는 완성됩니다.
            </p>
          </div>

          <div className="text-center">
            <ul className="inline-block space-y-2 text-base text-ink-2 leading-relaxed text-left">
              <li className="flex gap-2">
                <span className="text-ink-3 shrink-0">·</span>
                <span>
                  <span className="font-medium text-ink">감정 대신 논리로</span> · 서로에 대한 모독이 아닌, 객관적 근거로 논증합니다.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-ink-3 shrink-0">·</span>
                <span>
                  <span className="font-medium text-ink">차이의 인정</span> · 틀린 것이 아니라 다른 것임을 존중합니다.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-ink-3 shrink-0">·</span>
                <span>
                  <span className="font-medium text-ink">말의 무게</span> · 말에는 그에 따르는 책임이 있음을 늘 견지합니다.
                </span>
              </li>
            </ul>
          </div>

          <p
            className="font-serif text-ink leading-relaxed pt-2"
            style={{ fontSize: "var(--fs-title-h4)" }}
          >
            지금, 당신의 논리로 사회를 발전시켜 보세요.
          </p>
        </div>
      </section>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-center">
        <Link
          href="/proposal"
          className="text-center px-[22px] py-[12px] text-button-large font-medium bg-dark text-paper-cream rounded-md hover:bg-deep transition-colors"
        >
          ＋ 주제 만들기
        </Link>
        {session?.user ? (
          <Link
            href="/me"
            className="text-center px-[22px] py-[12px] text-button-large font-medium bg-card text-ink border-[0.5px] border-border rounded-md hover:bg-soft transition-colors"
          >
            내 정보
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-center px-[22px] py-[12px] text-button-large font-medium bg-card text-ink border-[0.5px] border-border rounded-md hover:bg-soft transition-colors"
          >
            로그인
          </Link>
        )}
      </div>
    </>
  );
}
