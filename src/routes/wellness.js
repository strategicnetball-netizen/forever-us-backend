import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// GET /api/wellness/activity-dashboard
router.get('/activity-dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isPaused: true,
        pausedUntil: true,
        lastActivityDate: true,
        createdAt: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Calculate stats
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    // Matches this month (likes sent)
    const matchesThisMonth = await prisma.like.count({
      where: {
        likerId: userId,
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    // Conversations started (unique people messaged)
    const conversationsStarted = await prisma.message.findMany({
      where: { senderId: userId },
      distinct: ['recipientId'],
      select: { recipientId: true }
    })

    // Potential dates (mutual matches)
    const sentLikes = await prisma.like.findMany({
      where: { likerId: userId },
      select: { likedId: true }
    })

    const receivedLikes = await prisma.like.findMany({
      where: { likedId: userId },
      select: { likerId: true }
    })

    const sentLikeIds = sentLikes.map(l => l.likedId)
    const receivedLikeIds = receivedLikes.map(l => l.likerId)
    const mutualLikeIds = sentLikeIds.filter(id => receivedLikeIds.includes(id))

    const potentialDates = await prisma.message.count({
      where: {
        OR: [
          { senderId: userId, recipientId: { in: mutualLikeIds } },
          { recipientId: userId, senderId: { in: mutualLikeIds } }
        ]
      }
    })

    // Days active
    const daysActive = Math.floor((Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000))
    
    // Days since last active
    const daysSinceLastActive = user.lastActivityDate 
      ? Math.floor((Date.now() - user.lastActivityDate.getTime()) / (24 * 60 * 60 * 1000))
      : daysActive

    // Check if should suggest pause (45+ consecutive days active)
    const shouldSuggestPause = daysSinceLastActive === 0 && daysActive >= 45

    res.json({
      stats: {
        matchesThisMonth,
        conversationsStarted: conversationsStarted.length,
        potentialDates,
        daysActive,
        daysSinceLastActive
      },
      pauseStatus: {
        isPaused: user.isPaused,
        pausedUntil: user.pausedUntil
      },
      shouldSuggestPause
    })
  } catch (error) {
    console.error('Wellness dashboard error:', error)
    res.status(500).json({ error: 'Failed to fetch wellness data' })
  }
})

// POST /api/wellness/pause-profile
router.post('/pause-profile', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { durationDays } = req.body

    if (!durationDays || durationDays < 1 || durationDays > 28) {
      return res.status(400).json({ error: 'Duration must be between 1 and 28 days' })
    }

    const pausedUntil = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isPaused: true,
        pausedUntil
      },
      select: {
        id: true,
        isPaused: true,
        pausedUntil: true
      }
    })

    res.json({
      message: `Profile paused for ${durationDays} days`,
      pauseStatus: {
        isPaused: user.isPaused,
        pausedUntil: user.pausedUntil
      }
    })
  } catch (error) {
    console.error('Pause profile error:', error)
    res.status(500).json({ error: 'Failed to pause profile' })
  }
})

// POST /api/wellness/resume-profile
router.post('/resume-profile', authenticate, async (req, res) => {
  try {
    const userId = req.userId

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isPaused: false,
        pausedUntil: null
      },
      select: {
        id: true,
        isPaused: true,
        pausedUntil: true
      }
    })

    res.json({
      message: 'Profile resumed',
      pauseStatus: {
        isPaused: user.isPaused,
        pausedUntil: user.pausedUntil
      }
    })
  } catch (error) {
    console.error('Resume profile error:', error)
    res.status(500).json({ error: 'Failed to resume profile' })
  }
})

// POST /api/wellness/update-activity
router.post('/update-activity', authenticate, async (req, res) => {
  try {
    const userId = req.userId

    await prisma.user.update({
      where: { id: userId },
      data: { lastActivityDate: new Date() }
    })

    res.json({ message: 'Activity updated' })
  } catch (error) {
    console.error('Update activity error:', error)
    res.status(500).json({ error: 'Failed to update activity' })
  }
})

export default router
