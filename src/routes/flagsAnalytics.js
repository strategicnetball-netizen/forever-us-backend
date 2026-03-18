import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'
import { getFlagsAnalytics, getTopFlags, updateFlagOrder, deactivateFlag } from '../utils/redFlagsAnalytics.js'

const router = express.Router()

/**
 * GET /api/flags-analytics/red-flags
 * Get analytics on red flags (admin only)
 */
router.get('/red-flags', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { limit = 50 } = req.query
    const analytics = await getFlagsAnalytics('redFlag', parseInt(limit))

    res.json({
      type: 'redFlags',
      count: analytics.length,
      data: analytics
    })
  } catch (err) {
    console.error('Error getting red flags analytics:', err)
    res.status(500).json({ error: 'Failed to get analytics' })
  }
})

/**
 * GET /api/flags-analytics/deal-breakers
 * Get analytics on deal breakers (admin only)
 */
router.get('/deal-breakers', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { limit = 50 } = req.query
    const analytics = await getFlagsAnalytics('dealBreaker', parseInt(limit))

    res.json({
      type: 'dealBreakers',
      count: analytics.length,
      data: analytics
    })
  } catch (err) {
    console.error('Error getting deal breakers analytics:', err)
    res.status(500).json({ error: 'Failed to get analytics' })
  }
})

/**
 * GET /api/flags-analytics/top-red-flags
 * Get top 20 red flags for display (public)
 */
router.get('/top-red-flags', async (req, res) => {
  try {
    const { limit = 20 } = req.query
    const topFlags = await getTopFlags('redFlag', parseInt(limit))

    res.json({
      type: 'redFlags',
      count: topFlags.length,
      data: topFlags
    })
  } catch (err) {
    console.error('Error getting top red flags:', err)
    res.status(500).json({ error: 'Failed to get top flags' })
  }
})

/**
 * GET /api/flags-analytics/top-deal-breakers
 * Get top 20 deal breakers for display (public)
 */
router.get('/top-deal-breakers', async (req, res) => {
  try {
    const { limit = 20 } = req.query
    const topBreakers = await getTopFlags('dealBreaker', parseInt(limit))

    res.json({
      type: 'dealBreakers',
      count: topBreakers.length,
      data: topBreakers
    })
  } catch (err) {
    console.error('Error getting top deal breakers:', err)
    res.status(500).json({ error: 'Failed to get top breakers' })
  }
})

/**
 * PUT /api/flags-analytics/red-flags/:flagId/order
 * Update red flag order (admin only)
 */
router.put('/red-flags/:flagId/order', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { flagId } = req.params
    const { order } = req.body

    if (order === undefined || order < 0 || order > 20) {
      return res.status(400).json({ error: 'Order must be between 0 and 20' })
    }

    const success = await updateFlagOrder(flagId, order, 'redFlag')

    if (!success) {
      return res.status(400).json({ error: 'Failed to update flag order' })
    }

    res.json({ success: true, message: 'Flag order updated' })
  } catch (err) {
    console.error('Error updating flag order:', err)
    res.status(500).json({ error: 'Failed to update flag order' })
  }
})

/**
 * PUT /api/flags-analytics/deal-breakers/:breakerId/order
 * Update deal breaker order (admin only)
 */
router.put('/deal-breakers/:breakerId/order', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { breakerId } = req.params
    const { order } = req.body

    if (order === undefined || order < 0 || order > 20) {
      return res.status(400).json({ error: 'Order must be between 0 and 20' })
    }

    const success = await updateFlagOrder(breakerId, order, 'dealBreaker')

    if (!success) {
      return res.status(400).json({ error: 'Failed to update breaker order' })
    }

    res.json({ success: true, message: 'Breaker order updated' })
  } catch (err) {
    console.error('Error updating breaker order:', err)
    res.status(500).json({ error: 'Failed to update breaker order' })
  }
})

/**
 * DELETE /api/flags-analytics/red-flags/:flagId
 * Deactivate a red flag (admin only)
 */
router.delete('/red-flags/:flagId', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { flagId } = req.params
    const success = await deactivateFlag(flagId, 'redFlag')

    if (!success) {
      return res.status(400).json({ error: 'Failed to deactivate flag' })
    }

    res.json({ success: true, message: 'Flag deactivated' })
  } catch (err) {
    console.error('Error deactivating flag:', err)
    res.status(500).json({ error: 'Failed to deactivate flag' })
  }
})

/**
 * DELETE /api/flags-analytics/deal-breakers/:breakerId
 * Deactivate a deal breaker (admin only)
 */
router.delete('/deal-breakers/:breakerId', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    })

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { breakerId } = req.params
    const success = await deactivateFlag(breakerId, 'dealBreaker')

    if (!success) {
      return res.status(400).json({ error: 'Failed to deactivate breaker' })
    }

    res.json({ success: true, message: 'Breaker deactivated' })
  } catch (err) {
    console.error('Error deactivating breaker:', err)
    res.status(500).json({ error: 'Failed to deactivate breaker' })
  }
})

export default router
