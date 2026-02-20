import express from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()
const prisma = new PrismaClient()

// AdMob ad completion
router.post('/admob/complete', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const ADMOB_REWARD = 10

    // Check if user already claimed AdMob reward today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingReward = await prisma.thirdPartyReward.findFirst({
      where: {
        userId,
        provider: 'admob',
        createdAt: {
          gte: today
        }
      }
    })

    if (existingReward) {
      return res.status(400).json({ error: 'You already claimed AdMob reward today' })
    }

    // Record the reward
    await prisma.thirdPartyReward.create({
      data: {
        userId,
        provider: 'admob',
        points: ADMOB_REWARD
      }
    })

    // Add points to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: ADMOB_REWARD
        }
      }
    })

    res.json({ earned: ADMOB_REWARD })
  } catch (err) {
    console.error('AdMob completion error:', err)
    res.status(500).json({ error: 'Failed to process AdMob reward' })
  }
})

// Pollfish survey completion
router.post('/pollfish/complete', authenticate, async (req, res) => {
  try {
    const userId = req.userId
    const POLLFISH_REWARD = 15

    // Check if user already claimed Pollfish reward today
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const existingReward = await prisma.thirdPartyReward.findFirst({
      where: {
        userId,
        provider: 'pollfish',
        createdAt: {
          gte: today
        }
      }
    })

    if (existingReward) {
      return res.status(400).json({ error: 'You already claimed Pollfish reward today' })
    }

    // Record the reward
    await prisma.thirdPartyReward.create({
      data: {
        userId,
        provider: 'pollfish',
        points: POLLFISH_REWARD
      }
    })

    // Add points to user
    await prisma.user.update({
      where: { id: userId },
      data: {
        points: {
          increment: POLLFISH_REWARD
        }
      }
    })

    res.json({ earned: POLLFISH_REWARD })
  } catch (err) {
    console.error('Pollfish completion error:', err)
    res.status(500).json({ error: 'Failed to process Pollfish reward' })
  }
})

export default router
