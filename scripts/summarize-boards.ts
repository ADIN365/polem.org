#!/usr/bin/env tsx
/**
 * 50:50 양측 요약 cron worker. 일 1~2회.
 * - 활성 게시판 중 *마지막 요약 24시간 이상 경과 + 의견 4개 이상* 인 board 처리
 * - claude -p 헤드리스
 */
import "dotenv/config";

import { existsSync, writeFileSync, unlinkSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { summarizeBoard } from "../lib/ai/summarize-board";

const LOCK = "/tmp/polem-summary.lock";
const BATCH_SIZE = 5;
const STALE_HOURS = 24;

async function main() {
  if (existsSync(LOCK)) {
    console.error("[summary] skip: 다른 실행 진행 중");
    process.exit(0);
  }
  writeFileSync(LOCK, `${process.pid} ${new Date().toISOString()}\n`);

  const prisma = new PrismaClient();
  let processed = 0;
  let failed = 0;
  const cutoff = new Date(Date.now() - STALE_HOURS * 60 * 60 * 1000);

  try {
    const boards = await prisma.board.findMany({
      where: {
        status: "ACTIVE",
        OR: [{ aiSummaryAt: null }, { aiSummaryAt: { lt: cutoff } }],
        proCount: { gt: 0 },
        conCount: { gt: 0 },
      },
      orderBy: { updatedAt: "desc" },
      take: BATCH_SIZE,
      select: { id: true, title: true },
    });

    if (boards.length === 0) {
      console.log("[summary] 처리할 게시판 없음.");
      return;
    }
    console.log(`[summary] 시작: ${boards.length}건`);

    for (const b of boards) {
      try {
        const pins = await prisma.pin.findMany({
          where: { boardId: b.id, hidden: false, deleted: false },
          orderBy: [{ createdAt: "desc" }],
          take: 100,
          select: { side: true, body: true },
        });
        const summary = await summarizeBoard(b.title, pins);
        if (!summary) {
          console.log(`[summary] ${b.id.slice(0, 8)} skip — 의견 부족 또는 파싱 실패`);
          continue;
        }
        await prisma.board.update({
          where: { id: b.id },
          data: {
            aiSummaryPro: summary.pro,
            aiSummaryCon: summary.con,
            aiSummaryAt: new Date(),
          },
        });
        processed += 1;
        console.log(`[summary] ${b.id.slice(0, 8)} → ${summary.pro.slice(0, 40)} / ${summary.con.slice(0, 40)}`);
      } catch (e) {
        failed += 1;
        console.error(`[summary] ${b.id.slice(0, 8)} 실패:`, e instanceof Error ? e.message : e);
      }
    }

    console.log(`[summary] 완료: 성공 ${processed} / 실패 ${failed}`);
  } finally {
    await prisma.$disconnect();
    if (existsSync(LOCK)) unlinkSync(LOCK);
  }
}

main().catch((e) => {
  console.error("[summary] 치명 오류:", e);
  if (existsSync(LOCK)) unlinkSync(LOCK);
  process.exit(1);
});
