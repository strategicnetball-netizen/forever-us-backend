-- CreateTable
CREATE TABLE "TickerMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "action" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "TickerMessage_isActive_idx" ON "TickerMessage"("isActive");

-- CreateIndex
CREATE INDEX "TickerMessage_order_idx" ON "TickerMessage"("order");
