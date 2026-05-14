import { LegalLayout } from "@/components/legal/LegalLayout";
import { SITE_NAME } from "@/lib/constants";

export const metadata = { title: "개인정보처리방침" };

export default function PrivacyPage() {
  return (
    <LegalLayout title="개인정보처리방침" updated="2026-05-09">
      <p>
        {SITE_NAME}(이하 &ldquo;서비스&rdquo;)는 개인정보보호법 및 정보통신망법을 준수하며, 다음과 같이 개인정보를 처리합니다.
      </p>

      <h2>1. 수집 항목</h2>
      <ul>
        <li>OAuth 인증 시: 카카오/네이버 계정 식별자(providerAccountId), 이메일(선택)</li>
        <li>회원 가입 시: 닉네임 (사용자가 직접 입력)</li>
        <li>이용 기록: 의견·동조·블라인드 답변·신고 내역, 접속 IP·User-Agent (관리·보안 목적)</li>
        <li>가치관 4축 측정: Likert 답변 12개 (본인 외 비공개)</li>
      </ul>
      <p>
        본명·휴대전화·생년월일·성별·프로필 사진 등은 *수집하지 않습니다*. 사이트 닉네임은 사용자가 직접 정한 별명입니다.
      </p>

      <h2>2. 수집 목적</h2>
      <ul>
        <li>회원 식별·인증 및 계정 관리</li>
        <li>의견·댓글·신고 등 서비스 기능 제공</li>
        <li>이용약관 위반 대응 및 분쟁 해결</li>
        <li>본인에게만 제공되는 *가치관 4축 좌표* 와 *토론 주제별 자기 거울* 산출</li>
      </ul>

      <h2>3. 보관 기간</h2>
      <ul>
        <li>회원 정보: 회원 탈퇴 시까지. 탈퇴 후 즉시 삭제 (관계 법령에 의한 보관 의무 항목 제외)</li>
        <li>이용 기록·접속 로그: 6개월 (정보통신망법 제15조의2)</li>
        <li>의견·댓글: 영구 보관 (서비스 성격). 탈퇴 시 작성자는 익명화하되 콘텐츠 자체는 보존</li>
      </ul>

      <h2>4. 제3자 제공</h2>
      <p>
        법령 또는 사법기관의 적법한 요청이 있는 경우를 제외하고 제3자에게 제공하지 않습니다.
      </p>

      <h2>5. 처리 위탁</h2>
      <ul>
        <li>호스팅: Vercel Inc. (미국)</li>
        <li>데이터베이스: Neon (Singapore region)</li>
        <li>OAuth: Kakao Corp., Naver Cloud Corp.</li>
        <li>AI 의견정리·정제: Anthropic / OpenAI / Google (사용자 본문이 모델에 전송됩니다)</li>
      </ul>
      <p>
        AI 모델 호출 시 *의견 본문·토론 주제 제목* 등이 처리 위탁됩니다. 개인 식별 정보는 전송되지 않습니다.
      </p>

      <h2>6. 정보주체의 권리</h2>
      <p>
        정보주체는 언제든 개인정보 열람·정정·삭제·처리정지를 요청할 수 있습니다. 회원은 *내 정보* 페이지에서 직접 닉네임 변경, 가치관 점수 재측정, 회원 탈퇴를 진행할 수 있습니다.
      </p>

      <h2>7. 안전성 확보</h2>
      <ul>
        <li>HTTPS 전 구간 암호화</li>
        <li>OAuth 토큰·세션은 Secure HttpOnly 쿠키로 전송</li>
        <li>데이터베이스 접근 제한 및 운영자 최소 권한</li>
        <li>비밀번호는 수집·저장하지 않습니다 (소셜 OAuth 만 사용)</li>
      </ul>

      <h2>8. 정보보호 책임자</h2>
      <p>
        성명/연락처: 운영자 (contact@polem.org)
      </p>

      <h2>9. 변경 이력</h2>
      <p>방침 변경 시 사이트 내 공지 및 본 페이지 *최종 업데이트* 일자로 안내합니다.</p>
    </LegalLayout>
  );
}
