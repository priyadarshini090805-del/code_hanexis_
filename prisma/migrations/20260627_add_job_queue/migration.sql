-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('OUTREACH', 'FOLLOWUP', 'CONTENT', 'NOTIFICATION');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "JobQueue" (
    "id" TEXT NOT NULL,
    "jobType" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "userId" TEXT,
    "campaignId" TEXT,
    "leadId" TEXT,
    "scheduledContentId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lastAttemptAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "processingStartedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobQueue_jobType_status_idx" ON "JobQueue"("jobType", "status");

-- CreateIndex
CREATE INDEX "JobQueue_status_nextRetryAt_idx" ON "JobQueue"("status", "nextRetryAt");

-- CreateIndex
CREATE INDEX "JobQueue_userId_idx" ON "JobQueue"("userId");

-- CreateIndex
CREATE INDEX "JobQueue_campaignId_idx" ON "JobQueue"("campaignId");
