import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.get('/balance', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { points: true }
    });
    
    res.json({ points: user.points });
  } catch (err) {
    next(err);
  }
});

router.get('/history', authenticate, async (req, res, next) => {
  try {
    const transactions = await prisma.pointsTransaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// Internal endpoint to add points (called by job processors)
router.post('/add', authenticate, async (req, res, next) => {
  try {
    const { amount, type, reason } = req.body;
    
    if (!amount || !type) {
      return res.status(400).json({ error: 'Missing amount or type' });
    }
    
    // Update user points
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { points: { increment: amount } }
    });
    
    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: req.userId,
        amount,
        type,
        reason
      }
    });
    
    res.json({ points: user.points });
  } catch (err) {
    next(err);
  }
});

// Internal endpoint to deduct points
router.post('/deduct', authenticate, async (req, res, next) => {
  try {
    const { amount, type, reason } = req.body;
    
    if (!amount || !type) {
      return res.status(400).json({ error: 'Missing amount or type' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { points: true }
    });
    
    if (user.points < amount) {
      return res.status(400).json({ error: 'Insufficient points' });
    }
    
    // Update user points
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { points: { decrement: amount } }
    });
    
    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: req.userId,
        amount: -amount,
        type,
        reason
      }
    });
    
    res.json({ points: updatedUser.points });
  } catch (err) {
    next(err);
  }
});

// Get current sign-in status (without claiming)
router.get('/sign-in-status', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user has already claimed bonus today
    const lastSignIn = user.lastSignInDate ? new Date(user.lastSignInDate) : null;
    const lastSignInDate = lastSignIn ? new Date(lastSignIn) : null;
    lastSignInDate?.setHours(0, 0, 0, 0);
    
    const alreadyClaimedToday = lastSignInDate && lastSignInDate.getTime() === today.getTime();
    
    res.json({
      alreadyClaimedToday,
      weeklySignInCount: user.weeklySignInCount || 0,
      lastSignInDate: user.lastSignInDate
    });
  } catch (err) {
    next(err);
  }
});

// Sign-in bonus endpoint
router.post('/sign-in-bonus', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if user has already claimed bonus today
    const lastSignIn = user.lastSignInDate ? new Date(user.lastSignInDate) : null;
    const lastSignInDate = lastSignIn ? new Date(lastSignIn) : null;
    lastSignInDate?.setHours(0, 0, 0, 0);
    
    if (lastSignInDate && lastSignInDate.getTime() === today.getTime()) {
      return res.status(400).json({ error: 'You have already claimed your sign-in bonus today' });
    }
    
    let bonusPoints = 15;
    let weeklyBonus = false;
    
    // Check for weekly bonus (every 7 days)
    const weeklyResetDate = user.weeklySignInResetDate ? new Date(user.weeklySignInResetDate) : null;
    const daysSinceReset = weeklyResetDate ? Math.floor((today.getTime() - weeklyResetDate.getTime()) / (1000 * 60 * 60 * 24)) : 7;
    
    let newWeeklyCount = user.weeklySignInCount + 1;
    let newWeeklyResetDate = user.weeklySignInResetDate;
    
    if (daysSinceReset >= 7) {
      // Reset weekly counter
      newWeeklyCount = 1;
      newWeeklyResetDate = today;
    }
    
    if (newWeeklyCount === 7) {
      // Weekly bonus on 7th sign-in
      bonusPoints += 25;
      weeklyBonus = true;
    }
    
    // Update user with new sign-in info
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: {
        points: { increment: bonusPoints },
        lastSignInDate: new Date(),
        weeklySignInCount: newWeeklyCount,
        weeklySignInResetDate: newWeeklyResetDate
      }
    });
    
    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: req.userId,
        amount: bonusPoints,
        type: 'sign_in_bonus',
        reason: weeklyBonus ? 'Daily + Weekly sign-in bonus' : 'Daily sign-in bonus'
      }
    });
    
    res.json({ 
      points: updatedUser.points,
      bonusPoints,
      weeklyBonus,
      weeklySignInCount: newWeeklyCount
    });
  } catch (err) {
    next(err);
  }
});

export default router;
