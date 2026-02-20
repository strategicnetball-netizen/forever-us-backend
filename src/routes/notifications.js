import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Get user notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { unreadOnly } = req.query
    
    const where = { userId: req.userId }
    if (unreadOnly === 'true') {
      where.read = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json(notifications)
  } catch (err) {
    next(err)
  }
})

// Get unread notification count
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: {
        userId: req.userId,
        read: false
      }
    })

    res.json({ unreadCount: count })
  } catch (err) {
    next(err)
  }
})

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    res.json(notification)
  } catch (err) {
    next(err)
  }
})

// Mark all notifications as read
router.put('/mark-all-read', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.userId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// Delete notification
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.delete({
      where: { id: req.params.id }
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

// Clear all notifications
router.delete('/', authenticate, async (req, res, next) => {
  try {
    await prisma.notification.deleteMany({
      where: { userId: req.userId }
    })

    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

export default router
