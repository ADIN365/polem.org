-- CreateEnum
CREATE TYPE "AISummaryRequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiCitationCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "AISummaryCitation" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "side" "PinSide" NOT NULL,
    "pinId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AISummaryCitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISummaryRequest" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "requestedById" TEXT NOT NULL,
    "status" "AISummaryRequestStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "AISummaryRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AISummaryCitation_pinId_idx" ON "AISummaryCitation"("pinId");

-- CreateIndex
CREATE INDEX "AISummaryCitation_boardId_side_order_idx" ON "AISummaryCitation"("boardId", "side", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AISummaryCitation_boardId_side_pinId_key" ON "AISummaryCitation"("boardId", "side", "pinId");

-- CreateIndex
CREATE INDEX "AISummaryRequest_status_createdAt_idx" ON "AISummaryRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AISummaryRequest_boardId_status_idx" ON "AISummaryRequest"("boardId", "status");

-- AddForeignKey
ALTER TABLE "AISummaryCitation" ADD CONSTRAINT "AISummaryCitation_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISummaryCitation" ADD CONSTRAINT "AISummaryCitation_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISummaryRequest" ADD CONSTRAINT "AISummaryRequest_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISummaryRequest" ADD CONSTRAINT "AISummaryRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
