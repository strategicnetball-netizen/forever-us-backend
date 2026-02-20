-- CreateTable
CREATE TABLE "UndoAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "pointsRefunded" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UndoAction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "UndoAction_userId_idx" ON "UndoAction"("userId");

-- CreateIndex
CREATE INDEX "UndoAction_createdAt_idx" ON "UndoAction"("createdAt");
