import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Badge definitions
const BADGES = {
    first_match: {
        name: 'Matchmaker',
        icon: '💕',
        description: 'Got your first match',
        trigger: 'match_count',
        threshold: 1
    },
    conversationalist: {
        name: 'Conversationalist',
        icon: '💬',
        description: 'Sent 10 messages',
        trigger: 'message_count',
        threshold: 10
    },
    authentic: {
        name: 'Authentic',
        icon: '✅',
        description: 'Verified your profile',
        trigger: 'verified',
        threshold: 1
    },
    popular: {
        name: 'Popular',
        icon: '⭐',
        description: 'Received 50 likes',
        trigger: 'like_count',
        threshold: 50
    },
    dedicated: {
        name: 'Dedicated',
        icon: '🔥',
        description: '7-day login streak',
        trigger: 'login_streak',
        threshold: 7
    },
    premium_member: {
        name: 'Premium Member',
        icon: '✨',
        description: 'Upgraded to Premium',
        trigger: 'tier',
        threshold: 'premium'
    },
    vip_member: {
        name: 'VIP Elite',
        icon: '👑',
        description: 'Upgraded to VIP',
        trigger: 'tier',
        threshold: 'vip'
    },
    profile_complete: {
        name: 'Complete Profile',
        icon: '📝',
        description: 'Completed your profile',
        trigger: 'profile_complete',
        threshold: 1
    }
};
// Get user badges
router.get('/user', authenticate, async (req, res, next) => {
    try {
        const badges = await prisma.userBadge.findMany({
            where: { userId: req.userId },
            orderBy: { awardedAt: 'desc' }
        });
        res.json(badges);
    }
    catch (err) {
        next(err);
    }
});
// Get all available badges
router.get('/available', authenticate, async (req, res, next) => {
    try {
        const userBadges = await prisma.userBadge.findMany({
            where: { userId: req.userId },
            select: { badgeType: true }
        });
        const earnedBadgeTypes = new Set(userBadges.map(b => b.badgeType));
        const available = Object.entries(BADGES).map(([key, badge]) => ({
            id: key,
            ...badge,
            earned: earnedBadgeTypes.has(key)
        }));
        res.json(available);
    }
    catch (err) {
        next(err);
    }
});
// Check and award badges for user
router.post('/check', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId },
            include: {
                _count: {
                    select: {
                        likes: true,
                        likedBy: true,
                        sentMessages: true,
                        matches: true
                    }
                }
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const existingBadges = await prisma.userBadge.findMany({
            where: { userId: req.userId },
            select: { badgeType: true }
        });
        const earnedBadgeTypes = new Set(existingBadges.map(b => b.badgeType));
        const newBadges = [];
        // Check each badge condition
        if (!earnedBadgeTypes.has('first_match') && user._count.matches >= 1) {
            newBadges.push('first_match');
        }
        if (!earnedBadgeTypes.has('conversationalist') && user._count.sentMessages >= 10) {
            newBadges.push('conversationalist');
        }
        if (!earnedBadgeTypes.has('authentic') && user.isVerified) {
            newBadges.push('authentic');
        }
        if (!earnedBadgeTypes.has('popular') && user._count.likedBy >= 50) {
            newBadges.push('popular');
        }
        if (!earnedBadgeTypes.has('profile_complete') && user.profileCompleted) {
            newBadges.push('profile_complete');
        }
        if (!earnedBadgeTypes.has('premium_member') && user.tier === 'premium') {
            newBadges.push('premium_member');
        }
        if (!earnedBadgeTypes.has('vip_member') && user.tier === 'vip') {
            newBadges.push('vip_member');
        }
        // Award new badges
        for (const badgeType of newBadges) {
            const badge = BADGES[badgeType];
            await prisma.userBadge.create({
                data: {
                    userId: req.userId,
                    badgeType,
                    name: badge.name,
                    icon: badge.icon,
                    description: badge.description
                }
            });
        }
        res.json({
            newBadges,
            totalBadges: earnedBadgeTypes.size + newBadges.length
        });
    }
    catch (err) {
        next(err);
    }
});
// Get badges for a specific user (public)
router.get('/:userId', async (req, res, next) => {
    try {
        const badges = await prisma.userBadge.findMany({
            where: { userId: req.params.userId },
            select: {
                badgeType: true,
                name: true,
                icon: true,
                description: true,
                awardedAt: true
            },
            orderBy: { awardedAt: 'desc' }
        });
        res.json(badges);
    }
    catch (err) {
        next(err);
    }
});
export default router;
