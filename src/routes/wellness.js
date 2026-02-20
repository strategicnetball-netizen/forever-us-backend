import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Get activity dashboard data
router.get('/activity-dashboard', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Get user's activity stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        createdAt: true,
        lastActivityDate: true,
        isPaused: true,
        pausedUntil: true
      }
    })

    // Count matches in last 30 days
    const matchesCount = await prisma.like.count({
      where: {
        likerId: userId,
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    // Count conversations started (messages sent)
    const conversationsCount = await prisma.message.findMany({
      where: {
        senderId: userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      distinct: ['receiverId'],
      select: { receiverId: true }
    })

    // Count actual dates (mutual matches with messages)
    const mutualMatches = await prisma.match.findMany({
      where: {
        userId: userId,
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { matchedUserId: true }
    })

    const datesCount = mutualMatches.filter(match => {
      return conversationsCount.some(conv => conv.receiverId === match.matchedUserId)
    }).length

    // Calculate days active
    const daysActive = Math.floor((Date.now() - user.createdAt.getTime()) / (24 * 60 * 60 * 1000))
    const daysSinceLastActive = user.lastActivityDate 
      ? Math.floor((Date.now() - user.lastActivityDate.getTime()) / (24 * 60 * 60 * 1000))
      : daysActive

    res.json({
      stats: {
        matchesThisMonth: matchesCount,
        conversationsStarted: conversationsCount.length,
        potentialDates: datesCount,
        daysActive,
        daysSinceLastActive
      },
      pauseStatus: {
        isPaused: user.isPaused,
        pausedUntil: user.pausedUntil
      },
      shouldSuggestPause: daysSinceLastActive > 45 && !user.isPaused
    })
  } catch (err) {
    next(err)
  }
})

// Pause profile
router.post('/pause-profile', authenticate, async (req, res, next) => {
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
      }
    })

    res.json({
      success: true,
      message: `Profile paused for ${durationDays} days`,
      pausedUntil
    })
  } catch (err) {
    next(err)
  }
})

// Resume profile
router.post('/resume-profile', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isPaused: false,
        pausedUntil: null
      }
    })

    res.json({
      success: true,
      message: 'Profile resumed'
    })
  } catch (err) {
    next(err)
  }
})

// Update last activity
router.post('/update-activity', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId

    await prisma.user.update({
      where: { id: userId },
      data: {
        lastActivityDate: new Date()
      }
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
