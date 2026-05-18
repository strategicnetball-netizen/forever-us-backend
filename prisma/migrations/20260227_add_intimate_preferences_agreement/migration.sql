-- Add intimate preferences agreement fields to User
ALTER TABLE "User" ADD COLUMN "intimatePreferencesAgreed" BOOLEAN NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "intimatePreferencesAgreedVersion" TEXT;
ALTER TABLE "User" ADD COLUMN "intimatePreferencesAgreedIP" TEXT;
