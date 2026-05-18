-- Add pass tracking fields to User model for daily pass limits

ALTER TABLE "User" ADD COLUMN "passesUsedToday" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lastPassResetDate" DATETIME;
