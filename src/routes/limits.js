import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'
import { 
  getLikesRemaining, 
  getMessagesRemaining,
  shouldResetLimit,
  DAILY_LIKE_LIMIT_FREE,
  DAILY_LIKE_LIMIT_PREMIUM,
  DAILY_MESSAGE_LIMIT_FREE,
  DAILY_MESSAGE_LIMIT_PREMIUM,
  MAX_PAYABLE_LIKES_FREE,
  MAX_PAYABLE_MESSAGES_FREE
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

    // Get the appropriate limits based on tier
    const likesLimit = user.tier === 'premium' ? DAILY_LIKE_LIMIT_PREMIUM : DAILY_LIKE_LIMIT_FREE
    const messagesLimit = user.tier === 'premium' ? DAILY_MESSAGE_LIMIT_PREMIUM : DAILY_MESSAGE_LIMIT_FREE
    
    // For free users, include payable limits
    let totalLikesLimit = likesLimit
    if (user.tier === 'free') {
      totalLikesLimit = DAILY_LIKE_LIMIT_FREE + MAX_PAYABLE_LIKES_FREE // 5 free + 7 payable = 12
    }

    // Calculate remaining
    const likesRemaining = user.tier === 'vip' 
      ? Infinity 
      : (likesNeedReset ? totalLikesLimit : Math.max(0, totalLikesLimit - user.likesUsedToday))

    const messagesRemaining = user.tier === 'vip'
      ? Infinity
      : (messagesNeedReset ? messagesLimit : Math.max(0, messagesLimit - user.messagesUsedToday))

    res.json({
      tier: user.tier,
      isPremium: user.tier === 'premium' || user.tier === 'vip',
      likes: {
        remaining: likesRemaining,
        limit: totalLikesLimit,
        used: likesNeedReset ? 0 : user.likesUsedToday,
        freeLimit: DAILY_LIKE_LIMIT_FREE,
        payableLimit: user.tier === 'free' ? MAX_PAYABLE_LIKES_FREE : 0
      },
      messages: {
        remaining: messagesRemaining,
        limit: messagesLimit,
        used: messagesNeedReset ? 0 : user.messagesUsedToday
      }
    })
  } catch (err) {
    console.error('Failed to check limits:', err)
    next(err)
  }
})

export default router
