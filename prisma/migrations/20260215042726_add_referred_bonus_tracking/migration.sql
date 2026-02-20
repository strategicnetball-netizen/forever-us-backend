-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "pointsAwarded" INTEGER NOT NULL DEFAULT 20,
    "referredBonusAwarded" BOOLEAN NOT NULL DEFAULT false,
    "referredBonusAmount" INTEGER NOT NULL DEFAULT 15,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Referral" ("createdAt", "id", "pointsAwarded", "referredId", "referrerId") SELECT "createdAt", "id", "pointsAwarded", "referredId", "referrerId" FROM "Referral";
DROP TABLE "Referral";
ALTER TABLE "new_Referral" RENAME TO "Referral";
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");
CREATE INDEX "Referral_createdAt_idx" ON "Referral"("createdAt");
CREATE UNIQUE INDEX "Referral_referrerId_referredId_key" ON "Referral"("referrerId", "referredId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
