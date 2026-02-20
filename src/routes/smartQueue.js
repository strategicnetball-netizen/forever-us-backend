import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Get smart matching queue based on user behavior
router.get('/queue', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const limit = parseInt(req.query.limit) || 20

    // Get user's profile for filtering
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        age: true,
        gender: true,
        location: true,
        questionnaire: true
      }
    })

    // Get users they've already interacted with
    const interactedUserIds = await prisma.userBehavior.findMany({
      where: { userId },
      select: { targetUserId: true }
    })
    const interactedIds = interactedUserIds.map(b => b.targetUserId)

    // Get blocked users
    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blockerId: userId },
      select: { blockedId: true }
    })
    const blockedIds = blockedUsers.map(b => b.blockedId)

    // Get users who blocked this user
    const blockedByUsers = await prisma.blockedUser.findMany({
      where: { blockedId: userId },
      select: { blockerId: true }
    })
    const blockedByIds = blockedByUsers.map(b => b.blockerId)

    // Get matches to exclude
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userId },
          { matchedUserId: userId }
        ]
      },
      select: {
        userId: true,
        matchedUserId: true
      }
    })
    const matchIds = matches.flatMap(m => [m.userId, m.matchedUserId]).filter(id => id !== userId)

    const excludeIds = new Set([userId, ...interactedIds, ...blockedIds, ...blockedByIds, ...matchIds])

    // Get candidates
    let candidates = await prisma.user.findMany({
      where: {
        id: { notIn: Array.from(excludeIds) },
        age: user.age ? { gte: user.age - 10, lte: user.age + 10 } : undefined
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        age: true,
        gender: true,
        location: true,
        bio: true,
        photos: true
      },
      take: limit * 2 // Get extra to score and sort
    })

    // Score candidates based on behavior patterns
    const scoredCandidates = candidates.map(candidate => {
      let score = 50 // Base score

      // Gender preference (if user has indicated preference)
      if (user.gender && candidate.gender) {
        score += 10
      }

      // Location match
      if (user.location && candidate.location && user.location === candidate.location) {
        score += 20
      }

      // Age proximity
      if (user.age && candidate.age) {
        const ageDiff = Math.abs(user.age - candidate.age)
        if (ageDiff <= 5) score += 15
        else if (ageDiff <= 10) score += 10
      }

      // Has photos
      if (candidate.photos) {
        try {
          const photos = JSON.parse(candidate.photos)
          score += Math.min(photos.length * 5, 15)
        } catch (e) {
          // ignore
        }
      }

      return { ...candidate, score }
    })

    // Sort by score descending
    scoredCandidates.sort((a, b) => b.score - a.score)

    // Return top candidates
    const queue = scoredCandidates.slice(0, limit)

    res.json(queue)
  } catch (err) {
    console.error('Error getting smart queue:', err)
    res.status(500).json({ error: 'Failed to get queue' })
  }
})

// Track user behavior (like, pass, view, message)
router.post('/track-behavior', authenticate, async (req, res) => {
  try {
    const userId = req.user.id
    const { targetUserId, actionType } = req.body

    if (!targetUserId || !actionType) {
      return res.status(400).json({ error: 'targetUserId and actionType are required' })
    }

    // Valid action types
    const validActions = ['like', 'pass', 'message', 'view']
    if (!validActions.includes(actionType)) {
      return res.status(400).json({ error: 'Invalid actionType' })
    }

    // Record behavior
    await prisma.userBehavior.create({
      data: {
        userId,
        targetUserId,
        actionType
      }
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Error tracking behavior:', err)
    res.status(500).json({ error: 'Failed to track behavior' })
  }
})

// Get behavior analytics for a user
router.get('/analytics', authenticate, async (req, res) => {
  try {
    const userId = req.user.id

    const behaviors = await prisma.userBehavior.findMany({
      where: { userId },
      select: { actionType: true }
    })

    const analytics = {
      likes: behaviors.filter(b => b.actionType === 'like').length,
      passes: behaviors.filter(b => b.actionType === 'pass').length,
      messages: behaviors.filter(b => b.actionType === 'message').length,
      views: behaviors.filter(b => b.actionType === 'view').length,
      total: behaviors.length
    }

    res.json(analytics)
  } catch (err) {
    console.error('Error getting analytics:', err)
    res.status(500).json({ error: 'Failed to get analytics' })
  }
})

export default router
