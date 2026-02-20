import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { getPointsCost } from '../utils/constants.js';
import { canLike, incrementLikeCount } from '../utils/dailyLimits.js';

const router = express.Router();

router.post('/:likedId', authenticate, async (req, res, next) => {
  try {
    const { likedId } = req.params;
    const { isAiPick } = req.body; // Flag to indicate if this is from AI picks
    
    if (req.userId === likedId) {
      return res.status(400).json({ error: 'Cannot like yourself' });
    }
    
    // Check daily like limit
    const limitCheck = await canLike(prisma, req.userId);
    if (!limitCheck.canLike) {
      return res.status(429).json({ 
        error: limitCheck.error,
        limitReached: true,
        remaining: limitCheck.remaining,
        limit: limitCheck.limit
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
    
    // Get user tier
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { tier: true, points: true }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get points cost based on tier (0 if AI pick)
    const pointsCost = isAiPick ? 0 : getPointsCost(user.tier, 'like');
    
    // Check if user has enough points
    if (user.points < pointsCost) {
      return res.status(400).json({ 
        error: `Insufficient points. Need ${pointsCost} points to like.` 
      });
    }
    
    // Create like
    const like = await prisma.like.create({
      data: {
        likerId: req.userId,
        likedId
      }
    });
    
    // Increment like counter
    await incrementLikeCount(prisma, req.userId);
    
    // Deduct points if cost > 0
    if (pointsCost > 0) {
      try {
        await prisma.user.update({
          where: { id: req.userId },
          data: { points: { decrement: pointsCost } }
        });
        
        // Record transaction
        await prisma.pointsTransaction.create({
          data: {
            userId: req.userId,
            amount: -pointsCost,
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
        pointsCost
      });
    }
    
    res.status(201).json({ like, match: false, pointsCost });
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

export default router;
