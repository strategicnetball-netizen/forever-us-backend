import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get user29
  const user29 = await prisma.user.findUnique({
    where: { email: 'user29@example.com' },
    select: { id: true, email: true, name: true }
  })
  
  console.log('User29:', user29)
  
  if (!user29) {
    console.log('User29 not found!')
    return
  }
  
  // Get all users except user29
  const allUsers = await prisma.user.findMany({
    where: { id: { not: user29.id } },
    select: { id: true, email: true, name: true }
  })
  
  console.log(`\nTotal users (excluding user29): ${allUsers.length}`)
  
  // Get blocked users
  const blockedUsers = await prisma.blockedUser.findMany({
    where: { blockerId: user29.id },
    select: { blockedId: true }
  })
  
  console.log(`Blocked users: ${blockedUsers.length}`)
  
  // Get liked users
  const likedUsers = await prisma.like.findMany({
    where: { likerId: user29.id },
    select: { likedId: true }
  })
  
  console.log(`Liked users: ${likedUsers.length}`)
  
  const blockedIds = blockedUsers.map(b => b.blockedId)
  const likedIds = likedUsers.map(l => l.likedId)
  
  // Get available users
  const availableUsers = allUsers.filter(u => !blockedIds.includes(u.id) && !likedIds.includes(u.id))
  
  console.log(`Available users for AI picks: ${availableUsers.length}`)
  
  if (availableUsers.length > 0) {
    console.log('\nFirst 5 available users:')
    availableUsers.slice(0, 5).forEach(u => {
      console.log(`  - ${u.email} (${u.name})`)
    })
  }
  
  // Check AI picks for today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todaysPicks = await prisma.aiPick.findMany({
    where: {
      userId: user29.id,
      createdAt: { gte: today }
    },
    select: { id: true, createdAt: true, profileId: true }
  })
  
  console.log(`\nAI picks for today: ${todaysPicks.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
