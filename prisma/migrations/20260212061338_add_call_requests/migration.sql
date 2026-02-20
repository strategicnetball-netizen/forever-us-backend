-- CreateTable
CREATE TABLE "CallRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callerId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "callType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "CallRequest_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CallRequest_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CallRequest_callerId_idx" ON "CallRequest"("callerId");

-- CreateIndex
CREATE INDEX "CallRequest_recipientId_idx" ON "CallRequest"("recipientId");

-- CreateIndex
CREATE INDEX "CallRequest_status_idx" ON "CallRequest"("status");

-- CreateIndex
CREATE INDEX "CallRequest_createdAt_idx" ON "CallRequest"("createdAt");
