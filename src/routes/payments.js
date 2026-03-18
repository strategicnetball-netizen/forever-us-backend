import express from 'express'
import { prisma } from '../index.js'
import { authenticate } from '../middleware/auth.js'
import Stripe from 'stripe'

const router = express.Router()

// Initialize Stripe if real payments are enabled
const useRealPayments = process.env.USE_REAL_PAYMENTS === 'true'
const stripe = useRealPayments ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

// Get revenue analytics (admin only)
router.get('/admin/analytics', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user.email.endsWith('@admin.com')) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    // Calculate ad revenue (assuming $0.50 per completed ad view)
    const adViews = await prisma.adView.count({
      where: {
        completed: true,
        createdAt: { gte: sevenDaysAgo }
      }
    })
    const adRevenue = adViews * 0.50

    // Calculate survey revenue (assuming $1.00 per completed survey)
    const surveyResponses = await prisma.surveyResponse.count({
      where: {
        createdAt: { gte: sevenDaysAgo }
      }
    })
    const surveyRevenue = surveyResponses * 1.00

    // Total points distributed (cost to us)
    const pointsDistributed = await prisma.pointsTransaction.aggregate({
      where: {
        createdAt: { gte: sevenDaysAgo },
        type: { in: ['ad_view', 'survey_complete', 'sign_in_bonus'] }
      },
      _sum: { amount: true }
    })
    const pointsCost = (pointsDistributed._sum.amount || 0) * 0.01

    // 30-day metrics
    const adViews30 = await prisma.adView.count({
      where: {
        completed: true,
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    const surveyResponses30 = await prisma.surveyResponse.count({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      }
    })

    res.json({
      period: '7_days',
      adViews,
      adRevenue,
      surveyResponses,
      surveyRevenue,
      totalRevenue: adRevenue + surveyRevenue,
      pointsCost,
      netProfit: (adRevenue + surveyRevenue) - pointsCost,
      metrics30Days: {
        adViews: adViews30,
        surveyResponses: surveyResponses30
      }
    })
  } catch (err) {
    next(err)
  }
})

// Get user payment history
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    })

    res.json(transactions)
  } catch (err) {
    next(err)
  }
})

// Get packages (for tier upgrades)
router.get('/packages', async (req, res, next) => {
  try {
    res.json({
      free: {
        name: 'Free',
        price: 0,
        features: ['Browse profiles', 'Like/Pass', 'Earn points']
      },
      premium: {
        name: 'Premium',
        price: 6.99,
        features: ['All Free features', 'Send messages', 'See who liked you']
      },
      vip: {
        name: 'VIP',
        price: 16.99,
        features: ['All Premium features', 'Unlimited messaging', 'Priority support']
      }
    })
  } catch (err) {
    next(err)
  }
})

// Create payment intent for Stripe
router.post('/create-payment-intent', authenticate, async (req, res, next) => {
  try {
    if (!useRealPayments || !stripe) {
      return res.status(400).json({ error: 'Real payments not enabled' })
    }

    const { amount, tier, plan } = req.body

    if (!amount || !tier || !plan) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: req.userId,
        tier,
        plan
      }
    })

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    })
  } catch (err) {
    next(err)
  }
})

// Upgrade tier with payment validation
router.post('/upgrade', authenticate, async (req, res, next) => {
  try {
    const { packageKey, subscriptionPlan, paymentIntentId } = req.body

    console.log('Upgrade request:', { packageKey, subscriptionPlan, paymentIntentId, userId: req.userId })

    const validTiers = ['free', 'premium', 'vip']
    if (!validTiers.includes(packageKey)) {
      return res.status(400).json({ error: 'Invalid package' })
    }

    const validPlans = ['monthly', 'quarterly', 'biannual', 'yearly']
    const plan = subscriptionPlan || 'monthly'
    if (!validPlans.includes(plan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' })
    }

    // Define pricing for each tier and plan (in dollars)
    const pricing = {
      premium: {
        monthly: 9.99,
        quarterly: 24.99,
        biannual: 39.99,
        yearly: 59.99
      },
      vip: {
        monthly: 19.99,
        quarterly: 49.99,
        biannual: 79.99,
        yearly: 119.99
      }
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    console.log('Current user tier:', user.tier)

    // Check if user is trying to downgrade
    const tierHierarchy = { free: 0, premium: 1, vip: 2 }
    if (tierHierarchy[packageKey] <= tierHierarchy[user.tier]) {
      return res.status(400).json({ error: 'Cannot downgrade tier' })
    }

    // Get the price for this tier and plan
    const price = pricing[packageKey]?.[plan]
    if (!price) {
      return res.status(400).json({ error: 'Invalid tier or plan combination' })
    }

    let paymentSucceeded = false
    let paymentMode = 'simulated'

    // Use real Stripe payment if enabled and paymentIntentId provided
    if (useRealPayments && stripe && paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

        if (paymentIntent.status !== 'succeeded') {
          return res.status(402).json({
            error: 'Payment failed. Please check your payment method and try again.',
            paymentStatus: paymentIntent.status
          })
        }

        paymentSucceeded = true
        paymentMode = 'stripe'
      } catch (stripeErr) {
        console.error('Stripe error:', stripeErr)
        return res.status(402).json({
          error: stripeErr.message || 'Payment processing failed. Please try again.'
        })
      }
    } else if (!useRealPayments || !paymentIntentId) {
      // Simulated payment for testing (when USE_REAL_PAYMENTS is false or no paymentIntentId)
      paymentSucceeded = true
      paymentMode = 'simulated'
    } else if (useRealPayments && !paymentIntentId) {
      return res.status(400).json({
        error: 'Payment intent required for real payments'
      })
    }

    console.log('Payment validation passed, mode:', paymentMode)

    // Calculate subscription expiration based on plan
    const expiresAt = new Date()
    switch (plan) {
      case 'monthly':
        expiresAt.setMonth(expiresAt.getMonth() + 1)
        break
      case 'quarterly':
        expiresAt.setMonth(expiresAt.getMonth() + 3)
        break
      case 'biannual':
        expiresAt.setMonth(expiresAt.getMonth() + 6)
        break
      case 'yearly':
        expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        break
    }

    // Update user tier (and ensure profileCompleted is true so they don't get redirected to onboarding)
    // Also reset daily limits when upgrading
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        tier: packageKey,
        trialTier: null,
        trialExpiresAt: null,
        profileCompleted: true,
        likesUsedToday: 0,
        lastLikeResetDate: new Date(),
        passesUsedToday: 0,
        lastPassResetDate: new Date(),
        messagesUsedToday: 0,
        lastMessageResetDate: new Date()
      }
    })

    console.log('User upgraded to:', updatedUser.tier)

    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: req.userId,
        amount: 0,
        type: 'tier_upgrade',
        reason: `Upgraded to ${packageKey} tier (${plan} plan) for $${price}`
      }
    })

    res.json({
      success: true,
      message: `Successfully upgraded to ${packageKey} tier!`,
      user: updatedUser,
      subscription: {
        tier: packageKey,
        plan,
        price,
        expiresAt
      },
      paymentMode
    })
  } catch (err) {
    console.error('Upgrade endpoint error:', err)
    next(err)
  }
})

// Downgrade tier (free, no payment required)
router.post('/downgrade', authenticate, async (req, res, next) => {
  try {
    const { packageKey } = req.body

    const validTiers = ['free', 'premium']
    if (!validTiers.includes(packageKey)) {
      return res.status(400).json({ error: 'Invalid package' })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if user is trying to upgrade (not allowed via downgrade endpoint)
    const tierHierarchy = { free: 0, premium: 1, vip: 2 }
    if (tierHierarchy[packageKey] >= tierHierarchy[user.tier]) {
      return res.status(400).json({ error: 'Cannot upgrade via downgrade endpoint' })
    }

    // Update user tier (and ensure profileCompleted is true)
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        tier: packageKey,
        trialTier: null,
        trialExpiresAt: null,
        profileCompleted: true
      }
    })

    res.json({
      success: true,
      message: `Successfully downgraded to ${packageKey} tier!`,
      user: updatedUser
    })
  } catch (err) {
    next(err)
  }
})

// Buy coins endpoint
router.post('/buy-coins', authenticate, async (req, res, next) => {
  try {
    const { packageId, paymentIntentId } = req.body

    // Define coin packages
    const coinPackages = {
      'coins_50': { coins: 50, price: 0.99 },
      'coins_250': { coins: 250, price: 3.99 },
      'coins_500': { coins: 500, price: 6.99 },
      'coins_1000': { coins: 1000, price: 11.99 },
      'coins_2500': { coins: 2500, price: 24.99 }
    }

    if (!coinPackages[packageId]) {
      return res.status(400).json({ error: 'Invalid coin package' })
    }

    const pkg = coinPackages[packageId]
    let paymentMode = 'simulated'

    // Validate payment if using real Stripe
    if (useRealPayments && stripe && paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

        if (paymentIntent.status !== 'succeeded') {
          return res.status(402).json({
            error: 'Payment failed. Please try again.',
            paymentStatus: paymentIntent.status
          })
        }

        paymentMode = 'stripe'
      } catch (stripeErr) {
        console.error('Stripe error:', stripeErr)
        return res.status(402).json({
          error: stripeErr.message || 'Payment processing failed.'
        })
      }
    }

    // Add coins to user
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        points: { increment: pkg.coins }
      }
    })

    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: req.userId,
        amount: pkg.coins,
        type: 'coin_purchase',
        reason: `Purchased ${pkg.coins} coins for $${pkg.price}`
      }
    })

    res.json({
      success: true,
      message: `Successfully purchased ${pkg.coins} coins!`,
      coinsAdded: pkg.coins,
      totalPoints: user.points,
      paymentMode
    })
  } catch (err) {
    next(err)
  }
})

// Trial upgrade for 500 points (1 month)
router.post('/trial-upgrade', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Determine next tier based on current tier
    let nextTier
    if (user.tier === 'free') {
      nextTier = 'premium'
    } else if (user.tier === 'premium') {
      nextTier = 'vip'
    } else {
      return res.status(400).json({ error: 'VIP users cannot upgrade further' })
    }

    // Check if user already has an active trial
    if (user.trialExpiresAt && user.trialExpiresAt > new Date()) {
      return res.status(400).json({ error: 'You already have an active trial upgrade' })
    }

    // Check if user has enough points
    if (user.points < 500) {
      return res.status(400).json({ error: 'Insufficient points. Need 500 points for trial upgrade.' })
    }

    // Calculate trial expiration (1 month from now)
    const trialExpiresAt = new Date()
    trialExpiresAt.setMonth(trialExpiresAt.getMonth() + 1)

    // Update user with trial tier and deduct points (and ensure profileCompleted is true)
    // Also reset daily limits when upgrading
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        trialTier: nextTier,
        trialExpiresAt,
        points: { decrement: 500 },
        profileCompleted: true,
        likesUsedToday: 0,
        lastLikeResetDate: new Date(),
        passesUsedToday: 0,
        lastPassResetDate: new Date(),
        messagesUsedToday: 0,
        lastMessageResetDate: new Date()
      }
    })

    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: req.userId,
        amount: -500,
        type: 'trial_upgrade',
        reason: `1-month trial upgrade to ${nextTier}`
      }
    })

    res.json({
      success: true,
      message: `Trial upgrade to ${nextTier} for 1 month activated!`,
      user: updatedUser,
      trialExpiresAt
    })
  } catch (err) {
    next(err)
  }
})

export default router
