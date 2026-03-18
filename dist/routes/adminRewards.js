import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Admin: Distribute points to individual user
router.post('/distribute', authenticate, async (req, res, next) => {
    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!admin.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { userEmail, points, reason, sendNotification } = req.body;
        if (!userEmail || !points || !reason) {
            return res.status(400).json({ error: 'Missing required fields: userEmail, points, reason' });
        }
        if (points <= 0) {
            return res.status(400).json({ error: 'Points must be greater than 0' });
        }
        if (reason.trim().length < 5) {
            return res.status(400).json({ error: 'Reason must be at least 5 characters' });
        }
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Update user points
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { points: { increment: points } }
        });
        // Record the reward
        const reward = await prisma.adminReward.create({
            data: {
                adminId: req.userId,
                userId: user.id,
                points,
                reason,
                notificationSent: false
            }
        });
        // Send notification if requested
        if (sendNotification) {
            await prisma.message.create({
                data: {
                    senderId: req.userId,
                    receiverId: user.id,
                    content: `🎁 You received ${points} bonus points!\n\nReason: ${reason}`,
                    pointsCost: 0
                }
            });
            await prisma.adminReward.update({
                where: { id: reward.id },
                data: { notificationSent: true }
            });
        }
        res.status(201).json({
            success: true,
            message: `${points} points awarded to ${user.name}`,
            reward,
            userPoints: updatedUser.points + points
        });
    }
    catch (err) {
        next(err);
    }
});
// Admin: Bulk distribute points to all users
router.post('/distribute-bulk', authenticate, async (req, res, next) => {
    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!admin.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { points, reason, sendNotification, excludeAdmins } = req.body;
        if (!points || !reason) {
            return res.status(400).json({ error: 'Missing required fields: points, reason' });
        }
        if (points <= 0) {
            return res.status(400).json({ error: 'Points must be greater than 0' });
        }
        if (reason.trim().length < 5) {
            return res.status(400).json({ error: 'Reason must be at least 5 characters' });
        }
        // Get all users (optionally exclude admins)
        const users = await prisma.user.findMany({
            where: excludeAdmins ? { isAdmin: false } : {}
        });
        if (users.length === 0) {
            return res.status(400).json({ error: 'No users found to distribute points to' });
        }
        // Update all users' points
        await prisma.user.updateMany({
            data: { points: { increment: points } }
        });
        // Record the bulk reward
        const reward = await prisma.adminReward.create({
            data: {
                adminId: req.userId,
                points,
                reason,
                bulkDistribution: true,
                recipientCount: users.length,
                notificationSent: false
            }
        });
        // Send notifications if requested
        if (sendNotification) {
            const notificationMessage = `🎁 You received ${points} bonus points!\n\nReason: ${reason}`;
            for (const user of users) {
                await prisma.message.create({
                    data: {
                        senderId: req.userId,
                        receiverId: user.id,
                        content: notificationMessage,
                        pointsCost: 0
                    }
                });
            }
            await prisma.adminReward.update({
                where: { id: reward.id },
                data: { notificationSent: true }
            });
        }
        res.status(201).json({
            success: true,
            message: `${points} points awarded to ${users.length} users`,
            reward,
            recipientCount: users.length
        });
    }
    catch (err) {
        next(err);
    }
});
// Admin: Get reward history
router.get('/history', authenticate, async (req, res, next) => {
    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!admin.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const rewards = await prisma.adminReward.findMany({
            where: { adminId: req.userId },
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(rewards);
    }
    catch (err) {
        next(err);
    }
});
// Admin: Get all reward history (all admins)
router.get('/admin/history', authenticate, async (req, res, next) => {
    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!admin.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const rewards = await prisma.adminReward.findMany({
            include: {
                admin: {
                    select: { id: true, name: true, email: true }
                },
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 200
        });
        res.json(rewards);
    }
    catch (err) {
        next(err);
    }
});
// Admin: Upgrade user tier (for testing)
router.post('/upgrade-tier', authenticate, async (req, res, next) => {
    try {
        const admin = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!admin.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { userEmail, newTier } = req.body;
        if (!userEmail || !newTier) {
            return res.status(400).json({ error: 'Missing required fields: userEmail, newTier' });
        }
        const validTiers = ['free', 'premium', 'vip'];
        if (!validTiers.includes(newTier)) {
            return res.status(400).json({ error: 'Invalid tier. Must be: free, premium, or vip' });
        }
        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: userEmail }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Update user tier
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: { tier: newTier }
        });
        console.log(`[ADMIN] Upgraded ${user.email} from ${user.tier} to ${newTier}`);
        res.json({
            success: true,
            message: `User ${user.name} upgraded to ${newTier}`,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                tier: updatedUser.tier
            }
        });
    }
    catch (err) {
        next(err);
    }
});
export default router;
