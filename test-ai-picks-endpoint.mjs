import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Get user29
  const user29 = await prisma.user.findUnique({
    where: { email: 'user29@example.com' },
    select: { id: true }
  })
  
  if (!user29) {
    console.log('User29 not found!')
    return
  }
  
  const userId = user29.id
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Check if user already has AI picks for today
  const existingPicks = await prisma.aiPick.findMany({
    where: {
      userId,
      createdAt: {
        gte: today
      }
    },
    include: {
      profile: {
        select: {
          id: true,
          name: true,
          age: true,
          bio: true,
          avatar: true,
          location: true,
          tier: true
        }
      }
    }
  })

  console.log('Existing picks for today:', existingPicks.length)

  if (existingPicks.length > 0) {
    console.log('Returning existing picks')
    console.log(existingPicks.map(p => p.profile))
    return
  }

  // Get all users except self
  const allUsers = await prisma.user.findMany({
    where: {
      id: { not: userId }
    },
    select: {
      id: true,
      name: true,
      age: true,
      bio: true,
      avatar: true,
      location: true,
      tier: true
    },
    take: 100
  })

  console.log('All users (excluding self):', allUsers.length)

  // Get user's blocked list
  const blockedUsers = await prisma.blockedUser.findMany({
    where: { blockerId: userId },
    select: { blockedId: true }
  })
  const blockedIds = blockedUsers.map(b => b.blockedId)

  console.log('Blocked users:', blockedIds.length)

  // Get users the current user has already liked
  const likedUsers = await prisma.like.findMany({
    where: { likerId: userId },
    select: { likedId: true }
  })
  const likedIds = likedUsers.map(l => l.likedId)

  console.log('Liked users:', likedIds.length)

  // Filter out blocked and liked users
  const availableUsers = allUsers.filter(u => !blockedIds.includes(u.id) && !likedIds.includes(u.id))

  console.log('Available users:', availableUsers.length)

  // Simple AI pick: randomly select 2 from available users
  const shuffled = availableUsers.sort(() => Math.random() - 0.5)
  const aiPicks = shuffled.slice(0, 2)

  console.log('AI picks selected:', aiPicks.length)
  console.log('Picks:', aiPicks)

  // Store today's AI picks
  for (const pick of aiPicks) {
    const created = await prisma.aiPick.create({
      data: {
        userId,
        profileId: pick.id
      }
    })
    console.log('Created pick:', created.id)
  }

  console.log('Done!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
