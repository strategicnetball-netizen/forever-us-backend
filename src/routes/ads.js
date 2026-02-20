import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { checkAdFraud, recordAdCompletion, shouldBlockUser } from '../utils/fraudDetection.js';

const router = express.Router();

router.get('/', authenticate, async (req, res, next) => {
  try {
    const ads = await prisma.ad.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        rewardPoints: true,
        videoUrl: true
      }
    });
    
    res.json(ads);
  } catch (err) {
    next(err);
  }
});

router.post('/:adId/view', authenticate, async (req, res, next) => {
  try {
    const { adId } = req.params;
    
    // Check if user is flagged for fraud
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    
    if (user.isFlagged) {
      return res.status(403).json({ error: 'Account flagged for suspicious activity' });
    }
    
    // Delete any existing view for this user+ad to allow re-watching
    await prisma.adView.deleteMany({
      where: {
        userId: req.userId,
        adId
      }
    });
    
    // Create new ad view record
    const adView = await prisma.adView.create({
      data: {
        userId: req.userId,
        adId,
        completed: false
      }
    });
    
    res.json({ viewId: adView.id });
  } catch (err) {
    next(err);
  }
});

router.post('/:adId/complete', authenticate, async (req, res, next) => {
  try {
    const { adId } = req.params;
    
    // Find the most recent incomplete ad view for this user and ad
    const adView = await prisma.adView.findFirst({
      where: {
        userId: req.userId,
        adId,
        completed: false
      },
      include: { ad: true },
      orderBy: { createdAt: 'desc' }
    });
    
    if (!adView) {
      return res.status(404).json({ error: 'Ad view not found' });
    }
    
    // NOTE: Fraud checks disabled for ads - unlimited ad watching allowed for revenue
    // Uncomment below when implementing real ads with fraud detection
    // const fraudCheck = await checkAdFraud(req.userId, adView.ad.duration);
    // if (fraudCheck.isFraud) {
    //   return res.status(403).json({ 
    //     error: 'Account flagged for suspicious activity. Please contact support.' 
    //   });
    // }
    
    // Mark as completed
    await prisma.adView.update({
      where: { id: adView.id },
      data: { completed: true }
    });
    
    // Record completion for rate limiting
    await recordAdCompletion(req.userId);
    
    // Award points
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { points: { increment: adView.ad.rewardPoints } }
    });
    
    // Record transaction
    await prisma.pointsTransaction.create({
      data: {
        userId: req.userId,
        amount: adView.ad.rewardPoints,
        type: 'ad_view',
        reason: `Watched ad: ${adView.ad.title}`
      }
    });
    
    res.json({
      points: user.points,
      earned: adView.ad.rewardPoints
    });
  } catch (err) {
    next(err);
  }
});

export default router;
