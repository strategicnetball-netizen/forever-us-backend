import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Get all available rewards
router.get('/', authenticate, async (req, res, next) => {
  try {
    const rewards = await prisma.reward.findMany({
      where: { isActive: true },
      orderBy: { pointsCost: 'asc' }
    })
    
    res.json(rewards)
  } catch (err) {
    next(err)
  }
})

// Get user's redeemed rewards
router.get('/my-rewards', authenticate, async (req, res, next) => {
  try {
    const redemptions = await prisma.redemption.findMany({
      where: { userId: req.userId },
      include: { reward: true },
      orderBy: { createdAt: 'desc' }
    })
    
    const premium = await prisma.userPremium.findUnique({
      where: { userId: req.userId }
    })
    
    res.json({
      redemptions,
      premium
    })
  } catch (err) {
    next(err)
  }
})

// Claim profile completion bonus
router.post('/claim-profile-bonus', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.hasClaimedProfileBonus) {
      return res.status(400).json({ error: 'Profile bonus already claimed' })
    }

    // Check if profile is complete (all 8 fields: name, age, gender, country, city, bio, photos, lookingFor)
    const completedFields = [
      user.name && user.name.trim().length > 0,
      user.age && user.age > 0,
      user.gender && user.gender.trim().length > 0,
      user.country && user.country.trim().length > 0,
      user.city && user.city.trim().length > 0,
      user.bio && user.bio.trim().length > 0,
      user.photos && (typeof user.photos === 'string' ? user.photos.trim().length > 0 : Array.isArray(user.photos) && user.photos.length > 0),
      user.lookingFor && (typeof user.lookingFor === 'string' ? user.lookingFor.trim().length > 0 : Array.isArray(user.lookingFor) && user.lookingFor.length > 0)
    ].filter(Boolean).length

    if (completedFields < 8) {
      return res.status(400).json({ error: 'Profile is not complete. Missing fields.' })
    }

    // Award 25 points and mark as claimed
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        points: { increment: 25 },
        hasClaimedProfileBonus: true
      }
    })

    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: req.userId,
        amount: 25,
        type: 'profile_completion_bonus',
        reason: 'Profile completion bonus'
      }
    })

    res.json({
      success: true,
      message: 'Profile bonus claimed!',
      pointsAwarded: 25,
      totalPoints: updatedUser.points
    })
  } catch (err) {
    next(err)
  }
})

// Redeem a reward
router.post('/redeem/:rewardId', authenticate, async (req, res, next) => {
  try {
    const { rewardId } = req.params
    
    const reward = await prisma.reward.findUnique({
      where: { id: rewardId }
    })
    
    if (!reward) {
      return res.status(404).json({ error: 'Reward not found' })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })
    
    if (user.points < reward.pointsCost) {
      return res.status(400).json({ 
        error: `Insufficient points. Need ${reward.pointsCost}, have ${user.points}` 
      })
    }
    
    // Deduct points
    await prisma.user.update({
      where: { id: req.userId },
      data: { points: { decrement: reward.pointsCost } }
    })
    
    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: req.userId,
        amount: -reward.pointsCost,
        type: 'reward_redemption',
        reason: `Redeemed: ${reward.name}`
      }
    })
    
    // Create redemption record
    let expiresAt = null
    if (reward.duration) {
      expiresAt = new Date(Date.now() + reward.duration * 24 * 60 * 60 * 1000)
    }
    
    const redemption = await prisma.redemption.create({
      data: {
        userId: req.userId,
        rewardId,
        pointsSpent: reward.pointsCost,
        expiresAt
      }
    })
    
    // If it's a premium feature, update UserPremium
    if (reward.type === 'premium_feature') {
      const premiumData = {}
      
      if (reward.name.includes('Unlimited Likes')) {
        premiumData.unlimitedLikes = true
      } else if (reward.name.includes('Unlimited Messages')) {
        premiumData.unlimitedMessages = true
      } else if (reward.name.includes('Message Priority')) {
        premiumData.messagePriority = true
      }
      
      if (expiresAt) {
        premiumData.expiresAt = expiresAt
      }
      
      await prisma.userPremium.upsert({
        where: { userId: req.userId },
        update: premiumData,
        create: {
          userId: req.userId,
          ...premiumData
        }
      })
    }
    
    res.json({
      success: true,
      redemption,
      pointsRemaining: user.points - reward.pointsCost
    })
  } catch (err) {
    next(err)
  }
})

// Admin: Create reward
router.post('/admin/create', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })
    
    if (!user.email.endsWith('@admin.com')) {
      return res.status(403).json({ error: 'Admin access required' })
    }
    
    const { name, description, pointsCost, type, duration } = req.body
    
    const reward = await prisma.reward.create({
      data: {
        name,
        description,
        pointsCost,
        type,
        duration
      }
    })
    
    res.status(201).json(reward)
  } catch (err) {
    next(err)
  }
})

// Admin: Get all rewards
router.get('/admin/all', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })
    
    if (!user.email.endsWith('@admin.com')) {
      return res.status(403).json({ error: 'Admin access required' })
    }
    
    const rewards = await prisma.reward.findMany({
      orderBy: { pointsCost: 'asc' }
    })
    
    res.json(rewards)
  } catch (err) {
    next(err)
  }
})

export default router
