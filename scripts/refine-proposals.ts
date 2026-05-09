#!/usr/bin/env tsx
/**
 * 주제(발제) 정제 cron worker.
 * 로컬 launchd 가 5분마다 실행. PENDING + 미정제 Proposal 가져와 claude -p 헤드리스로 정제.
 *
 * - Vercel 서버리스에선 사용 X (claude CLI 없음).
 * - DATABASE_URL 은 ~/polem/.env (Direct URL — DDL 가능, prepared statements OK).
 * - 단일 실행 락: /tmp/polem-refine.lock 파일.
 */
import "dotenv/config";

import { existsSync, writeFileSync, unlinkSync } from "node:fs";

import { PrismaClient } from "@prisma/client";

import { refineProposal } from "../lib/ai/refine-proposal";

const LOCK = "/tmp/polem-refine.lock";
const BATCH_SIZE = 5;

async function main() {
  if (existsSync(LOCK)) {
    console.error("[refine] 다른 실행이 진행 중. skip.");
    process.exit(0);
  }
  writeFileSync(LOCK, `${process.pid} ${new Date().toISOString()}\n`);

  const prisma = new PrismaClient();
  let processed = 0;
  let failed = 0;
  try {
    const queue = await prisma.proposal.findMany({
      where: {
        status: "PENDING",
        aiTitle: null,
        aiFiltered: false,
      },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
    });

    if (queue.length === 0) {
      console.log("[refine] 처리할 주제 없음.");
      return;
    }

    console.log(`[refine] 시작: ${queue.length}건`);

    for (const p of queue) {
      try {
        const r = await refineProposal(p.rawTitle, p.rawBody);
        await prisma.proposal.update({
          where: { id: p.id },
          data: {
            aiTitle: r.aiTitle,
            aiCategory: r.aiCategory,
            aiFiltered: r.aiFiltered,
            // 차단 사유는 rejectionReason 에 저장 (관리자 큐에서 함께 표시)
            rejectionReason: r.aiFiltered ? r.filterReason : null,
          },
        });
        processed += 1;
        console.log(
          `[refine] ${p.id.slice(0, 8)} → ${
            r.aiFiltered ? `차단(${r.filterReason ?? "?"})` : `${r.aiCategory} · ${r.aiTitle ?? "?"}`
          }`,
        );
      } catch (e) {
        failed += 1;
        console.error(`[refine] ${p.id.slice(0, 8)} 실패:`, e instanceof Error ? e.message : e);
      }
    }

    console.log(`[refine] 완료: 성공 ${processed} / 실패 ${failed}`);
  } finally {
    await prisma.$disconnect();
    if (existsSync(LOCK)) unlinkSync(LOCK);
  }
}

main().catch((e) => {
  console.error("[refine] 치명 오류:", e);
  if (existsSync(LOCK)) unlinkSync(LOCK);
  process.exit(1);
});
