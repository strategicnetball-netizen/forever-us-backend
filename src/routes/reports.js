import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

const REPORT_TYPES = [
  'inappropriate_message',
  'inappropriate_photo',
  'harassment',
  'spam',
  'fake_profile',
  'other'
]

// Submit a report
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { reportedUserId, type, description } = req.body

    if (!REPORT_TYPES.includes(type)) {
      return res.status(400).json({ error: 'Invalid report type' })
    }

    if (!description || description.trim().length < 10) {
      return res.status(400).json({ error: 'Description must be at least 10 characters' })
    }

    if (req.userId === reportedUserId) {
      return res.status(400).json({ error: 'Cannot report yourself' })
    }

    // Check if user already reported this person for the same reason in the last 24 hours
    const existingReport = await prisma.report.findFirst({
      where: {
        reporterId: req.userId,
        reportedUserId,
        type,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    })

    if (existingReport) {
      return res.status(400).json({ error: 'You already reported this user for this reason today' })
    }

    const report = await prisma.report.create({
      data: {
        reporterId: req.userId,
        reportedUserId,
        type,
        description
      }
    })

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report
    })
  } catch (err) {
    next(err)
  }
})

// Get user's submitted reports
router.get('/my-reports', authenticate, async (req, res, next) => {
  try {
    const reports = await prisma.report.findMany({
      where: { reporterId: req.userId },
      include: {
        reportedUser: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(reports)
  } catch (err) {
    next(err)
  }
})

// Admin: Get all reports
router.get('/admin/all', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user.email.endsWith('@admin.com')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const reports = await prisma.report.findMany({
      include: {
        reporter: {
          select: { id: true, name: true, email: true }
        },
        reportedUser: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(reports)
  } catch (err) {
    next(err)
  }
})

// Admin: Get unresolved reports
router.get('/admin/unresolved', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user.email.endsWith('@admin.com')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const reports = await prisma.report.findMany({
      where: { status: 'pending' },
      include: {
        reporter: {
          select: { id: true, name: true, email: true }
        },
        reportedUser: {
          select: { id: true, name: true, email: true, isFlagged: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json(reports)
  } catch (err) {
    next(err)
  }
})

// Admin: Resolve report
router.put('/admin/:reportId/resolve', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user.email.endsWith('@admin.com')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { action, adminMessage } = req.body
    const validActions = ['none', 'warning', 'suspended', 'banned']

    if (action && !validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' })
    }

    const report = await prisma.report.update({
      where: { id: req.params.reportId },
      data: {
        status: 'resolved',
        action: action || 'none'
      },
      include: {
        reportedUser: true,
        reporter: true
      }
    })

    // If banning, flag the user
    if (action === 'banned') {
      await prisma.user.update({
        where: { id: report.reportedUserId },
        data: { isFlagged: true }
      })
    }

    // Send message to reported user about the outcome
    const reportedUserMessage = `
Investigation Outcome:
Your profile was reported for: ${report.type.replace(/_/g, ' ')}

Admin Action: ${action.toUpperCase()}

${adminMessage ? `Admin Notes: ${adminMessage}` : ''}

If you believe this is a mistake, please contact support.
    `.trim()

    await prisma.message.create({
      data: {
        senderId: req.userId,
        receiverId: report.reportedUserId,
        content: reportedUserMessage,
        pointsCost: 0
      }
    })

    // Send message to reporter about the action taken
    const reporterMessage = `
Thank you for your report!

Report Type: ${report.type.replace(/_/g, ' ')}
Action Taken: ${action.toUpperCase()}

We appreciate your help in keeping our community safe.
    `.trim()

    await prisma.message.create({
      data: {
        senderId: req.userId,
        receiverId: report.reporterId,
        content: reporterMessage,
        pointsCost: 0
      }
    })

    res.json({
      success: true,
      report,
      messagesNotification: 'Messages sent to both reported user and reporter'
    })
  } catch (err) {
    next(err)
  }
})

// Admin: Get reports for a specific user
router.get('/admin/user/:userId', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user.email.endsWith('@admin.com')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const reports = await prisma.report.findMany({
      where: { reportedUserId: req.params.userId },
      include: {
        reporter: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    res.json(reports)
  } catch (err) {
    next(err)
  }
})

// Admin: Get reported user's profile
router.get('/admin/profile/:userId', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user.email.endsWith('@admin.com')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const reportedUser = await prisma.user.findUnique({
      where: { id: req.params.userId },
      include: {
        questionnaire: true,
        reportsReceived: {
          include: {
            reporter: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!reportedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(reportedUser)
  } catch (err) {
    next(err)
  }
})

// Admin: Get messages received by reporter from reported user
router.get('/admin/:reportId/messages', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user.email.endsWith('@admin.com')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const report = await prisma.report.findUnique({
      where: { id: req.params.reportId }
    })

    if (!report) {
      return res.status(404).json({ error: 'Report not found' })
    }

    // Get messages received by reporter from reported user
    const messages = await prisma.message.findMany({
      where: {
        receiverId: report.reporterId,
        senderId: report.reportedUserId
      },
      include: {
        sender: {
          select: { id: true, name: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    res.json(messages)
  } catch (err) {
    next(err)
  }
})

export default router
