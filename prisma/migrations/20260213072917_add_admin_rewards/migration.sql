-- CreateTable
CREATE TABLE "AdminReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "adminId" TEXT NOT NULL,
    "userId" TEXT,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "bulkDistribution" BOOLEAN NOT NULL DEFAULT false,
    "recipientCount" INTEGER NOT NULL DEFAULT 1,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminReward_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdminReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AdminReward_adminId_idx" ON "AdminReward"("adminId");

-- CreateIndex
CREATE INDEX "AdminReward_userId_idx" ON "AdminReward"("userId");

-- CreateIndex
CREATE INDEX "AdminReward_createdAt_idx" ON "AdminReward"("createdAt");
