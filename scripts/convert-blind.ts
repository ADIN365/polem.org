#!/usr/bin/env tsx
/**
 * 박제 → 블라인드 질문 변환 cron worker.
 * 로컬 launchd 가 5분마다. blindQuestion null + 생성 5분 경과한 박제 처리.
 *
 * 5분 grace: 사용자가 박제 직후 *오늘의 3문항* 에서 자기 박제를 보면 정체 식별 가능 →
 * 약간의 지연으로 가림.
 */
import "dotenv/config";

import { existsSync, writeFileSync, unlinkSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { convertToBlindQuestion } from "../lib/ai/blind-convert";

const LOCK = "/tmp/polem-blind.lock";
const BATCH_SIZE = 8;
const GRACE_MINUTES = 5;

async function main() {
  if (existsSync(LOCK)) {
    console.error("[blind] 다른 실행이 진행 중. skip.");
    process.exit(0);
  }
  writeFileSync(LOCK, `${process.pid} ${new Date().toISOString()}\n`);

  const prisma = new PrismaClient();
  let processed = 0;
  let failed = 0;
  try {
    const queue = await prisma.pin.findMany({
      where: {
        blindQuestion: null,
        hidden: false,
        deleted: false,
        createdAt: { lte: new Date(Date.now() - GRACE_MINUTES * 60 * 1000) },
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      select: {
        id: true,
        body: true,
        board: { select: { title: true } },
      },
    });

    if (queue.length === 0) {
      console.log("[blind] 처리할 박제 없음.");
      return;
    }
    console.log(`[blind] 시작: ${queue.length}건`);

    for (const p of queue) {
      try {
        const q = await convertToBlindQuestion(p.body, p.board.title);
        if (!q || q.length < 5) throw new Error("변환 결과가 비어있음");
        await prisma.pin.update({
          where: { id: p.id },
          data: { blindQuestion: q, blindQuestionAt: new Date() },
        });
        processed += 1;
        console.log(`[blind] ${p.id.slice(0, 8)} → ${q.slice(0, 60)}`);
      } catch (e) {
        failed += 1;
        console.error(`[blind] ${p.id.slice(0, 8)} 실패:`, e instanceof Error ? e.message : e);
      }
    }

    console.log(`[blind] 완료: 성공 ${processed} / 실패 ${failed}`);
  } finally {
    await prisma.$disconnect();
    if (existsSync(LOCK)) unlinkSync(LOCK);
  }
}

main().catch((e) => {
  console.error("[blind] 치명 오류:", e);
  if (existsSync(LOCK)) unlinkSync(LOCK);
  process.exit(1);
});
