import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

// Get mutual interests - people who liked the user AND the user liked them (but haven't matched yet)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId

    // Get all likes the user sent
    const userLikes = await prisma.like.findMany({
      where: { likerId: userId },
      select: { likedId: true }
    })
    const userLikedIds = userLikes.map(l => l.likedId)

    // Get all likes the user received
    const likesReceived = await prisma.like.findMany({
      where: { likedId: userId },
      include: {
        liker: {
          select: { id: true, name: true, age: true, avatar: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Find mutual interests (people who liked user AND user liked them)
    const mutualInterests = []
    for (const like of likesReceived) {
      if (userLikedIds.includes(like.likerId)) {
        // Check if they're already matched
        const existingMatch = await prisma.match.findFirst({
          where: {
            OR: [
              { userId, matchedId: like.likerId },
              { userId: like.likerId, matchedId: userId }
            ]
          }
        })

        // Only include if not already matched
        if (!existingMatch) {
          mutualInterests.push({
            type: 'mutual_interest',
            id: like.likerId,
            name: like.liker.name,
            age: like.liker.age,
            avatar: like.liker.avatar,
            description: 'You both like each other!',
            timeAgo: getTimeAgo(like.createdAt),
            timestamp: like.createdAt
          })
        }
      }
    }

    // Sort by most recent first and return top 20
    mutualInterests.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    res.json(mutualInterests.slice(0, 20))
  } catch (err) {
    console.error('Activity feed error:', err)
    next(err)
  }
})

// Helper function to format time ago
function getTimeAgo(date) {
  const now = new Date()
  const seconds = Math.floor((now - new Date(date)) / 1000)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(date).toLocaleDateString()
}

export default router
