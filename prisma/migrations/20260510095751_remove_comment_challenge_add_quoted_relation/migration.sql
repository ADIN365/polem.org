-- DropForeignKey
ALTER TABLE "Challenge" DROP CONSTRAINT IF EXISTS "Challenge_challengerId_fkey";
ALTER TABLE "Challenge" DROP CONSTRAINT IF EXISTS "Challenge_pinId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_authorId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_pinId_fkey";
ALTER TABLE "Comment" DROP CONSTRAINT IF EXISTS "Comment_parentId_fkey";

-- DropTable
DROP TABLE IF EXISTS "Challenge";
DROP TABLE IF EXISTS "Comment";

-- AlterEnum (remove COMMENT)
ALTER TYPE "ReportTargetType" RENAME TO "ReportTargetType_old";
CREATE TYPE "ReportTargetType" AS ENUM ('PIN', 'USER');
ALTER TABLE "Report" ALTER COLUMN "targetType" TYPE "ReportTargetType" USING "targetType"::text::"ReportTargetType";
DROP TYPE "ReportTargetType_old";

-- CreateEnum
CREATE TYPE "QuotedRelation" AS ENUM ('AGREE', 'REBUT');

-- AlterTable
ALTER TABLE "Pin"
  ADD COLUMN "quotedRelation" "QuotedRelation",
  ADD COLUMN "quoteAgreeCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "quoteRebutCount" INTEGER NOT NULL DEFAULT 0;
