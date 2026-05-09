// 사이트 정체성 — 변경 시 SEO 메타·TopNav 브랜드 등 함께 갱신.
export const SITE_NAME = "끝장토론";
export const SITE_DOMAIN = "polem.org";
export const SITE_URL =
  process.env.NEXTAUTH_URL ?? "https://polem.org";
export const SITE_DESCRIPTION =
  "정치·사회 토론 광장. 토론 주제별 영구 보관, 자기 거울로 비춰보는 한 발 깊은 토론.";

// 상단 메뉴는 비움 — 토론 주제(홈)는 브랜드 클릭, 내정보는 우상단 동그라미, 주제 만들기·3문항은 /me
// 또는 토론 주제 색인에서 진입. 헌법 §2.5 "광장" 정신상 메뉴 단순화.
export const NAV_LINKS: { href: string; label: string }[] = [];

// 카테고리 라벨 (Prisma Category enum 과 1:1)
export const CATEGORY_LABEL: Record<string, string> = {
  POLITICS: "정치",
  ECONOMY: "경제",
  SOCIETY: "사회",
  CULTURE: "문화",
  FOREIGN_AFFAIRS: "외교·안보",
  ENVIRONMENT: "환경·과학",
};

export const CATEGORY_OPTIONS = [
  { value: "POLITICS", label: "정치" },
  { value: "ECONOMY", label: "경제" },
  { value: "SOCIETY", label: "사회" },
  { value: "CULTURE", label: "문화" },
  { value: "FOREIGN_AFFAIRS", label: "외교·안보" },
  { value: "ENVIRONMENT", label: "환경·과학" },
] as const;
