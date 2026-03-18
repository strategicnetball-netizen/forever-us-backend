import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'
import { getIO } from '../services/socketService.js'

const router = express.Router()

// ============ TYPING INDICATORS ============

// Emit typing indicator
router.post('/typing', authenticate, async (req, res, next) => {
  try {
    const { conversationWith, isTyping } = req.body

    if (!conversationWith) {
      return res.status(400).json({ error: 'Missing conversationWith' })
    }

    // Update or create typing indicator
    await prisma.typingIndicator.upsert({
      where: {
        userId_conversationWith: {
          userId: req.userId,
          conversationWith
        }
      },
      update: { isTyping },
      create: {
        userId: req.userId,
        conversationWith,
        isTyping
      }
    })

    // Emit to recipient via WebSocket
    const io = getIO()
    io.to(conversationWith).emit('typing:indicator', {
      userId: req.userId,
      isTyping
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// Get typing status for a conversation
router.get('/typing/:userId', authenticate, async (req, res, next) => {
  try {
    const typing = await prisma.typingIndicator.findUnique({
      where: {
        userId_conversationWith: {
          userId: req.params.userId,
          conversationWith: req.userId
        }
      }
    })

    res.json({ isTyping: typing?.isTyping || false })
  } catch (err) {
    next(err)
  }
})

// ============ MESSAGE REACTIONS ============

// Add reaction to message
router.post('/messages/:messageId/react', authenticate, async (req, res, next) => {
  try {
    const { emoji } = req.body
    const { messageId } = req.params

    if (!emoji || emoji.length > 2) {
      return res.status(400).json({ error: 'Invalid emoji' })
    }

    // Get the message
    const message = await prisma.message.findUnique({
      where: { id: messageId }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    // Check if user is sender or receiver
    if (message.senderId !== req.userId && message.receiverId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    // Parse existing reactions
    let reactions = []
    if (message.reactions) {
      try {
        reactions = JSON.parse(message.reactions)
      } catch (e) {
        reactions = []
      }
    }

    // Check if user already reacted with this emoji
    const existingIndex = reactions.findIndex(r => r.userId === req.userId && r.emoji === emoji)

    if (existingIndex >= 0) {
      // Remove reaction if already exists (toggle)
      reactions.splice(existingIndex, 1)
    } else {
      // Add new reaction
      reactions.push({ userId: req.userId, emoji, createdAt: new Date().toISOString() })
    }

    // Update message
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: JSON.stringify(reactions) },
      include: {
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true } }
      }
    })

    // Emit to both users
    const io = getIO()
    io.to(message.senderId).emit('message:reaction', { messageId, reactions })
    io.to(message.receiverId).emit('message:reaction', { messageId, reactions })

    res.json({ reactions })
  } catch (err) {
    next(err)
  }
})

// Get reactions for a message
router.get('/messages/:messageId/reactions', authenticate, async (req, res, next) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: req.params.messageId }
    })

    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    let reactions = []
    if (message.reactions) {
      try {
        reactions = JSON.parse(message.reactions)
      } catch (e) {
        reactions = []
      }
    }

    res.json({ reactions })
  } catch (err) {
    next(err)
  }
})

// ============ DARK MODE ============

// Get user theme preference
router.get('/theme', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // For now, return default. In future, add theme field to User model
    res.json({ theme: 'dark' })
  } catch (err) {
    next(err)
  }
})

// ============ PROMO CODES ============

// Validate and apply promo code
router.post('/promo-codes/validate', authenticate, async (req, res, next) => {
  try {
    const { code } = req.body

    if (!code) {
      return res.status(400).json({ error: 'Missing promo code' })
    }

    // Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' })
    }

    if (!promoCode.isActive) {
      return res.status(400).json({ error: 'Promo code is inactive' })
    }

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Promo code has expired' })
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({ error: 'Promo code usage limit reached' })
    }

    // Check if user already used this code
    const existing = await prisma.promoCodeRedemption.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId: promoCode.id,
          userId: req.userId
        }
      }
    })

    if (existing) {
      return res.status(400).json({ error: 'You have already used this promo code' })
    }

    res.json({
      valid: true,
      discountPercent: promoCode.discountPercent,
      code: promoCode.code
    })
  } catch (err) {
    next(err)
  }
})

// Apply promo code to purchase
router.post('/promo-codes/apply', authenticate, async (req, res, next) => {
  try {
    const { code, amount } = req.body

    if (!code || !amount) {
      return res.status(400).json({ error: 'Missing code or amount' })
    }

    // Find promo code
    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' })
    }

    if (!promoCode.isActive) {
      return res.status(400).json({ error: 'Promo code is inactive' })
    }

    if (promoCode.expiresAt && new Date(promoCode.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Promo code has expired' })
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({ error: 'Promo code usage limit reached' })
    }

    // Check if user already used this code
    const existing = await prisma.promoCodeRedemption.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId: promoCode.id,
          userId: req.userId
        }
      }
    })

    if (existing) {
      return res.status(400).json({ error: 'You have already used this promo code' })
    }

    // Calculate discount
    const discountAmount = Math.floor(amount * (promoCode.discountPercent / 100))
    const finalAmount = amount - discountAmount

    // Record redemption
    await prisma.promoCodeRedemption.create({
      data: {
        promoCodeId: promoCode.id,
        userId: req.userId,
        discountAmount
      }
    })

    // Increment usage count
    await prisma.promoCode.update({
      where: { id: promoCode.id },
      data: { usedCount: { increment: 1 } }
    })

    res.json({
      originalAmount: amount,
      discountAmount,
      finalAmount,
      discountPercent: promoCode.discountPercent
    })
  } catch (err) {
    next(err)
  }
})

// Admin: Create promo code
router.post('/promo-codes', authenticate, async (req, res, next) => {
  try {
    const { code, discountPercent, maxUses, expiresAt } = req.body

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    if (!code || !discountPercent) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountPercent,
        maxUses: maxUses || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    })

    res.json(promoCode)
  } catch (err) {
    next(err)
  }
})

// Admin: List promo codes
router.get('/promo-codes', authenticate, async (req, res, next) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const promoCodes = await prisma.promoCode.findMany({
      include: {
        _count: {
          select: { redemptions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(promoCodes)
  } catch (err) {
    next(err)
  }
})

export default router
