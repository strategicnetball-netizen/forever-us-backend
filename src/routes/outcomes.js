import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Report outcome for a match
router.post('/report/:matchId', authenticate, async (req, res, next) => {
  try {
    const { matchId } = req.params
    const { outcome } = req.body
    const userId = req.userId

    const validOutcomes = ['first_date', 'second_date', 'relationship', 'ghosted', 'not_yet']
    if (!validOutcomes.includes(outcome)) {
      return res.status(400).json({ error: 'Invalid outcome' })
    }

    // Find the match
    const match = await prisma.match.findUnique({
      where: { id: matchId }
    })

    if (!match) {
      return res.status(404).json({ error: 'Match not found' })
    }

    // Verify user is part of this match
    if (match.userId !== userId && match.matchedUserId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    // Update match with outcome
    const updatedMatch = await prisma.match.update({
      where: { id: matchId },
      data: {
        dateOutcome: outcome,
        outcomeReportedAt: new Date()
      }
    })

    // Award coins for reporting outcome
    const rewardPoints = 10
    await prisma.user.update({
      where: { id: userId },
      data: { points: { increment: rewardPoints } }
    })

    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId,
        amount: rewardPoints,
        type: 'outcome_report',
        reason: `Reported match outcome: ${outcome}`
      }
    })

    res.json({
      success: true,
      message: `Outcome reported! You earned ${rewardPoints} coins.`,
      match: updatedMatch,
      pointsEarned: rewardPoints
    })
  } catch (err) {
    next(err)
  }
})

// Get user's outcome insights
router.get('/insights', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId

    // Get all matches with outcomes
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { userId },
          { matchedUserId: userId }
        ],
        dateOutcome: { not: null }
      },
      include: {
        user: { select: { id: true, name: true } },
        matchedUser: { select: { id: true, name: true } }
      }
    })

    // Calculate stats
    const stats = {
      totalMatches: matches.length,
      firstDates: matches.filter(m => m.dateOutcome === 'first_date').length,
      secondDates: matches.filter(m => m.dateOutcome === 'second_date').length,
      relationships: matches.filter(m => m.dateOutcome === 'relationship').length,
      ghosted: matches.filter(m => m.dateOutcome === 'ghosted').length
    }

    // Calculate success rate
    const successfulOutcomes = stats.firstDates + stats.secondDates + stats.relationships
    const successRate = stats.totalMatches > 0 
      ? Math.round((successfulOutcomes / stats.totalMatches) * 100)
      : 0

    // Get conversation patterns for successful matches
    const successfulMatches = matches.filter(m => 
      ['first_date', 'second_date', 'relationship'].includes(m.dateOutcome)
    )

    const conversationStats = await Promise.all(
      successfulMatches.map(async (match) => {
        const otherUserId = match.userId === userId ? match.matchedUserId : match.userId
        const messageCount = await prisma.message.count({
          where: {
            OR: [
              { senderId: userId, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: userId }
            ]
          }
        })
        return {
          matchId: match.id,
          outcome: match.dateOutcome,
          messageCount,
          otherUserName: match.userId === userId ? match.matchedUser.name : match.user.name
        }
      })
    )

    // Calculate average messages before date
    const messagesBeforeDate = conversationStats
      .filter(c => c.outcome === 'first_date')
      .map(c => c.messageCount)
    
    const avgMessagesBeforeDate = messagesBeforeDate.length > 0
      ? Math.round(messagesBeforeDate.reduce((a, b) => a + b, 0) / messagesBeforeDate.length)
      : 0

    res.json({
      stats,
      successRate,
      avgMessagesBeforeDate,
      conversationStats,
      insights: generateInsights(stats, successRate, avgMessagesBeforeDate)
    })
  } catch (err) {
    next(err)
  }
})

// Get anonymized outcome patterns (for algorithm learning)
router.get('/patterns', authenticate, async (req, res, next) => {
  try {
    // Get all matches with outcomes (anonymized)
    const allMatches = await prisma.match.findMany({
      where: { dateOutcome: { not: null } },
      select: {
        dateOutcome: true,
        createdAt: true,
        user: {
          select: {
            gender: true,
            age: true,
            tier: true
          }
        },
        matchedUser: {
          select: {
            gender: true,
            age: true,
            tier: true
          }
        }
      }
    })

    // Analyze patterns
    const patterns = {
      totalOutcomes: allMatches.length,
      outcomeDistribution: {
        firstDate: allMatches.filter(m => m.dateOutcome === 'first_date').length,
        secondDate: allMatches.filter(m => m.dateOutcome === 'second_date').length,
        relationship: allMatches.filter(m => m.dateOutcome === 'relationship').length,
        ghosted: allMatches.filter(m => m.dateOutcome === 'ghosted').length
      },
      successRate: Math.round(
        (allMatches.filter(m => ['first_date', 'second_date', 'relationship'].includes(m.dateOutcome)).length / allMatches.length) * 100
      )
    }

    res.json(patterns)
  } catch (err) {
    next(err)
  }
})

// Get matches pending outcome report
router.get('/pending', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Get matches from last 30 days without outcomes
    const pendingMatches = await prisma.match.findMany({
      where: {
        OR: [
          { userId },
          { matchedUserId: userId }
        ],
        dateOutcome: null,
        createdAt: { gte: thirtyDaysAgo }
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        matchedUser: { select: { id: true, name: true, avatar: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    res.json(pendingMatches)
  } catch (err) {
    next(err)
  }
})

function generateInsights(stats, successRate, avgMessagesBeforeDate) {
  const insights = []

  if (stats.totalMatches === 0) {
    insights.push({
      type: 'info',
      message: 'Start reporting outcomes to get personalized insights!'
    })
    return insights
  }

  if (successRate >= 50) {
    insights.push({
      type: 'success',
      message: `Great job! ${successRate}% of your matches lead to dates. You're doing better than average.`
    })
  } else if (successRate >= 25) {
    insights.push({
      type: 'info',
      message: `${successRate}% of your matches lead to dates. Try asking people out sooner—most successful convos average ${avgMessagesBeforeDate} messages before a date.`
    })
  } else {
    insights.push({
      type: 'warning',
      message: `Only ${successRate}% of your matches lead to dates. Try asking people out by message ${Math.max(5, avgMessagesBeforeDate - 2)} instead of waiting longer.`
    })
  }

  if (stats.ghosted > stats.firstDates) {
    insights.push({
      type: 'warning',
      message: 'You\'re being ghosted more than getting dates. Try asking about their interests earlier in the conversation.'
    })
  }

  if (stats.relationships > 0) {
    insights.push({
      type: 'success',
      message: `Congrats on ${stats.relationships} relationship${stats.relationships > 1 ? 's' : ''}! 💕`
    })
  }

  return insights
}

export default router
