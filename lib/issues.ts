// Issue 조회 헬퍼 — 모든 DB 접근은 여기 한 곳에.
import { prisma } from "@/lib/prisma";
import type { Category, Issue } from "@prisma/client";

export type IssueCard = Pick<
  Issue,
  "id" | "slug" | "title" | "question" | "summary" | "category" | "proLabel" | "conLabel" | "proVotes" | "conVotes" | "viewCount" | "publishedAt"
>;

const CARD_SELECT = {
  id: true,
  slug: true,
  title: true,
  question: true,
  summary: true,
  category: true,
  proLabel: true,
  conLabel: true,
  proVotes: true,
  conVotes: true,
  viewCount: true,
  publishedAt: true,
} as const;

export async function getRecentIssues(limit = 30): Promise<IssueCard[]> {
  return prisma.issue.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: CARD_SELECT,
  });
}

export async function getHotIssues(limit = 6): Promise<IssueCard[]> {
  // 참여(총 투표수) 많은 순 — 홈 상단 노출용.
  const rows = await prisma.issue.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    take: 60,
    select: CARD_SELECT,
  });
  return rows
    .sort((a, b) => b.proVotes + b.conVotes - (a.proVotes + a.conVotes))
    .slice(0, limit);
}

export async function getIssuesByCategory(category: Category, limit = 40): Promise<IssueCard[]> {
  return prisma.issue.findMany({
    where: { status: "PUBLISHED", category },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: CARD_SELECT,
  });
}

// 라우트 파라미터는 퍼센트 인코딩 상태로 올 수 있고(한글), URL 왕복에서 NFD가
// 될 수 있다. 디코딩 후 NFC로 정규화해 DB(NFC 저장)와 일치시킨다.
export function normalizeSlug(raw: string): string {
  let s = raw;
  try {
    s = decodeURIComponent(raw);
  } catch {
    // 이미 디코딩됐거나 %가 없으면 그대로
  }
  return s.normalize("NFC");
}

export async function getIssueBySlug(slug: string): Promise<Issue | null> {
  return prisma.issue.findUnique({ where: { slug: normalizeSlug(slug) } });
}

export async function getAllPublishedSlugs(): Promise<{ slug: string; updatedAt: Date }[]> {
  return prisma.issue.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });
}

// 근거 배열 파싱 (Json 컬럼 → string[])
export function argList(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

export interface CommentView {
  id: string;
  body: string;
  side: string | null;
  createdAt: string;
}

export async function getVisibleComments(issueId: string, limit = 100): Promise<CommentView[]> {
  const rows = await prisma.comment.findMany({
    where: { issueId, status: "VISIBLE" },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, body: true, side: true, createdAt: true },
  });
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}
