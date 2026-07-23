/**
 * AI 쟁점 생성기 — 주제 하나를 받아 찬반 근거·균형 요약을 생성하고 DB에 저장.
 *
 * 사용:
 *   npm run gen:issue -- "정년 70세 연장" SOCIETY
 *   npm run gen:issue -- "아침형 인간 vs 저녁형 인간" LIFE
 *
 * 인증: claude 헤드리스(무과금). ~/.secrets/claude.env 의 CLAUDE_CODE_OAUTH_TOKEN.
 * 발행 정책: 균형(각 4개 근거)·중립 톤. 특정 정당·후보 지지/비방 금지.
 */
import { spawn } from "node:child_process";
import { PrismaClient, type Category } from "@prisma/client";

const prisma = new PrismaClient();
const CLAUDE_BIN = process.env.CLAUDE_BIN ?? "claude";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";

const VALID_CATEGORIES: Category[] = ["SOCIETY", "MONEY", "WORK", "LOVE", "LIFE"];

const BANNED = ["멍청", "빨갱이", "수구", "틀딱", "좌빨", "극우", "극좌"]; // 인신·진영 비방 게이트

function baseSlug(topic: string): string {
  // 한글을 유지한다 — 한국어 검색 URL에 유리하고, "vs" 밸런스 주제도 고유해짐.
  const s = topic
    .normalize("NFC") // 슬러그는 NFC로 통일 (URL 왕복·조회 일관성)
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s.length >= 2 ? s : `issue-${Date.now().toString(36)}`;
}

// 충돌 시 -2, -3… 접미사로 고유 슬러그 확보.
async function uniqueSlug(topic: string): Promise<string> {
  const base = baseSlug(topic);
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const hit = await prisma.issue.findUnique({ where: { slug }, select: { id: true } });
    if (!hit) return slug;
  }
}

function buildPrompt(topic: string, category: string): string {
  return [
    "당신은 찬반 쟁점을 균형 있게 정리하는 편집자다. 아래 주제에 대해 양측 근거를 중립적으로 정리하라.",
    "",
    `주제: ${topic}`,
    `카테고리: ${category}`,
    "",
    "규칙:",
    "1. 어느 쪽이 옳은지 판정하지 말 것. 양측을 대등하게.",
    "2. 각 측 근거는 정확히 4개. 사실에 기반하고, 없는 통계·수치를 지어내지 말 것.",
    "3. 특정 정당·정치인·인물에 대한 지지나 비방 금지. 인신공격·혐오 표현 금지.",
    "4. proLabel/conLabel: 사회쟁점은 보통 찬성/반대. 밸런스형은 자유(예: 전세/월세).",
    "5. question은 투표용 짧은 질문. title은 검색용(예: 'X 찬반 근거 정리').",
    "6. 응답은 JSON 한 줄만. 코드펜스·설명 금지.",
    "",
    "형식:",
    '{"title":"","question":"","summary":"(80자 이내)","body":"(배경 2~3문장)","proLabel":"","conLabel":"","proArgs":["","","",""],"conArgs":["","","",""],"aiBalance":"(양측 핵심 중립 요약 한 문단)","tags":["","",""]}',
  ].join("\n");
}

function callClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(CLAUDE_BIN, ["-p", "--model", CLAUDE_MODEL], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => (code === 0 ? resolve(out) : reject(new Error(`claude exit ${code}: ${err || out}`))));
    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

function parse(raw: string): Record<string, unknown> {
  let t = raw.trim();
  const fence = t.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fence) t = fence[1];
  else {
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a !== -1 && b > a) t = t.slice(a, b + 1);
  }
  return JSON.parse(t);
}

function asArgs(v: unknown): string[] {
  if (!Array.isArray(v)) throw new Error("근거가 배열이 아님");
  const arr = v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
  if (arr.length < 3) throw new Error("근거가 3개 미만");
  return arr.slice(0, 5);
}

async function main() {
  const topic = process.argv[2];
  const catArg = (process.argv[3] ?? "SOCIETY").toUpperCase() as Category;
  if (!topic) {
    console.error('사용법: npm run gen:issue -- "주제" [SOCIETY|MONEY|WORK|LOVE|LIFE]');
    process.exit(1);
  }
  const category: Category = VALID_CATEGORIES.includes(catArg) ? catArg : "SOCIETY";

  console.log(`생성 중: "${topic}" (${category})`);
  const raw = await callClaude(buildPrompt(topic, category));
  const data = parse(raw);

  const combined = JSON.stringify(data);
  const hit = BANNED.find((w) => combined.includes(w));
  if (hit) throw new Error(`금지어 감지: ${hit} — 발행 중단`);

  const title = String(data.title ?? "").trim();
  const question = String(data.question ?? "").trim();
  if (!title || !question) throw new Error("title/question 누락");

  const slug = await uniqueSlug(topic);
  const issue = await prisma.issue.create({
    data: {
      slug,
      title,
      question,
      summary: String(data.summary ?? "").trim() || null,
      body: String(data.body ?? "").trim() || null,
      category,
      proLabel: String(data.proLabel ?? "찬성").trim() || "찬성",
      conLabel: String(data.conLabel ?? "반대").trim() || "반대",
      proArgs: asArgs(data.proArgs),
      conArgs: asArgs(data.conArgs),
      aiBalance: String(data.aiBalance ?? "").trim() || null,
      tags: Array.isArray(data.tags) ? (data.tags as string[]).filter((x) => typeof x === "string").slice(0, 5) : [],
      status: "PUBLISHED",
    },
  });
  console.log(`발행 완료: /issue/${issue.slug}\n  ${issue.title}`);
}

main()
  .catch((e) => {
    console.error("실패:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
