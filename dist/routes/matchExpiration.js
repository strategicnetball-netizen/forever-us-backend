import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Check and expire old matches (14 days with no message)
router.post('/check-expiration', authenticate, async (req, res, next) => {
    try {
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        // Find matches that are 14+ days old with no messages
        const expiredMatches = await prisma.match.findMany({
            where: {
                userId: req.userId,
                isExpired: false,
                createdAt: { lte: fourteenDaysAgo }
            },
            include: {
                matchedUser: true
            }
        });
        // Check each match for messages
        const matchesToExpire = [];
        for (const match of expiredMatches) {
            const messageCount = await prisma.message.count({
                where: {
                    OR: [
                        { senderId: req.userId, receiverId: match.matchedUserId },
                        { senderId: match.matchedUserId, receiverId: req.userId }
                    ]
                }
            });
            if (messageCount === 0) {
                matchesToExpire.push(match);
            }
        }
        // Expire matches and create notifications
        for (const match of matchesToExpire) {
            await prisma.match.update({
                where: { id: match.id },
                data: { isExpired: true }
            });
            // Create notification
            await prisma.notification.create({
                data: {
                    userId: req.userId,
                    type: 'match_expired',
                    title: 'Match Expired',
                    message: `Your match with ${match.matchedUser.name} has expired after 14 days with no messages.`,
                    relatedUserId: match.matchedUserId,
                    relatedId: match.id
                }
            });
        }
        res.json({
            expiredCount: matchesToExpire.length,
            expiredMatches: matchesToExpire
        });
    }
    catch (err) {
        next(err);
    }
});
// Refresh/get new matches (removes expired ones from view)
router.post('/refresh', authenticate, async (req, res, next) => {
    try {
        // Mark expired matches as expired
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const expiredMatches = await prisma.match.findMany({
            where: {
                userId: req.userId,
                isExpired: false,
                createdAt: { lte: fourteenDaysAgo }
            }
        });
        for (const match of expiredMatches) {
            const messageCount = await prisma.message.count({
                where: {
                    OR: [
                        { senderId: req.userId, receiverId: match.matchedUserId },
                        { senderId: match.matchedUserId, receiverId: req.userId }
                    ]
                }
            });
            if (messageCount === 0) {
                await prisma.match.update({
                    where: { id: match.id },
                    data: { isExpired: true }
                });
            }
        }
        // Get active matches (not expired)
        const activeMatches = await prisma.match.findMany({
            where: {
                userId: req.userId,
                isExpired: false
            },
            include: {
                matchedUser: {
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
        res.json({
            activeMatches,
            totalActive: activeMatches.length
        });
    }
    catch (err) {
        next(err);
    }
});
// Get match details with expiration info
router.get('/:matchId', authenticate, async (req, res, next) => {
    try {
        const match = await prisma.match.findUnique({
            where: { id: req.params.matchId },
            include: {
                matchedUser: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        age: true,
                        location: true,
                        bio: true
                    }
                }
            }
        });
        if (!match) {
            return res.status(404).json({ error: 'Match not found' });
        }
        // Check if match is expired
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
        const isOldEnough = match.createdAt <= fourteenDaysAgo;
        if (isOldEnough && !match.isExpired) {
            const messageCount = await prisma.message.count({
                where: {
                    OR: [
                        { senderId: req.userId, receiverId: match.matchedUserId },
                        { senderId: match.matchedUserId, receiverId: req.userId }
                    ]
                }
            });
            if (messageCount === 0) {
                await prisma.match.update({
                    where: { id: match.id },
                    data: { isExpired: true }
                });
                match.isExpired = true;
            }
        }
        // Calculate days until expiration
        const daysOld = Math.floor((Date.now() - match.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysUntilExpiration = Math.max(0, 14 - daysOld);
        res.json({
            ...match,
            daysOld,
            daysUntilExpiration,
            willExpireIn: daysUntilExpiration === 0 ? 'expired' : `${daysUntilExpiration} days`
        });
    }
    catch (err) {
        next(err);
    }
});
export default router;
