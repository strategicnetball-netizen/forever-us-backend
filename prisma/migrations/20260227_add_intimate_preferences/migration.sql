-- CreateTable IntimatePreferences
CREATE TABLE "IntimatePreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "dominanceSubmission" TEXT,
    "bondage" TEXT,
    "roleplay" TEXT,
    "voyeurism" TEXT,
    "communicationStyle" TEXT,
    "boundaries" TEXT,
    "frequency" TEXT,
    "customNotes" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT 0,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT 0,
    "moderationNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntimatePreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "IntimatePreferences_userId_idx" ON "IntimatePreferences"("userId");
