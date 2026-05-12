/**
 * AI 요약 갱신 워커.
 * - DB의 AISummaryRequest 큐에서 PENDING 1건 가져옴
 * - 게시판 의견들을 모아 `claude -p` 헤드리스 호출
 * - 응답 JSON 파싱 → AISummary 본문 / 인용 / 작가 카운트 업데이트
 *
 * 호출: tsx scripts/ai-summary-worker.ts  (launchd가 5분마다 트리거)
 */

import { spawn } from "node:child_process";
import process from "node:process";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CLAUDE_BIN = process.env.CLAUDE_BIN ?? "claude";
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-haiku-4-5-20251001";
const MAX_PINS_FOR_PROMPT = 100; // 토큰 보호. 의견 너무 많으면 최신 N개

interface ParsedResponse {
  proSummary: string;
  conSummary: string;
  proCitations: string[]; // pin ids
  conCitations: string[];
}

async function main() {
  // 1. PENDING 큐 1건 잡고 PROCESSING 으로 마크 (단일 트랜잭션으로 race 방지)
  const req = await claimNextRequest();
  if (!req) {
    console.log("[worker] no pending requests");
    return;
  }
  console.log(`[worker] processing request=${req.id} board=${req.boardId}`);

  try {
    await processRequest(req.id, req.boardId);
    await prisma.aISummaryRequest.update({
      where: { id: req.id },
      data: { status: "COMPLETED", processedAt: new Date() },
    });
    console.log(`[worker] OK request=${req.id}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[worker] FAIL request=${req.id}: ${msg}`);
    await prisma.aISummaryRequest.update({
      where: { id: req.id },
      data: {
        status: "FAILED",
        error: msg.slice(0, 500),
        processedAt: new Date(),
      },
    });
  }
}

async function claimNextRequest() {
  return prisma.$transaction(async (tx) => {
    const next = await tx.aISummaryRequest.findFirst({
      where: { status: "PENDING" },
      orderBy: { createdAt: "asc" },
      select: { id: true, boardId: true },
    });
    if (!next) return null;
    await tx.aISummaryRequest.update({
      where: { id: next.id },
      data: { status: "PROCESSING" },
    });
    return next;
  });
}

async function processRequest(_requestId: string, boardId: string) {
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, title: true, body: true, status: true },
  });
  if (!board) throw new Error("게시판을 찾을 수 없어요");
  if (board.status === "HIDDEN") throw new Error("숨김 처리된 게시판");

  const pins = await prisma.pin.findMany({
    where: { boardId, hidden: false, deleted: false },
    orderBy: { createdAt: "desc" },
    take: MAX_PINS_FOR_PROMPT,
    select: {
      id: true,
      side: true,
      body: true,
      authorId: true,
      author: { select: { nickname: true, name: true } },
    },
  });

  const proPins = pins.filter((p) => p.side === "PRO");
  const conPins = pins.filter((p) => p.side === "CON");
  if (proPins.length < 2 || conPins.length < 2) {
    throw new Error("의견이 너무 적어요 (찬/반 각 2개 이상 필요)");
  }

  const prompt = buildPrompt(board, proPins, conPins);
  const raw = await callClaude(prompt);
  const parsed = parseResponse(raw, new Set(pins.map((p) => p.id)));

  // pinId → authorId 매핑
  const pinAuthor = new Map(pins.map((p) => [p.id, p.authorId]));

  await prisma.$transaction(async (tx) => {
    // 1. 기존 인용 작가 카운트 감산
    const old = await tx.aISummaryCitation.findMany({
      where: { boardId },
      select: { pin: { select: { authorId: true } } },
    });
    for (const o of old) {
      await tx.user.update({
        where: { id: o.pin.authorId },
        data: { aiCitationCount: { decrement: 1 } },
      });
    }

    // 2. 기존 인용 삭제
    await tx.aISummaryCitation.deleteMany({ where: { boardId } });

    // 3. Board 요약 본문 업데이트
    await tx.board.update({
      where: { id: boardId },
      data: {
        aiSummaryPro: parsed.proSummary,
        aiSummaryCon: parsed.conSummary,
        aiSummaryAt: new Date(),
      },
    });

    // 4. 새 인용 INSERT + 작가 카운트 +1
    const newCitations: { side: "PRO" | "CON"; pinId: string; order: number }[] = [
      ...parsed.proCitations.map((pinId, i) => ({ side: "PRO" as const, pinId, order: i })),
      ...parsed.conCitations.map((pinId, i) => ({ side: "CON" as const, pinId, order: i })),
    ];
    for (const c of newCitations) {
      await tx.aISummaryCitation.create({
        data: { boardId, side: c.side, pinId: c.pinId, order: c.order },
      });
      const authorId = pinAuthor.get(c.pinId);
      if (authorId) {
        await tx.user.update({
          where: { id: authorId },
          data: { aiCitationCount: { increment: 1 } },
        });
      }
    }
  });
}

type PinForPrompt = {
  id: string;
  authorId: string;
  body: string;
  author: { nickname: string | null; name: string | null };
};

function buildPrompt(
  board: { title: string; body: string | null },
  proPins: PinForPrompt[],
  conPins: PinForPrompt[],
): string {
  const fmt = (p: PinForPrompt) =>
    `[id=${p.id}, 작가=@${p.author.nickname ?? p.author.name ?? "익명"}] ${p.body.replace(/\s+/g, " ").trim()}`;

  return [
    "당신은 한국어 정치 토론 게시판의 AI 요약 도우미입니다.",
    "주어진 의견 목록을 보고 찬성/반대 양측을 50:50으로 동등하게 요약하세요.",
    "",
    "규칙:",
    "1. 찬성 요약과 반대 요약은 각각 2~3 문장. 동등한 분량.",
    "2. 각 요약에 핵심 논점 3개를 인용한 의견 id 로 표기.",
    "3. 같은 작가의 의견은 양쪽 합쳐 최대 1개만 인용.",
    "4. 단순 인기 의견이 아니라 *서로 다른 논점* 을 커버하도록 의견 선택.",
    "5. 어느 쪽이 더 강하다 같은 평가 절대 X. 양측 동등하게 정리.",
    "6. 본문은 한국어. 출력은 JSON 만.",
    "",
    `토론 주제: ${board.title}`,
    board.body ? `배경: ${board.body}` : "",
    "",
    `찬성 의견 ${proPins.length}개:`,
    ...proPins.map(fmt),
    "",
    `반대 의견 ${conPins.length}개:`,
    ...conPins.map(fmt),
    "",
    "응답은 반드시 다음 JSON 형식 (다른 텍스트 없이 JSON 만):",
    `{
  "pro_summary": "찬성 요약 본문",
  "pro_citations": ["pinId1", "pinId2", "pinId3"],
  "con_summary": "반대 요약 본문",
  "con_citations": ["pinId4", "pinId5", "pinId6"]
}`,
  ].join("\n");
}

function callClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(CLAUDE_BIN, ["-p", "--model", CLAUDE_MODEL], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d.toString()));
    proc.stderr.on("data", (d) => (stderr += d.toString()));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`claude exit ${code}: ${stderr || stdout}`));
        return;
      }
      resolve(stdout);
    });
    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

function parseResponse(raw: string, validPinIds: Set<string>): ParsedResponse {
  // JSON 블록 추출 (코드블록이거나 그냥 JSON 객체)
  let jsonText = raw.trim();
  const codeBlock = jsonText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (codeBlock) {
    jsonText = codeBlock[1];
  } else {
    const first = jsonText.indexOf("{");
    const last = jsonText.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
      jsonText = jsonText.slice(first, last + 1);
    }
  }

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Claude 응답 JSON 파싱 실패: ${e instanceof Error ? e.message : e}\n응답 시작: ${raw.slice(0, 200)}`);
  }

  const proSummary = String(obj.pro_summary ?? "").trim();
  const conSummary = String(obj.con_summary ?? "").trim();
  const proCit = Array.isArray(obj.pro_citations) ? (obj.pro_citations as unknown[]).map(String) : [];
  const conCit = Array.isArray(obj.con_citations) ? (obj.con_citations as unknown[]).map(String) : [];

  if (!proSummary || !conSummary) {
    throw new Error("요약 본문이 비어 있어요");
  }

  // 유효 pinId 만 필터
  const proCitations = proCit.filter((id) => validPinIds.has(id));
  const conCitations = conCit.filter((id) => validPinIds.has(id));

  if (proCitations.length === 0 || conCitations.length === 0) {
    throw new Error(
      `유효한 인용 pinId 가 없어요 (proValid=${proCitations.length}, conValid=${conCitations.length})`,
    );
  }

  return { proSummary, conSummary, proCitations, conCitations };
}

main()
  .catch((err) => {
    console.error("[worker] FATAL", err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
