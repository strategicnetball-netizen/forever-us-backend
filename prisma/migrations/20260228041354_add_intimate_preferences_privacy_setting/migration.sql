-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IntimatePreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "dominanceSubmission" TEXT,
    "bondage" TEXT,
    "roleplay" TEXT,
    "voyeurism" TEXT,
    "communicationStyle" TEXT,
    "boundaries" TEXT,
    "frequency" TEXT,
    "customNotes" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "flaggedForReview" BOOLEAN NOT NULL DEFAULT false,
    "moderationNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "IntimatePreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_IntimatePreferences" ("bondage", "boundaries", "communicationStyle", "createdAt", "customNotes", "dominanceSubmission", "flaggedForReview", "frequency", "id", "isPublic", "moderationNotes", "roleplay", "updatedAt", "userId", "voyeurism") SELECT "bondage", "boundaries", "communicationStyle", "createdAt", "customNotes", "dominanceSubmission", "flaggedForReview", "frequency", "id", "isPublic", "moderationNotes", "roleplay", "updatedAt", "userId", "voyeurism" FROM "IntimatePreferences";
DROP TABLE "IntimatePreferences";
ALTER TABLE "new_IntimatePreferences" RENAME TO "IntimatePreferences";
CREATE UNIQUE INDEX "IntimatePreferences_userId_key" ON "IntimatePreferences"("userId");
CREATE INDEX "IntimatePreferences_userId_idx" ON "IntimatePreferences"("userId");
CREATE TABLE "new_LifestyleQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LifestyleQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_LifestyleQuestionnaire" ("answers", "completedAt", "createdAt", "id", "updatedAt", "userId") SELECT "answers", "completedAt", "createdAt", "id", "updatedAt", "userId" FROM "LifestyleQuestionnaire";
DROP TABLE "LifestyleQuestionnaire";
ALTER TABLE "new_LifestyleQuestionnaire" RENAME TO "LifestyleQuestionnaire";
CREATE UNIQUE INDEX "LifestyleQuestionnaire_userId_key" ON "LifestyleQuestionnaire"("userId");
CREATE INDEX "LifestyleQuestionnaire_userId_idx" ON "LifestyleQuestionnaire"("userId");
CREATE TABLE "new_PersonalityQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonalityQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PersonalityQuestionnaire" ("answers", "completedAt", "createdAt", "id", "updatedAt", "userId") SELECT "answers", "completedAt", "createdAt", "id", "updatedAt", "userId" FROM "PersonalityQuestionnaire";
DROP TABLE "PersonalityQuestionnaire";
ALTER TABLE "new_PersonalityQuestionnaire" RENAME TO "PersonalityQuestionnaire";
CREATE UNIQUE INDEX "PersonalityQuestionnaire_userId_key" ON "PersonalityQuestionnaire"("userId");
CREATE INDEX "PersonalityQuestionnaire_userId_idx" ON "PersonalityQuestionnaire"("userId");
CREATE TABLE "new_QuestionnaireCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "coinsRewarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuestionnaireCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QuestionnaireCompletion" ("coinsRewarded", "completed", "completedAt", "createdAt", "id", "type", "updatedAt", "userId") SELECT "coinsRewarded", "completed", "completedAt", "createdAt", "id", "type", "updatedAt", "userId" FROM "QuestionnaireCompletion";
DROP TABLE "QuestionnaireCompletion";
ALTER TABLE "new_QuestionnaireCompletion" RENAME TO "QuestionnaireCompletion";
CREATE INDEX "QuestionnaireCompletion_userId_idx" ON "QuestionnaireCompletion"("userId");
CREATE INDEX "QuestionnaireCompletion_type_idx" ON "QuestionnaireCompletion"("type");
CREATE UNIQUE INDEX "QuestionnaireCompletion_userId_type_key" ON "QuestionnaireCompletion"("userId", "type");
CREATE TABLE "new_RelationshipGoalsQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RelationshipGoalsQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_RelationshipGoalsQuestionnaire" ("answers", "completedAt", "createdAt", "id", "updatedAt", "userId") SELECT "answers", "completedAt", "createdAt", "id", "updatedAt", "userId" FROM "RelationshipGoalsQuestionnaire";
DROP TABLE "RelationshipGoalsQuestionnaire";
ALTER TABLE "new_RelationshipGoalsQuestionnaire" RENAME TO "RelationshipGoalsQuestionnaire";
CREATE UNIQUE INDEX "RelationshipGoalsQuestionnaire_userId_key" ON "RelationshipGoalsQuestionnaire"("userId");
CREATE INDEX "RelationshipGoalsQuestionnaire_userId_idx" ON "RelationshipGoalsQuestionnaire"("userId");
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
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
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
    "passesUsedToday" INTEGER NOT NULL DEFAULT 0,
    "lastPassResetDate" DATETIME,
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
    "intimatePreferencesAgreed" BOOLEAN NOT NULL DEFAULT false,
    "intimatePreferencesAgreedAt" DATETIME,
    "intimatePreferencesAgreedVersion" TEXT,
    "intimatePreferencesAgreedIP" TEXT,
    "wantToSeeIntimatePreferences" BOOLEAN NOT NULL DEFAULT true,
    "personalityType" TEXT,
    "profileScore" INTEGER,
    "profileCompletion" INTEGER,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("adCompletionsResetDate", "adCompletionsToday", "age", "avatar", "bio", "city", "country", "createdAt", "email", "fraudScore", "gender", "hasClaimedProfileBonus", "id", "intimatePreferencesAgreed", "intimatePreferencesAgreedIP", "intimatePreferencesAgreedVersion", "introVideoUrl", "isAdmin", "isFlagged", "isPaused", "isVerified", "lastActivityDate", "lastAdCompletedAt", "lastLikeResetDate", "lastMessageResetDate", "lastPassResetDate", "lastSignInDate", "likesUsedToday", "location", "messagesUsedToday", "name", "passesUsedToday", "password", "pausedUntil", "photos", "points", "profileCompleted", "referralCode", "referredById", "state", "tier", "trialExpiresAt", "trialTier", "updatedAt", "verificationPhotoUrl", "videoUrl", "weeklySignInCount", "weeklySignInResetDate") SELECT "adCompletionsResetDate", "adCompletionsToday", "age", "avatar", "bio", "city", "country", "createdAt", "email", "fraudScore", "gender", "hasClaimedProfileBonus", "id", "intimatePreferencesAgreed", "intimatePreferencesAgreedIP", "intimatePreferencesAgreedVersion", "introVideoUrl", "isAdmin", "isFlagged", "isPaused", "isVerified", "lastActivityDate", "lastAdCompletedAt", "lastLikeResetDate", "lastMessageResetDate", "lastPassResetDate", "lastSignInDate", "likesUsedToday", "location", "messagesUsedToday", "name", "passesUsedToday", "password", "pausedUntil", "photos", "points", "profileCompleted", "referralCode", "referredById", "state", "tier", "trialExpiresAt", "trialTier", "updatedAt", "verificationPhotoUrl", "videoUrl", "weeklySignInCount", "weeklySignInResetDate" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_tier_idx" ON "User"("tier");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
