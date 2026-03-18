import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { getPointsCost } from '../utils/constants.js';
import { canLike, canPass, incrementLikeCount, incrementPassCount } from '../utils/dailyLimits.js';

const router = express.Router();

router.post('/:likedId', authenticate, async (req, res, next) => {
  try {
    const { likedId } = req.params;
    const { isAiPick } = req.body; // Flag to indicate if this is from AI picks
    
    if (req.userId === likedId) {
      return res.status(400).json({ error: 'Cannot like yourself' });
    }
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { tier: true, points: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get like cost based on tier and usage
    const limitCheck = await canLike(prisma, req.userId);
    
    // Check if user has hit the daily like limit
    if (!limitCheck.canLike) {
      return res.status(429).json({ 
        error: limitCheck.error,
        limitReached: true,
        remaining: 0
      });
    }
    
    let likeCost = isAiPick ? 0 : (limitCheck.costPerLike || 0);
    
    // Check if user has enough coins for the like
    if (user.points < likeCost) {
      return res.status(400).json({ 
        error: `Insufficient coins. Need ${likeCost} coins to like.`,
        required: likeCost,
        available: user.points
      });
    }
    
    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        likerId_likedId: {
          likerId: req.userId,
          likedId
        }
      }
    });
    
    if (existingLike) {
      return res.status(400).json({ error: 'Already liked this user' });
    }
    
    // Create like
    const like = await prisma.like.create({
      data: {
        likerId: req.userId,
        likedId
      }
    });
    
    // ALWAYS increment like counter (tracks total likes used, both free and paid)
    await incrementLikeCount(prisma, req.userId);
    
    // Increment likes given counter
    await prisma.user.update({
      where: { id: req.userId },
      data: { likesGiven: { increment: 1 } }
    });
    
    // Deduct coins if cost > 0 (only for likes beyond the free limit)
    if (likeCost > 0) {
      try {
        await prisma.user.update({
          where: { id: req.userId },
          data: { points: { decrement: likeCost } }
        });
        
        // Record transaction
        await prisma.pointsTransaction.create({
          data: {
            userId: req.userId,
            amount: -likeCost,
            type: 'like_sent',
            reason: 'Like sent'
          }
        });
      } catch (pointsErr) {
        console.error('Points deduction error:', pointsErr);
        // Continue anyway - like was created successfully
      }
    }
    
    // Check for mutual like (match)
    const mutualLike = await prisma.like.findUnique({
      where: {
        likerId_likedId: {
          likerId: likedId,
          likedId: req.userId
        }
      }
    });
    
    if (mutualLike) {
      // Create match (only from one side to avoid duplicates)
      try {
        // Check if match already exists
        const existingMatch = await prisma.match.findFirst({
          where: {
            OR: [
              { userId: req.userId, matchedUserId: likedId },
              { userId: likedId, matchedUserId: req.userId }
            ]
          }
        });
        
        if (!existingMatch) {
          await prisma.match.create({
            data: {
              userId: req.userId,
              matchedUserId: likedId
            }
          });
        }
      } catch (matchErr) {
        console.error('Match creation error:', matchErr);
        // Continue anyway - like was created successfully
      }
      
      return res.status(201).json({
        like,
        match: true,
        message: 'It\'s a match!',
        pointsCost: likeCost
      });
    }
    
    res.status(201).json({ like, match: false, pointsCost: likeCost });
  } catch (err) {
    console.error('Like endpoint error:', err);
    next(err);
  }
});

router.get('/sent', authenticate, async (req, res, next) => {
  try {
    // Get list of blocked users
    let blockedIds = [];
    try {
      const blockedUsers = await prisma.blockedUser.findMany({
        where: { blockerId: req.userId },
        select: { blockedId: true }
      });
      blockedIds = blockedUsers.map(b => b.blockedId);
    } catch (blockErr) {
      // Block table might not exist or have issues, continue without filtering
      console.error('Error fetching blocked users:', blockErr);
    }
    
    const likes = await prisma.like.findMany({
      where: { 
        likerId: req.userId,
        ...(blockedIds.length > 0 && { likedId: { notIn: blockedIds } })
      },
      include: {
        liked: {
          select: {
            id: true,
            name: true,
            avatar: true,
            age: true,
            location: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(likes);
  } catch (err) {
    next(err);
  }
});

router.get('/matches', authenticate, async (req, res, next) => {
  try {
    const matches = await prisma.match.findMany({
      where: { userId: req.userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            age: true,
            location: true
          }
        }
      }
    });
    
    res.json(matches);
  } catch (err) {
    next(err);
  }
});

router.delete('/:likedId', authenticate, async (req, res, next) => {
  try {
    const { likedId } = req.params;
    
    // Try to delete the like you sent
    const deletedLike = await prisma.like.deleteMany({
      where: {
        likerId: req.userId,
        likedId
      }
    });
    
    if (deletedLike.count === 0) {
      return res.status(404).json({ error: 'Like not found' });
    }
    
    // Also delete the like they sent (to remove match)
    await prisma.like.deleteMany({
      where: {
        likerId: likedId,
        likedId: req.userId
      }
    });
    
    // Delete matches
    await prisma.match.deleteMany({
      where: {
        userId: req.userId,
        matchedUserId: likedId
      }
    });
    
    await prisma.match.deleteMany({
      where: {
        userId: likedId,
        matchedUserId: req.userId
      }
    });
    
    res.json({ message: 'Like removed' });
  } catch (err) {
    console.error('Delete like error:', err);
    next(err);
  }
});

// Undo a like (rewind) - costs points based on tier
router.post('/:likedId/undo', authenticate, async (req, res, next) => {
  try {
    const { likedId } = req.params;
    
    // Check if like exists
    const like = await prisma.like.findUnique({
      where: {
        likerId_likedId: {
          likerId: req.userId,
          likedId
        }
      }
    });
    
    if (!like) {
      return res.status(404).json({ error: 'Like not found' });
    }
    
    // Get user tier
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { tier: true, points: true, trialTier: true, trialExpiresAt: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get effective tier (considering trial)
    let effectiveTier = user.tier;
    if (user.trialExpiresAt && new Date(user.trialExpiresAt) > new Date()) {
      effectiveTier = user.trialTier || user.tier;
    }
    
    // Get undo cost based on tier
    const undoCost = getPointsCost(effectiveTier, 'undo');
    
    // Check if user has enough points
    if (user.points < undoCost) {
      return res.status(400).json({ 
        error: `Insufficient points. Need ${undoCost} points to undo.` 
      });
    }
    
    // Delete the like
    await prisma.like.delete({
      where: {
        likerId_likedId: {
          likerId: req.userId,
          likedId
        }
      }
    });
    
    // Delete any match if it existed
    await prisma.match.deleteMany({
      where: {
        userId: req.userId,
        matchedUserId: likedId
      }
    });
    
    await prisma.match.deleteMany({
      where: {
        userId: likedId,
        matchedUserId: req.userId
      }
    });
    
    // Deduct undo cost if > 0
    if (undoCost > 0) {
      await prisma.user.update({
        where: { id: req.userId },
        data: { points: { decrement: undoCost } }
      });
      
      // Record transaction
      await prisma.pointsTransaction.create({
        data: {
          userId: req.userId,
          amount: -undoCost,
          type: 'like_undo',
          reason: 'Like undo/rewind'
        }
      });
    }
    
    // Record undo action
    await prisma.undoAction.create({
      data: {
        userId: req.userId,
        actionType: 'like_undo',
        targetUserId: likedId,
        pointsRefunded: undoCost
      }
    });
    
    res.json({ 
      message: 'Like undone',
      undoCost,
      remainingPoints: user.points - undoCost
    });
  } catch (err) {
    console.error('Undo like error:', err);
    next(err);
  }
});

// Pass on a profile - tracks pass with daily limit
router.post('/:passedId/pass', authenticate, async (req, res, next) => {
  try {
    const { passedId } = req.params;
    
    if (req.userId === passedId) {
      return res.status(400).json({ error: 'Cannot pass on yourself' });
    }
    
    // Check daily pass limit
    const limitCheck = await canPass(prisma, req.userId);
    if (!limitCheck.canPass) {
      return res.status(429).json({ 
        error: limitCheck.error,
        limitReached: true,
        remaining: limitCheck.remaining,
        limit: limitCheck.limit
      });
    }
    
    // Increment pass counter
    await incrementPassCount(prisma, req.userId);
    
    // Increment passes given counter
    await prisma.user.update({
      where: { id: req.userId },
      data: { passesGiven: { increment: 1 } }
    });
    
    // Record pass action in UserBehavior
    try {
      await prisma.userBehavior.create({
        data: {
          userId: req.userId,
          targetUserId: passedId,
          actionType: 'pass'
        }
      });
    } catch (behaviorErr) {
      console.error('Error recording pass behavior:', behaviorErr);
      // Continue anyway - pass was recorded in counter
    }
    
    res.json({ 
      success: true, 
      message: 'Passed on profile',
      remaining: limitCheck.remaining - 1
    });
  } catch (err) {
    console.error('Pass endpoint error:', err);
    next(err);
  }
});

export default router;
