import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'
import { 
  getLikesRemaining, 
  getMessagesRemaining,
  shouldResetLimit,
  DAILY_LIKE_LIMIT,
  DAILY_MESSAGE_LIMIT
} from '../utils/dailyLimits.js'

const router = express.Router()

// Get current limits for user
router.get('/check', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tier: true,
        likesUsedToday: true,
        lastLikeResetDate: true,
        messagesUsedToday: true,
        lastMessageResetDate: true
      }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if limits need reset
    const likesNeedReset = shouldResetLimit(user.lastLikeResetDate)
    const messagesNeedReset = shouldResetLimit(user.lastMessageResetDate)

    // Calculate remaining
    const likesRemaining = user.tier === 'premium' 
      ? Infinity 
      : (likesNeedReset ? DAILY_LIKE_LIMIT : Math.max(0, DAILY_LIKE_LIMIT - user.likesUsedToday))

    const messagesRemaining = user.tier === 'premium'
      ? Infinity
      : (messagesNeedReset ? DAILY_MESSAGE_LIMIT : Math.max(0, DAILY_MESSAGE_LIMIT - user.messagesUsedToday))

    res.json({
      tier: user.tier,
      isPremium: user.tier === 'premium',
      likes: {
        remaining: likesRemaining,
        limit: DAILY_LIKE_LIMIT,
        used: likesNeedReset ? 0 : user.likesUsedToday
      },
      messages: {
        remaining: messagesRemaining,
        limit: DAILY_MESSAGE_LIMIT,
        used: messagesNeedReset ? 0 : user.messagesUsedToday
      }
    })
  } catch (err) {
    console.error('Failed to check limits:', err)
    next(err)
  }
})

export default router
