-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "photos" TEXT,
    "videoUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationPhotoUrl" TEXT,
    "introVideoUrl" TEXT,
    "hasClaimedProfileBonus" BOOLEAN NOT NULL DEFAULT false,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "pausedUntil" DATETIME,
    "lastActivityDate" DATETIME,
    "age" INTEGER,
    "gender" TEXT,
    "location" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "trialTier" TEXT,
    "trialExpiresAt" DATETIME,
    "likesUsedToday" INTEGER NOT NULL DEFAULT 0,
    "lastLikeResetDate" DATETIME,
    "messagesUsedToday" INTEGER NOT NULL DEFAULT 0,
    "lastMessageResetDate" DATETIME,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "lastSignInDate" DATETIME,
    "weeklySignInCount" INTEGER NOT NULL DEFAULT 0,
    "weeklySignInResetDate" DATETIME,
    "lastAdCompletedAt" DATETIME,
    "adCompletionsToday" INTEGER NOT NULL DEFAULT 0,
    "adCompletionsResetDate" DATETIME,
    "fraudScore" INTEGER NOT NULL DEFAULT 0,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "referralCode" TEXT,
    "referredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("adCompletionsResetDate", "adCompletionsToday", "age", "avatar", "bio", "city", "country", "createdAt", "email", "fraudScore", "gender", "hasClaimedProfileBonus", "id", "introVideoUrl", "isAdmin", "isFlagged", "isPaused", "isVerified", "lastActivityDate", "lastAdCompletedAt", "lastSignInDate", "location", "name", "password", "pausedUntil", "photos", "points", "referralCode", "referredById", "state", "tier", "trialExpiresAt", "trialTier", "updatedAt", "verificationPhotoUrl", "videoUrl", "weeklySignInCount", "weeklySignInResetDate") SELECT "adCompletionsResetDate", "adCompletionsToday", "age", "avatar", "bio", "city", "country", "createdAt", "email", "fraudScore", "gender", "hasClaimedProfileBonus", "id", "introVideoUrl", "isAdmin", "isFlagged", "isPaused", "isVerified", "lastActivityDate", "lastAdCompletedAt", "lastSignInDate", "location", "name", "password", "pausedUntil", "photos", "points", "referralCode", "referredById", "state", "tier", "trialExpiresAt", "trialTier", "updatedAt", "verificationPhotoUrl", "videoUrl", "weeklySignInCount", "weeklySignInResetDate" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_tier_idx" ON "User"("tier");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
