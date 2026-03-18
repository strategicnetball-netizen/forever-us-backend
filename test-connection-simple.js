import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    console.log('Testing Prisma connection...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL)
    
    // Try a simple query
    const userCount = await prisma.user.count()
    console.log('✓ Connection successful! User count:', userCount)
  } catch (error) {
    console.error('✗ Connection failed:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

test()
