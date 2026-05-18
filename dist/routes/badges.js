import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Badge definitions
const BADGE_DEFINITIONS = {
    verified: {
        name: 'Verified',
        icon: '✅',
        description: 'Identity verified'
    },
    premium_member: {
        name: 'Premium Member',
        icon: '👑',
        description: 'Active premium subscriber'
    },
    active_user: {
        name: 'Active User',
        icon: '🔥',
        description: 'Frequently active'
    },
    great_conversationalist: {
        name: 'Great Conversationalist',
        icon: '💬',
        description: 'Engages in meaningful conversations'
    },
    photo_verified: {
        name: 'Photo Verified',
        icon: '📸',
        description: 'Photos verified as authentic'
    }
};
// Get user badges
router.get('/user/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const badges = await prisma.userBadge.findMany({
            where: { userId },
            orderBy: { awardedAt: 'desc' }
        });
        res.json(badges);
    }
    catch (err) {
        console.error('Error fetching badges:', err);
        res.status(500).json({ error: 'Failed to fetch badges' });
    }
});
// Award badge (admin only)
router.post('/award', authenticate, async (req, res) => {
    try {
        const { userId, badgeType } = req.body;
        // Check if user is admin
        const admin = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { isAdmin: true }
        });
        if (!admin?.isAdmin) {
            return res.status(403).json({ error: 'Only admins can award badges' });
        }
        if (!BADGE_DEFINITIONS[badgeType]) {
            return res.status(400).json({ error: 'Invalid badge type' });
        }
        const badgeDef = BADGE_DEFINITIONS[badgeType];
        // Check if user already has this badge
        const existing = await prisma.userBadge.findUnique({
            where: {
                userId_badgeType: {
                    userId,
                    badgeType
                }
            }
        });
        if (existing) {
            return res.status(400).json({ error: 'User already has this badge' });
        }
        const badge = await prisma.userBadge.create({
            data: {
                userId,
                badgeType,
                name: badgeDef.name,
                icon: badgeDef.icon,
                description: badgeDef.description
            }
        });
        res.json(badge);
    }
    catch (err) {
        console.error('Error awarding badge:', err);
        res.status(500).json({ error: 'Failed to award badge' });
    }
});
// Remove badge (admin only)
router.delete('/:badgeId', authenticate, async (req, res) => {
    try {
        const { badgeId } = req.params;
        // Check if user is admin
        const admin = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { isAdmin: true }
        });
        if (!admin?.isAdmin) {
            return res.status(403).json({ error: 'Only admins can remove badges' });
        }
        await prisma.userBadge.delete({
            where: { id: badgeId }
        });
        res.json({ success: true });
    }
    catch (err) {
        console.error('Error removing badge:', err);
        res.status(500).json({ error: 'Failed to remove badge' });
    }
});
export default router;
