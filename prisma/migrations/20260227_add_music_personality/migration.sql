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

-- CreateIndex
CREATE UNIQUE INDEX "ValuesBelifsQuestionnaire_userId_key" ON "ValuesBelifsQuestionnaire"("userId");

-- CreateIndex
CREATE INDEX "ValuesBelifsQuestionnaire_userId_idx" ON "ValuesBelifsQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestsHobbiesQuestionnaire_userId_key" ON "InterestsHobbiesQuestionnaire"("userId");

-- CreateIndex
CREATE INDEX "InterestsHobbiesQuestionnaire_userId_idx" ON "InterestsHobbiesQuestionnaire"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MusicPersonalityQuestionnaire_userId_key" ON "MusicPersonalityQuestionnaire"("userId");

-- CreateIndex
CREATE INDEX "MusicPersonalityQuestionnaire_userId_idx" ON "MusicPersonalityQuestionnaire"("userId");
