import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
import { canWatchAd, incrementAdCount } from '../utils/dailyLimits.js';
const router = express.Router();
const prisma = new PrismaClient();
// AdMob ad completion
router.post('/admob/complete', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const ADMOB_REWARD = 10;
        // Check daily ad limit (same as regular ads - 10 per day)
        const adLimitCheck = await canWatchAd(prisma, userId);
        if (!adLimitCheck.canWatchAd) {
            return res.status(429).json({
                error: adLimitCheck.error,
                remaining: adLimitCheck.remaining,
                limit: adLimitCheck.limit
            });
        }
        // Record the reward
        await prisma.thirdPartyReward.create({
            data: {
                userId,
                provider: 'admob',
                points: ADMOB_REWARD
            }
        });
        // Increment ad counter
        await incrementAdCount(prisma, userId);
        // Add points to user
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                points: {
                    increment: ADMOB_REWARD
                }
            }
        });
        res.json({ earned: ADMOB_REWARD });
    }
    catch (err) {
        console.error('AdMob completion error:', err);
        res.status(500).json({ error: 'Failed to process AdMob reward' });
    }
});
// Pollfish survey completion
router.post('/pollfish/complete', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const POLLFISH_REWARD = 15;
        // Check daily ad limit (same as regular ads - 10 per day)
        const adLimitCheck = await canWatchAd(prisma, userId);
        if (!adLimitCheck.canWatchAd) {
            return res.status(429).json({
                error: adLimitCheck.error,
                remaining: adLimitCheck.remaining,
                limit: adLimitCheck.limit
            });
        }
        // Record the reward
        await prisma.thirdPartyReward.create({
            data: {
                userId,
                provider: 'pollfish',
                points: POLLFISH_REWARD
            }
        });
        // Increment ad counter
        await incrementAdCount(prisma, userId);
        // Add points to user
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                points: {
                    increment: POLLFISH_REWARD
                }
            }
        });
        res.json({ earned: POLLFISH_REWARD });
    }
    catch (err) {
        console.error('Pollfish completion error:', err);
        res.status(500).json({ error: 'Failed to process Pollfish reward' });
    }
});
export default router;
