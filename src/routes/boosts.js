import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Boost duration in hours
const BOOST_DURATION_HOURS = 48

// Cooldown periods in days
const VIP_COOLDOWN_DAYS = 14
const FREE_PREMIUM_COOLDOWN_DAYS = 14

// Coin costs
const BOOST_COSTS = {
  free: 50,
  premium: 30,
  vip: 0
}

// Check if user can boost (cooldown check)
const canUserBoost = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { tier: true, trialTier: true, trialExpiresAt: true }
  })

  if (!user) return { canBoost: false, reason: 'User not found' }

  // Determine effective tier
  const isTrialPremium = user.trialTier && (user.trialTier === 'premium' || user.trialTier === 'vip') && new Date(user.trialExpiresAt) > new Date()
  const effectiveTier = isTrialPremium ? user.trialTier : user.tier

  // Get last boost
  const lastBoost = await prisma.profileBoost.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true }
  })

  if (!lastBoost) {
    return { canBoost: true, reason: null }
  }

  // Check cooldown based on tier
  const cooldownDays = effectiveTier === 'vip' ? VIP_COOLDOWN_DAYS : FREE_PREMIUM_COOLDOWN_DAYS
  const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000
  const timeSinceLastBoost = Date.now() - new Date(lastBoost.createdAt).getTime()

  if (timeSinceLastBoost < cooldownMs) {
    const daysRemaining = Math.ceil((cooldownMs - timeSinceLastBoost) / (24 * 60 * 60 * 1000))
    return { canBoost: false, reason: `Boost available in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}` }
  }

  return { canBoost: true, reason: null }
}

// Create a boost
router.post('/create', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const { boostType = 'standard' } = req.body

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, trialTier: true, trialExpiresAt: true, points: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if user can boost
    const { canBoost, reason } = await canUserBoost(userId)
    if (!canBoost) {
      return res.status(400).json({ error: reason })
    }

    // Determine effective tier
    const isTrialPremium = user.trialTier && (user.trialTier === 'premium' || user.trialTier === 'vip') && new Date(user.trialExpiresAt) > new Date()
    const effectiveTier = isTrialPremium ? user.trialTier : user.tier

    // Calculate cost
    let coinsCost = 0
    if (effectiveTier === 'vip') {
      coinsCost = 0 // VIP gets free boost
    } else if (effectiveTier === 'premium') {
      coinsCost = boostType === 'premium' ? 100 : 30
    } else {
      coinsCost = boostType === 'premium' ? 100 : 50
    }

    // Check if user has enough coins (only if cost > 0)
    if (coinsCost > 0 && user.points < coinsCost) {
      return res.status(400).json({
        error: 'Insufficient coins',
        needed: coinsCost,
        current: user.points
      })
    }

    // Create boost
    const expiresAt = new Date(Date.now() + BOOST_DURATION_HOURS * 60 * 60 * 1000)
    const boost = await prisma.profileBoost.create({
      data: {
        userId,
        boostType,
        coinsCost,
        expiresAt,
        lastBoostAt: new Date()
      }
    })

    // Deduct coins if cost > 0
    if (coinsCost > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { points: { decrement: coinsCost } }
      })

      // Record transaction
      await prisma.pointsTransaction.create({
        data: {
          userId,
          amount: -coinsCost,
          type: 'profile_boost',
          reason: `Profile boost (${boostType})`
        }
      })
    }

    res.json({
      success: true,
      boost: {
        id: boost.id,
        boostType: boost.boostType,
        coinsCost: boost.coinsCost,
        expiresAt: boost.expiresAt,
        durationHours: BOOST_DURATION_HOURS
      }
    })
  } catch (err) {
    console.error('Error creating boost:', err)
    res.status(500).json({ error: 'Failed to create boost' })
  }
})

// Get active boost for user
router.get('/active', authenticate, async (req, res) => {
  try {
    const userId = req.userId

    const activeBoost = await prisma.profileBoost.findFirst({
      where: {
        userId,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      orderBy: { expiresAt: 'desc' }
    })

    if (!activeBoost) {
      return res.json({ activeBoost: null })
    }

    res.json({
      activeBoost: {
        id: activeBoost.id,
        boostType: activeBoost.boostType,
        expiresAt: activeBoost.expiresAt,
        hoursRemaining: Math.ceil((new Date(activeBoost.expiresAt) - Date.now()) / (60 * 60 * 1000))
      }
    })
  } catch (err) {
    console.error('Error fetching active boost:', err)
    res.status(500).json({ error: 'Failed to fetch boost' })
  }
})

// Get boost status (can boost, cooldown info)
router.get('/status', authenticate, async (req, res) => {
  try {
    const userId = req.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, trialTier: true, trialExpiresAt: true, points: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { canBoost, reason } = await canUserBoost(userId)

    // Determine effective tier
    const isTrialPremium = user.trialTier && (user.trialTier === 'premium' || user.trialTier === 'vip') && new Date(user.trialExpiresAt) > new Date()
    const effectiveTier = isTrialPremium ? user.trialTier : user.tier

    // Get cost for this tier
    const standardCost = effectiveTier === 'vip' ? 0 : (effectiveTier === 'premium' ? 30 : 50)
    const premiumCost = 100

    res.json({
      canBoost,
      cooldownReason: reason,
      tier: effectiveTier,
      currentCoins: user.points,
      costs: {
        standard: standardCost,
        premium: premiumCost
      },
      cooldownDays: effectiveTier === 'vip' ? VIP_COOLDOWN_DAYS : FREE_PREMIUM_COOLDOWN_DAYS
    })
  } catch (err) {
    console.error('Error fetching boost status:', err)
    res.status(500).json({ error: 'Failed to fetch boost status' })
  }
})

// Get boost history for user
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.userId

    const boosts = await prisma.profileBoost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    res.json({
      boosts: boosts.map(b => ({
        id: b.id,
        boostType: b.boostType,
        coinsCost: b.coinsCost,
        createdAt: b.createdAt,
        expiresAt: b.expiresAt,
        isActive: b.isActive && new Date(b.expiresAt) > new Date()
      }))
    })
  } catch (err) {
    console.error('Error fetching boost history:', err)
    res.status(500).json({ error: 'Failed to fetch boost history' })
  }
})

// Get boosted profiles (for discovery/search)
router.get('/boosted-profiles', authenticate, async (req, res) => {
  try {
    const boostedProfiles = await prisma.profileBoost.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      select: { userId: true },
      distinct: ['userId'],
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json({
      boostedUserIds: boostedProfiles.map(b => b.userId)
    })
  } catch (err) {
    console.error('Error fetching boosted profiles:', err)
    res.status(500).json({ error: 'Failed to fetch boosted profiles' })
  }
})

export default router
