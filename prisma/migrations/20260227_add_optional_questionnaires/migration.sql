-- Add optional questionnaire tables for deeper personality and compatibility data

-- Personality Questionnaire (Big Five traits)
CREATE TABLE "PersonalityQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PersonalityQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Relationship Goals Questionnaire
CREATE TABLE "RelationshipGoalsQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RelationshipGoalsQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Lifestyle Compatibility Questionnaire
CREATE TABLE "LifestyleQuestionnaire" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL UNIQUE,
    "answers" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LifestyleQuestionnaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE
);

-- Track questionnaire completion status
CREATE TABLE "QuestionnaireCompletion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "coinsRewarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "QuestionnaireCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE,
    UNIQUE("userId", "type")
);

CREATE INDEX "PersonalityQuestionnaire_userId_idx" on "PersonalityQuestionnaire"("userId");
CREATE INDEX "RelationshipGoalsQuestionnaire_userId_idx" on "RelationshipGoalsQuestionnaire"("userId");
CREATE INDEX "LifestyleQuestionnaire_userId_idx" on "LifestyleQuestionnaire"("userId");
CREATE INDEX "QuestionnaireCompletion_userId_idx" on "QuestionnaireCompletion"("userId");
CREATE INDEX "QuestionnaireCompletion_type_idx" on "QuestionnaireCompletion"("type");
