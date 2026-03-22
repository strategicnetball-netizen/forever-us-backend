import express from 'express'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Get prisma from global scope (set by index.js)
const getPrisma = () => {
  if (!global.prisma) {
    throw new Error('Prisma client not initialized');
  }
  return global.prisma;
}

// Get 2 AI-picked profiles for the day
router.get('/ai-picks', authenticate, async (req, res) => {
  try {
    const prisma = getPrisma();
    const userId = req.userId
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get users the current user has already liked
    const likedUsers = await prisma.like.findMany({
      where: { likerId: userId },
      select: { likedId: true }
    })
    const likedIds = likedUsers.map(l => l.likedId)

    // Get user's blocked list (users that current user has blocked)
    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blockerId: userId },
      select: { blockedId: true }
    })
    const blockedIds = blockedUsers.map(b => b.blockedId)

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

    // Filter out any picks that have been liked or blocked since they were created
    const availablePicks = existingPicks.filter(pick => !likedIds.includes(pick.profileId) && !blockedIds.includes(pick.profileId))

    if (availablePicks.length > 0) {
      // Return existing picks that haven't been liked yet
      return res.json(availablePicks.map(p => p.profile))
    }

    // If all picks for today have been liked, return empty array (no new picks today)
    if (existingPicks.length > 0 && availablePicks.length === 0) {
      // User has used all their picks for today
      return res.json([])
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

    // Filter out blocked and liked users
    const availableUsers = allUsers.filter(u => !blockedIds.includes(u.id) && !likedIds.includes(u.id))

    // Simple AI pick: randomly select 2 from available users
    const shuffled = availableUsers.sort(() => Math.random() - 0.5)
    const aiPicks = shuffled.slice(0, 2)

    // Store today's AI picks
    for (const pick of aiPicks) {
      await prisma.aiPick.create({
        data: {
          userId,
          profileId: pick.id
        }
      })
    }

    res.json(aiPicks)
  } catch (err) {
    console.error('Error fetching AI picks:', err)
    res.status(500).json({ error: 'Failed to fetch AI picks' })
  }
})

export default router
