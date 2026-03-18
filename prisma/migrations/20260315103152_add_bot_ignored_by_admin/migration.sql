-- CreateTable
CREATE TABLE "Discussion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "authorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Discussion_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DiscussionReply" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "discussionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DiscussionReply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiscussionReply_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "Discussion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "organizerId" TEXT NOT NULL,
    "maxAttendees" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Event_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventAttendee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'interested',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EventAttendee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "age" INTEGER,
    "gender" TEXT,
    "location" TEXT,
    "country" TEXT,
    "state" TEXT,
    "city" TEXT,
    "showAllCountries" BOOLEAN NOT NULL DEFAULT false,
    "selectedCountries" TEXT,
    "lookingFor" TEXT,
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
    "botIgnoredByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "referralCode" TEXT,
    "referredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "personalityType" TEXT,
    "profileScore" INTEGER,
    "profileCompletion" INTEGER,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_User" ("adCompletionsResetDate", "adCompletionsToday", "age", "avatar", "bio", "city", "country", "createdAt", "email", "fraudScore", "gender", "hasClaimedProfileBonus", "id", "introVideoUrl", "isAdmin", "isFlagged", "isPaused", "isVerified", "lastActivityDate", "lastAdCompletedAt", "lastLikeResetDate", "lastMessageResetDate", "lastPassResetDate", "lastSignInDate", "likesUsedToday", "location", "lookingFor", "messagesUsedToday", "name", "passesUsedToday", "password", "pausedUntil", "personalityType", "photos", "points", "profileCompleted", "profileCompletion", "profileScore", "referralCode", "referredById", "selectedCountries", "showAllCountries", "state", "tier", "trialExpiresAt", "trialTier", "updatedAt", "verificationPhotoUrl", "videoUrl", "weeklySignInCount", "weeklySignInResetDate") SELECT "adCompletionsResetDate", "adCompletionsToday", "age", "avatar", "bio", "city", "country", "createdAt", "email", "fraudScore", "gender", "hasClaimedProfileBonus", "id", "introVideoUrl", "isAdmin", "isFlagged", "isPaused", "isVerified", "lastActivityDate", "lastAdCompletedAt", "lastLikeResetDate", "lastMessageResetDate", "lastPassResetDate", "lastSignInDate", "likesUsedToday", "location", "lookingFor", "messagesUsedToday", "name", "passesUsedToday", "password", "pausedUntil", "personalityType", "photos", "points", "profileCompleted", "profileCompletion", "profileScore", "referralCode", "referredById", "selectedCountries", "showAllCountries", "state", "tier", "trialExpiresAt", "trialTier", "updatedAt", "verificationPhotoUrl", "videoUrl", "weeklySignInCount", "weeklySignInResetDate" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
CREATE INDEX "User_tier_idx" ON "User"("tier");
CREATE INDEX "User_country_idx" ON "User"("country");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Event_eventDate_idx" ON "Event"("eventDate");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE INDEX "Event_organizerId_idx" ON "Event"("organizerId");

-- CreateIndex
CREATE INDEX "EventAttendee_eventId_idx" ON "EventAttendee"("eventId");

-- CreateIndex
CREATE INDEX "EventAttendee_userId_idx" ON "EventAttendee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendee_eventId_userId_key" ON "EventAttendee"("eventId", "userId");
