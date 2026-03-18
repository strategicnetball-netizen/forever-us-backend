-- CreateTable
CREATE TABLE "User" (
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
    "referralCode" TEXT,
    "referredById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "personalityType" TEXT,
    "profileScore" INTEGER,
    "profileCompletion" INTEGER,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "messageNotifications" BOOLEAN NOT NULL DEFAULT true,
    "matchNotifications" BOOLEAN NOT NULL DEFAULT true,
    "likeNotifications" BOOLEAN NOT NULL DEFAULT true,
    "privateProfile" BOOLEAN NOT NULL DEFAULT false,
    "allowMessages" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PointsTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PointsTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "rewardPoints" INTEGER NOT NULL,
    "videoUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AdView" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AdView_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Survey" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "rewardPoints" INTEGER NOT NULL,
    "questions" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SurveyResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "surveyId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SurveyResponse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SurveyResponse_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "Survey" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "photoUrl" TEXT,
    "pointsCost" INTEGER NOT NULL DEFAULT 5,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "likerId" TEXT NOT NULL,
    "likedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Like_likerId_fkey" FOREIGN KEY ("likerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Like_likedId_fkey" FOREIGN KEY ("likedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "matchedUserId" TEXT NOT NULL,
    "dateOutcome" TEXT,
    "outcomeReportedAt" DATETIME,
    "expiresAt" DATETIME,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_matchedUserId_fkey" FOREIGN KEY ("matchedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BlockedUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlockedUser_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "BlockedUser_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Questionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Questionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PersonalityQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonalityQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RelationshipGoalsQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RelationshipGoalsQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LifestyleQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LifestyleQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ValuesBelifsQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ValuesBelifsQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InterestsHobbiesQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InterestsHobbiesQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MusicPersonalityQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MusicPersonalityQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LifestylePreferencesQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LifestylePreferencesQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RedFlagsQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rawInput" TEXT,
    "selectedFlags" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RedFlagsQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DealBreakersQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rawInput" TEXT,
    "selectedBreakers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DealBreakersQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RedFlagsList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "flag" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "topFourCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DealBreakersList" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "breaker" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "topFourCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QuestionnaireCompletion" (
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

-- CreateTable
CREATE TABLE "Reward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "duration" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Redemption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "pointsSpent" INTEGER NOT NULL,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Redemption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Redemption_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserPremium" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "unlimitedLikes" BOOLEAN NOT NULL DEFAULT false,
    "unlimitedMessages" BOOLEAN NOT NULL DEFAULT false,
    "messagePriority" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPremium_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FraudAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'low',
    "description" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FraudAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "action" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AiPick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiPick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AiPick_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThirdPartyReward" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThirdPartyReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'moderator',
    "department" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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

-- CreateTable
CREATE TABLE "CallHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "callerId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "callType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CallHistory_callerId_fkey" FOREIGN KEY ("callerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CallHistory_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo" TEXT,
    "website" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SponsorClick" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SponsorClick_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SponsorClick_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Referral" (
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

-- CreateTable
CREATE TABLE "UserBadge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "badgeType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "description" TEXT,
    "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TypingIndicator" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "conversationWith" TEXT NOT NULL,
    "isTyping" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TypingIndicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserBehavior" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "targetUserId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserBehavior_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedUserId" TEXT,
    "relatedId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProfileBoost" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "boostType" TEXT NOT NULL DEFAULT 'standard',
    "coinsCost" INTEGER NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastBoostAt" DATETIME,
    "nextBoostAvailableAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProfileBoost_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- CreateIndex
CREATE INDEX "User_tier_idx" ON "User"("tier");

-- CreateIndex
CREATE INDEX "User_country_idx" ON "User"("country");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "PointsTransaction_userId_idx" ON "PointsTransaction"("userId");

-- CreateIndex
CREATE INDEX "PointsTransaction_createdAt_idx" ON "PointsTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Ad_title_key" ON "Ad"("title");

-- CreateIndex
CREATE INDEX "Ad_isActive_idx" ON "Ad"("isActive");

-- CreateIndex
CREATE INDEX "AdView_userId_idx" ON "AdView"("userId");

-- CreateIndex
CREATE INDEX "AdView_completed_idx" ON "AdView"("completed");

-- CreateIndex
CREATE UNIQUE INDEX "Survey_title_key" ON "Survey"("title");

-- CreateIndex
CREATE INDEX "Survey_isActive_idx" ON "Survey"("isActive");

-- CreateIndex
CREATE INDEX "SurveyResponse_userId_idx" ON "SurveyResponse"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SurveyResponse_userId_surveyId_key" ON "SurveyResponse"("userId", "surveyId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "Like_likerId_idx" ON "Like"("likerId");

-- CreateIndex
CREATE INDEX "Like_likedId_idx" ON "Like"("likedId");

-- CreateIndex
CREATE UNIQUE INDEX "Like_likerId_likedId_key" ON "Like"("likerId", "likedId");

-- CreateIndex
CREATE INDEX "Match_userId_idx" ON "Match"("userId");

-- CreateIndex
CREATE INDEX "Match_matchedUserId_idx" ON "Match"("matchedUserId");

-- CreateIndex
CREATE INDEX "Match_expiresAt_idx" ON "Match"("expiresAt");

-- CreateIndex
CREATE INDEX "Match_isExpired_idx" ON "Match"("isExpired");

-- CreateIndex
CREATE UNIQUE INDEX "Match_userId_matchedUserId_key" ON "Match"("userId", "matchedUserId");

-- CreateIndex
CREATE INDEX "BlockedUser_blockerId_idx" ON "BlockedUser"("blockerId");

-- CreateIndex
CREATE INDEX "BlockedUser_blockedId_idx" ON "BlockedUser"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedUser_blockerId_blockedId_key" ON "BlockedUser"("blockerId", "blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Questionnaire_userId_key" ON "Questionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalityQuestionnaire_userId_key" ON "PersonalityQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RelationshipGoalsQuestionnaire_userId_key" ON "RelationshipGoalsQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LifestyleQuestionnaire_userId_key" ON "LifestyleQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ValuesBelifsQuestionnaire_userId_key" ON "ValuesBelifsQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestsHobbiesQuestionnaire_userId_key" ON "InterestsHobbiesQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicPersonalityQuestionnaire_userId_key" ON "MusicPersonalityQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LifestylePreferencesQuestionnaire_userId_key" ON "LifestylePreferencesQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RedFlagsQuestionnaire_userId_key" ON "RedFlagsQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DealBreakersQuestionnaire_userId_key" ON "DealBreakersQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RedFlagsList_flag_key" ON "RedFlagsList"("flag");

-- CreateIndex
CREATE INDEX "RedFlagsList_isActive_idx" ON "RedFlagsList"("isActive");

-- CreateIndex
CREATE INDEX "RedFlagsList_order_idx" ON "RedFlagsList"("order");

-- CreateIndex
CREATE INDEX "RedFlagsList_frequency_idx" ON "RedFlagsList"("frequency");

-- CreateIndex
CREATE INDEX "RedFlagsList_topFourCount_idx" ON "RedFlagsList"("topFourCount");

-- CreateIndex
CREATE UNIQUE INDEX "DealBreakersList_breaker_key" ON "DealBreakersList"("breaker");

-- CreateIndex
CREATE INDEX "DealBreakersList_isActive_idx" ON "DealBreakersList"("isActive");

-- CreateIndex
CREATE INDEX "DealBreakersList_order_idx" ON "DealBreakersList"("order");

-- CreateIndex
CREATE INDEX "DealBreakersList_frequency_idx" ON "DealBreakersList"("frequency");

-- CreateIndex
CREATE INDEX "DealBreakersList_topFourCount_idx" ON "DealBreakersList"("topFourCount");

-- CreateIndex
CREATE INDEX "QuestionnaireCompletion_userId_idx" ON "QuestionnaireCompletion"("userId");

-- CreateIndex
CREATE INDEX "QuestionnaireCompletion_type_idx" ON "QuestionnaireCompletion"("type");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionnaireCompletion_userId_type_key" ON "QuestionnaireCompletion"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Reward_name_key" ON "Reward"("name");

-- CreateIndex
CREATE INDEX "Reward_isActive_idx" ON "Reward"("isActive");

-- CreateIndex
CREATE INDEX "Redemption_userId_idx" ON "Redemption"("userId");

-- CreateIndex
CREATE INDEX "Redemption_createdAt_idx" ON "Redemption"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserPremium_userId_key" ON "UserPremium"("userId");

-- CreateIndex
CREATE INDEX "FraudAlert_userId_idx" ON "FraudAlert"("userId");

-- CreateIndex
CREATE INDEX "FraudAlert_resolved_idx" ON "FraudAlert"("resolved");

-- CreateIndex
CREATE INDEX "FraudAlert_createdAt_idx" ON "FraudAlert"("createdAt");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdAt_idx" ON "Report"("createdAt");

-- CreateIndex
CREATE INDEX "AiPick_userId_idx" ON "AiPick"("userId");

-- CreateIndex
CREATE INDEX "AiPick_createdAt_idx" ON "AiPick"("createdAt");

-- CreateIndex
CREATE INDEX "ThirdPartyReward_userId_idx" ON "ThirdPartyReward"("userId");

-- CreateIndex
CREATE INDEX "ThirdPartyReward_provider_idx" ON "ThirdPartyReward"("provider");

-- CreateIndex
CREATE INDEX "ThirdPartyReward_createdAt_idx" ON "ThirdPartyReward"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminProfile_userId_key" ON "AdminProfile"("userId");

-- CreateIndex
CREATE INDEX "AdminProfile_role_idx" ON "AdminProfile"("role");

-- CreateIndex
CREATE INDEX "CallRequest_callerId_idx" ON "CallRequest"("callerId");

-- CreateIndex
CREATE INDEX "CallRequest_recipientId_idx" ON "CallRequest"("recipientId");

-- CreateIndex
CREATE INDEX "CallRequest_status_idx" ON "CallRequest"("status");

-- CreateIndex
CREATE INDEX "CallRequest_createdAt_idx" ON "CallRequest"("createdAt");

-- CreateIndex
CREATE INDEX "CallHistory_callerId_idx" ON "CallHistory"("callerId");

-- CreateIndex
CREATE INDEX "CallHistory_recipientId_idx" ON "CallHistory"("recipientId");

-- CreateIndex
CREATE INDEX "CallHistory_status_idx" ON "CallHistory"("status");

-- CreateIndex
CREATE INDEX "CallHistory_startedAt_idx" ON "CallHistory"("startedAt");

-- CreateIndex
CREATE INDEX "TickerMessage_isActive_idx" ON "TickerMessage"("isActive");

-- CreateIndex
CREATE INDEX "TickerMessage_order_idx" ON "TickerMessage"("order");

-- CreateIndex
CREATE INDEX "AdminReward_adminId_idx" ON "AdminReward"("adminId");

-- CreateIndex
CREATE INDEX "AdminReward_userId_idx" ON "AdminReward"("userId");

-- CreateIndex
CREATE INDEX "AdminReward_createdAt_idx" ON "AdminReward"("createdAt");

-- CreateIndex
CREATE INDEX "UndoAction_userId_idx" ON "UndoAction"("userId");

-- CreateIndex
CREATE INDEX "UndoAction_createdAt_idx" ON "UndoAction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Sponsor_name_key" ON "Sponsor"("name");

-- CreateIndex
CREATE INDEX "Sponsor_isActive_idx" ON "Sponsor"("isActive");

-- CreateIndex
CREATE INDEX "Sponsor_order_idx" ON "Sponsor"("order");

-- CreateIndex
CREATE INDEX "SponsorClick_userId_idx" ON "SponsorClick"("userId");

-- CreateIndex
CREATE INDEX "SponsorClick_sponsorId_idx" ON "SponsorClick"("sponsorId");

-- CreateIndex
CREATE INDEX "SponsorClick_createdAt_idx" ON "SponsorClick"("createdAt");

-- CreateIndex
CREATE INDEX "Referral_referrerId_idx" ON "Referral"("referrerId");

-- CreateIndex
CREATE INDEX "Referral_referredId_idx" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_createdAt_idx" ON "Referral"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referrerId_referredId_key" ON "Referral"("referrerId", "referredId");

-- CreateIndex
CREATE INDEX "UserBadge_userId_idx" ON "UserBadge"("userId");

-- CreateIndex
CREATE INDEX "UserBadge_badgeType_idx" ON "UserBadge"("badgeType");

-- CreateIndex
CREATE UNIQUE INDEX "UserBadge_userId_badgeType_key" ON "UserBadge"("userId", "badgeType");

-- CreateIndex
CREATE INDEX "TypingIndicator_userId_idx" ON "TypingIndicator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TypingIndicator_userId_conversationWith_key" ON "TypingIndicator"("userId", "conversationWith");

-- CreateIndex
CREATE INDEX "UserBehavior_userId_idx" ON "UserBehavior"("userId");

-- CreateIndex
CREATE INDEX "UserBehavior_targetUserId_idx" ON "UserBehavior"("targetUserId");

-- CreateIndex
CREATE INDEX "UserBehavior_createdAt_idx" ON "UserBehavior"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_read_idx" ON "Notification"("read");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "ProfileBoost_userId_idx" ON "ProfileBoost"("userId");

-- CreateIndex
CREATE INDEX "ProfileBoost_expiresAt_idx" ON "ProfileBoost"("expiresAt");

-- CreateIndex
CREATE INDEX "ProfileBoost_isActive_idx" ON "ProfileBoost"("isActive");

-- CreateIndex
CREATE INDEX "ProfileBoost_createdAt_idx" ON "ProfileBoost"("createdAt");
