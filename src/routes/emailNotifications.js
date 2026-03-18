import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Get email notification preferences
router.get('/preferences', authenticate, async (req, res, next) => {
  try {
    const prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.userId },
      select: {
        emailOnMatch: true,
        emailOnMessage: true,
        emailOnLike: true
      }
    })

    res.json(prefs || {
      emailOnMatch: true,
      emailOnMessage: true,
      emailOnLike: false
    })
  } catch (err) {
    next(err)
  }
})

// Update email notification preferences
router.put('/preferences', authenticate, async (req, res, next) => {
  try {
    const { emailOnMatch, emailOnMessage, emailOnLike } = req.body

    const prefs = await prisma.userPreferences.upsert({
      where: { userId: req.userId },
      update: {
        emailOnMatch: emailOnMatch !== undefined ? emailOnMatch : undefined,
        emailOnMessage: emailOnMessage !== undefined ? emailOnMessage : undefined,
        emailOnLike: emailOnLike !== undefined ? emailOnLike : undefined
      },
      create: {
        userId: req.userId,
        emailOnMatch: emailOnMatch !== undefined ? emailOnMatch : true,
        emailOnMessage: emailOnMessage !== undefined ? emailOnMessage : true,
        emailOnLike: emailOnLike !== undefined ? emailOnLike : false
      }
    })

    res.json(prefs)
  } catch (err) {
    next(err)
  }
})

// Internal endpoint to send email (called by other routes)
router.post('/send', async (req, res, next) => {
  try {
    const { userId, type, data } = req.body

    if (!userId || !type) {
      return res.status(400).json({ error: 'Missing userId or type' })
    }

    // Get user and preferences
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || !user.email) {
      return res.status(404).json({ error: 'User or email not found' })
    }

    const prefs = await prisma.userPreferences.findUnique({
      where: { userId }
    })

    // Check if user wants this type of email
    const shouldSend = {
      match: prefs?.emailOnMatch !== false,
      message: prefs?.emailOnMessage !== false,
      like: prefs?.emailOnLike === true
    }

    if (!shouldSend[type]) {
      return res.json({ sent: false, reason: 'User disabled this notification type' })
    }

    // In production, integrate with SendGrid, Mailgun, or similar
    // For now, just log the email that would be sent
    console.log(`[EMAIL] To: ${user.email}, Type: ${type}, Data:`, data)

    res.json({ sent: true, message: 'Email queued for sending' })
  } catch (err) {
    next(err)
  }
})

export default router
