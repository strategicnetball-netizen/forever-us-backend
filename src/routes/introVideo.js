import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Upload intro video
router.post('/upload', authenticate, async (req, res, next) => {
  try {
    const { videoUrl } = req.body;
    const userId = req.userId;

    if (!videoUrl) {
      return res.status(400).json({ error: 'Video URL is required' });
    }

    // Check if videoUrl is a valid base64 string
    if (!videoUrl.startsWith('data:video')) {
      return res.status(400).json({ error: 'Invalid video format. Must be a base64 video.' });
    }

    // Check size (base64 is ~33% larger than binary, so limit to ~5MB base64)
    const maxSize = 5 * 1024 * 1024;
    if (videoUrl.length > maxSize) {
      return res.status(413).json({ error: `Video is too large. Max 5MB. Current size: ${(videoUrl.length / 1024 / 1024).toFixed(2)}MB. Please record a shorter video or use a smaller file.` });
    }

    // Get user to check tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tier: true, introVideoUrl: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Tier-based video limits
    const tierLimits = {
      free: 1,
      premium: 2,
      vip: 3
    };

    const userTier = user.tier.toLowerCase();
    const limit = tierLimits[userTier] || 1;

    // For now, since schema only supports 1 video per user, check if they already have one
    if (user.introVideoUrl && userTier === 'free') {
      return res.status(403).json({ 
        error: 'Free tier limited to 1 video. Delete existing video to upload a new one.',
        tier: userTier,
        limit: limit,
        current: 1
      });
    }

    console.log('Uploading intro video for user:', userId, 'Tier:', userTier, 'Size:', (videoUrl.length / 1024 / 1024).toFixed(2) + 'MB');

    // Update user with intro video
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        introVideoUrl: videoUrl
      }
    });

    console.log('Intro video uploaded:', updatedUser.id);

    res.json({
      success: true,
      message: 'Intro video uploaded successfully!',
      tier: userTier,
      limit: limit
    });
  } catch (err) {
    console.error('Intro video upload error:', err);
    next(err);
  }
});

// Get intro video
router.get('/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        introVideoUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      hasVideo: !!user.introVideoUrl,
      videoUrl: user.introVideoUrl || null
    });
  } catch (err) {
    next(err);
  }
});

// Get video status for current user (includes tier info)
router.get('/status/current', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tier: true,
        introVideoUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const tierLimits = {
      free: 1,
      premium: 2,
      vip: 3
    };

    const userTier = user.tier.toLowerCase();
    const limit = tierLimits[userTier] || 1;
    const current = user.introVideoUrl ? 1 : 0;

    res.json({
      tier: userTier,
      limit: limit,
      current: current,
      hasVideo: !!user.introVideoUrl,
      slotsRemaining: limit - current
    });
  } catch (err) {
    next(err);
  }
});

// Delete intro video
router.delete('/', authenticate, async (req, res, next) => {
  try {
    const userId = req.userId;

    await prisma.user.update({
      where: { id: userId },
      data: {
        introVideoUrl: null
      }
    });

    res.json({ success: true, message: 'Intro video deleted' });
  } catch (err) {
    next(err);
  }
});

export default router;
