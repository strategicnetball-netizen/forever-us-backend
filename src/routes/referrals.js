import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'
import crypto from 'crypto'

const router = express.Router()
const REFERRAL_REWARD = 20
const REFERRED_BONUS = 15

// Generate unique referral code
const generateReferralCode = () => {
  return crypto.randomBytes(6).toString('hex').toUpperCase()
}

// Get user's referral code
router.get('/my-code', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { referralCode: true, email: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Generate code if doesn't exist
    let referralCode = user.referralCode
    if (!referralCode) {
      referralCode = generateReferralCode()
      await prisma.user.update({
        where: { id: req.userId },
        data: { referralCode }
      })
    }

    res.json({ referralCode })
  } catch (err) {
    next(err)
  }
})

// Get referral stats
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: req.userId },
      include: {
        referred: {
          select: { id: true, name: true, email: true, createdAt: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const totalEarned = referrals.length * REFERRAL_REWARD

    res.json({
      referralCount: referrals.length,
      totalEarned,
      referrals
    })
  } catch (err) {
    next(err)
  }
})

// Register with referral code
router.post('/register', async (req, res, next) => {
  try {
    const { referralCode, userId } = req.body

    if (!referralCode || !userId) {
      return res.status(400).json({ error: 'Referral code and user ID required' })
    }

    // Find referrer by code
    const referrer = await prisma.user.findUnique({
      where: { referralCode }
    })

    if (!referrer) {
      return res.status(404).json({ error: 'Invalid referral code' })
    }

    // Check if referral already exists
    const existingReferral = await prisma.referral.findUnique({
      where: {
        referrerId_referredId: {
          referrerId: referrer.id,
          referredId: userId
        }
      }
    })

    if (existingReferral) {
      return res.status(400).json({ error: 'Referral already recorded' })
    }

    // Create referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: userId,
        pointsAwarded: REFERRAL_REWARD
      }
    })

    // Award points to referrer
    await prisma.user.update({
      where: { id: referrer.id },
      data: { points: { increment: REFERRAL_REWARD } }
    })

    // Record transaction for referrer
    await prisma.pointsTransaction.create({
      data: {
        userId: referrer.id,
        amount: REFERRAL_REWARD,
        type: 'referral_bonus',
        reason: `Referral bonus for ${userId}`
      }
    })

    res.status(201).json({
      message: 'Referral recorded successfully',
      pointsAwarded: REFERRAL_REWARD,
      referral
    })
  } catch (err) {
    next(err)
  }
})

// Award referred bonus (called after referred user completes profile with 2+ photos)
router.post('/award-referred-bonus', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId

    // Get user's profile to check if they have 2+ photos
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { photos: true, referredById: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (!user.referredById) {
      return res.status(400).json({ error: 'User was not referred' })
    }

    // Parse photos array
    let photoCount = 0
    try {
      if (user.photos) {
        const photosArray = JSON.parse(user.photos)
        photoCount = Array.isArray(photosArray) ? photosArray.length : 0
      }
    } catch (err) {
      console.error('Error parsing photos:', err)
    }

    if (photoCount < 2) {
      return res.status(400).json({ error: 'Must have at least 2 photos to claim bonus' })
    }

    // Find the referral record
    const referral = await prisma.referral.findUnique({
      where: {
        referrerId_referredId: {
          referrerId: user.referredById,
          referredId: userId
        }
      }
    })

    if (!referral) {
      return res.status(404).json({ error: 'Referral record not found' })
    }

    if (referral.referredBonusAwarded) {
      return res.status(400).json({ error: 'Bonus already awarded' })
    }

    // Award bonus to referred user
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: REFERRED_BONUS } }
    })

    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId,
        amount: REFERRED_BONUS,
        type: 'referral_referred_bonus',
        reason: 'Referral sign-up bonus'
      }
    })

    // Mark bonus as awarded
    await prisma.referral.update({
      where: { id: referral.id },
      data: { referredBonusAwarded: true }
    })

    res.json({
      message: 'Referral bonus awarded successfully',
      bonusAwarded: REFERRED_BONUS
    })
  } catch (err) {
    next(err)
  }
})

export default router
