import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function applyMigration() {
  try {
    console.log('Applying migration: Add intimate preferences agreement fields...')
    
    // Execute raw SQL to add columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN "intimatePreferencesAgreed" BOOLEAN NOT NULL DEFAULT 0
    `)
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN "intimatePreferencesAgreedAt" DATETIME
    `)
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN "intimatePreferencesAgreedVersion" TEXT
    `)
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" ADD COLUMN "intimatePreferencesAgreedIP" TEXT
    `)
    
    console.log('✓ Migration applied successfully!')
  } catch (error) {
    if (error.message.includes('duplicate column name')) {
      console.log('✓ Columns already exist, skipping...')
    } else {
      console.error('✗ Migration failed:', error.message)
      process.exit(1)
    }
  } finally {
    await prisma.$disconnect()
  }
}

applyMigration()
