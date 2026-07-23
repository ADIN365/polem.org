// 카테고리 메타 — 라벨·slug·설명. Category enum 과 1:1.
import type { Category } from "@prisma/client";

export interface CategoryMeta {
  key: Category;
  slug: string;
  label: string;
  emoji: string;
  desc: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "SOCIETY", slug: "society", label: "사회쟁점", emoji: "⚖️", desc: "사형제·기본소득·정년연장 같은 사회적 논쟁" },
  { key: "MONEY", slug: "money", label: "돈·경제", emoji: "💰", desc: "전세 vs 월세, 저축 vs 투자 같은 선택" },
  { key: "WORK", slug: "work", label: "직장·커리어", emoji: "💼", desc: "워라밸 vs 연봉, 대기업 vs 스타트업" },
  { key: "LOVE", slug: "love", label: "연애·관계", emoji: "💬", desc: "연애·결혼·인간관계의 갈림길" },
  { key: "LIFE", slug: "life", label: "일상·소비", emoji: "🍽️", desc: "먹고 쓰고 사는 일상의 밸런스" },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));
const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));

export function categoryBySlug(slug: string): CategoryMeta | undefined {
  return BY_SLUG.get(slug);
}

export function categoryMeta(key: Category): CategoryMeta {
  return BY_KEY.get(key)!;
}
