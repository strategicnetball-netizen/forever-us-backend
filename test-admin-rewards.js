import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function test() {
  try {
    const rewards = await prisma.adminReward.findMany()
    console.log('AdminReward records:', rewards)
    
    const stats = await prisma.adminReward.aggregate({
      _sum: { points: true },
      _count: true
    })
    console.log('Admin reward stats:', stats)
  } catch (err) {
    console.error('Error:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

test()
