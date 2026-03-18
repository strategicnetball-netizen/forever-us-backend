import express from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
    const user = await prisma.user.findUnique({
        where: { id: req.userId }
    });
    if (!user || user.isAdmin !== true) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};
// Create new admin
router.post('/admins', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { name, email, phone, role, department, password } = req.body;
        // Validate email ends with @admin.com
        if (!email.endsWith('@admin.com')) {
            return res.status(400).json({ error: 'Admin email must end with @admin.com' });
        }
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create user with admin flag
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                isAdmin: true,
                adminProfile: {
                    create: {
                        phone,
                        role: role || 'moderator',
                        department
                    }
                }
            },
            include: {
                adminProfile: true
            }
        });
        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.adminProfile?.phone,
            role: user.adminProfile?.role,
            department: user.adminProfile?.department,
            createdAt: user.createdAt
        });
    }
    catch (err) {
        next(err);
    }
});
// Get all admins
router.get('/admins', authenticate, isAdmin, async (req, res, next) => {
    try {
        const admins = await prisma.user.findMany({
            where: { isAdmin: true },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                adminProfile: {
                    select: {
                        phone: true,
                        role: true,
                        department: true
                    }
                }
            }
        });
        res.json(admins);
    }
    catch (err) {
        next(err);
    }
});
// Update admin
router.put('/admins/:adminId', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { adminId } = req.params;
        const { name, phone, role, department } = req.body;
        const user = await prisma.user.update({
            where: { id: adminId },
            data: {
                name,
                adminProfile: {
                    update: {
                        phone,
                        role,
                        department
                    }
                }
            },
            include: { adminProfile: true }
        });
        res.json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.adminProfile?.phone,
            role: user.adminProfile?.role,
            department: user.adminProfile?.department
        });
    }
    catch (err) {
        next(err);
    }
});
// Delete admin
router.delete('/admins/:adminId', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { adminId } = req.params;
        // Prevent deleting yourself
        if (adminId === req.userId) {
            return res.status(400).json({ error: 'Cannot delete your own admin account' });
        }
        await prisma.user.delete({
            where: { id: adminId }
        });
        res.json({ message: 'Admin deleted successfully' });
    }
    catch (err) {
        next(err);
    }
});
// Create ad
router.post('/ads', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { title, description, duration, rewardPoints, videoUrl } = req.body;
        const ad = await prisma.ad.create({
            data: {
                title,
                description,
                duration,
                rewardPoints,
                videoUrl
            }
        });
        res.status(201).json(ad);
    }
    catch (err) {
        next(err);
    }
});
// Update ad
router.put('/ads/:adId', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { adId } = req.params;
        const { title, description, duration, rewardPoints, videoUrl, isActive } = req.body;
        const ad = await prisma.ad.update({
            where: { id: adId },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(duration && { duration }),
                ...(rewardPoints && { rewardPoints }),
                ...(videoUrl && { videoUrl }),
                ...(isActive !== undefined && { isActive })
            }
        });
        res.json(ad);
    }
    catch (err) {
        next(err);
    }
});
// Delete ad
router.delete('/ads/:adId', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { adId } = req.params;
        await prisma.ad.delete({
            where: { id: adId }
        });
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
// Create survey
router.post('/surveys', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { title, description, rewardPoints, questions } = req.body;
        const survey = await prisma.survey.create({
            data: {
                title,
                description,
                rewardPoints,
                questions: JSON.stringify(questions)
            }
        });
        res.status(201).json(survey);
    }
    catch (err) {
        next(err);
    }
});
// Get admin stats
router.get('/stats', authenticate, isAdmin, async (req, res, next) => {
    try {
        const totalUsers = await prisma.user.count();
        const totalPoints = await prisma.pointsTransaction.aggregate({
            _sum: { amount: true }
        });
        const totalAds = await prisma.ad.count();
        const totalSurveys = await prisma.survey.count();
        const completedAdViews = await prisma.adView.count({
            where: { completed: true }
        });
        const completedSurveys = await prisma.surveyResponse.count();
        const flaggedUsers = await prisma.user.count({
            where: { isFlagged: true }
        });
        // Calculate profile completion percentage
        const completeProfiles = await prisma.user.count({
            where: {
                AND: [
                    { bio: { not: null } },
                    { bio: { not: '' } },
                    { photos: { not: null } },
                    { photos: { not: '[]' } },
                    { age: { not: null } },
                    { gender: { not: null } },
                    { questionnaire: { isNot: null } }
                ]
            }
        });
        const profileCompletionPercentage = totalUsers > 0 ? Math.round((completeProfiles / totalUsers) * 100) : 0;
        // Count users with reports
        const reportedUsers = await prisma.user.count({
            where: {
                reportsReceived: {
                    some: {}
                }
            }
        });
        // Get admin-issued points stats
        const adminRewardStats = await prisma.adminReward.aggregate({
            _sum: { points: true },
            _count: true
        });
        const totalAdminPointsDistributed = adminRewardStats._sum.points || 0;
        const adminRewardCount = adminRewardStats._count || 0;
        const avgPointsPerReward = adminRewardCount > 0 ? Math.round(totalAdminPointsDistributed / adminRewardCount) : 0;
        // Count blocked users
        const blockedUsers = await prisma.blockedUser.count();
        res.json({
            totalUsers,
            totalPointsDistributed: totalPoints._sum.amount || 0,
            totalAds,
            totalSurveys,
            completedAdViews,
            completedSurveys,
            flaggedUsers,
            completeProfiles,
            profileCompletionPercentage,
            reportedUsers,
            adminPointsDistributed: totalAdminPointsDistributed,
            adminRewardCount,
            avgPointsPerReward,
            blockedUsers
        });
    }
    catch (err) {
        next(err);
    }
});
// Get fraud alerts
router.get('/fraud-alerts', authenticate, isAdmin, async (req, res, next) => {
    try {
        const alerts = await prisma.fraudAlert.findMany({
            where: { resolved: false },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        fraudScore: true,
                        isFlagged: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(alerts);
    }
    catch (err) {
        next(err);
    }
});
// Get user fraud details
router.get('/users/:userId/fraud', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                fraudScore: true,
                isFlagged: true,
                createdAt: true,
                adCompletionsToday: true,
                lastAdCompletedAt: true
            }
        });
        const alerts = await prisma.fraudAlert.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        const adCompletions = await prisma.adView.count({
            where: { userId, completed: true }
        });
        const pointsEarned = await prisma.pointsTransaction.aggregate({
            where: { userId },
            _sum: { amount: true }
        });
        res.json({
            user,
            alerts,
            adCompletions,
            pointsEarned: pointsEarned._sum.amount || 0
        });
    }
    catch (err) {
        next(err);
    }
});
// Resolve fraud alert
router.put('/fraud-alerts/:alertId/resolve', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { alertId } = req.params;
        const alert = await prisma.fraudAlert.update({
            where: { id: alertId },
            data: { resolved: true }
        });
        res.json(alert);
    }
    catch (err) {
        next(err);
    }
});
// Manually flag/unflag user
router.put('/users/:userId/flag', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { isFlagged } = req.body;
        const user = await prisma.user.update({
            where: { id: userId },
            data: { isFlagged }
        });
        res.json(user);
    }
    catch (err) {
        next(err);
    }
});
// Get revenue analytics
router.get('/analytics/revenue', authenticate, isAdmin, async (req, res, next) => {
    try {
        const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const adRevenue = await prisma.adView.count({
            where: {
                completed: true,
                createdAt: { gte: last7Days }
            }
        });
        const surveyRevenue = await prisma.surveyResponse.count({
            where: {
                createdAt: { gte: last7Days }
            }
        });
        const pointsDistributed = await prisma.pointsTransaction.aggregate({
            where: {
                createdAt: { gte: last7Days }
            },
            _sum: { amount: true }
        });
        res.json({
            period: 'last_7_days',
            adCompletions: adRevenue,
            surveyCompletions: surveyRevenue,
            pointsDistributed: pointsDistributed._sum.amount || 0
        });
    }
    catch (err) {
        next(err);
    }
});
// Get user list
router.get('/users', authenticate, isAdmin, async (req, res, next) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                points: true,
                fraudScore: true,
                isFlagged: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(users);
    }
    catch (err) {
        next(err);
    }
});
// Detect bot behavior for a user
router.get('/users/:userId/bot-check', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { detectBotBehavior } = await import('../utils/fraudDetection.js');
        const botAnalysis = await detectBotBehavior(userId);
        res.json(botAnalysis);
    }
    catch (err) {
        next(err);
    }
});
// Get bot detection report (all suspicious users)
router.get('/bot-detection-report', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { detectBotBehavior } = await import('../utils/fraudDetection.js');
        // Get users with incomplete profiles or high ad activity, excluding ignored ones
        const suspiciousUsers = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { bio: null },
                            { bio: '' },
                            { photos: null },
                            { photos: '[]' },
                            { age: null },
                            { gender: null }
                        ]
                    },
                    { botIgnoredByAdmin: false }
                ]
            },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
                bio: true,
                photos: true,
                age: true,
                gender: true
            },
            take: 50
        });
        const report = [];
        for (const user of suspiciousUsers) {
            const botAnalysis = await detectBotBehavior(user.id);
            if (botAnalysis.isBot) {
                report.push({
                    user,
                    botAnalysis
                });
            }
        }
        res.json({
            totalSuspicious: suspiciousUsers.length,
            confirmedBots: report.length,
            bots: report
        });
    }
    catch (err) {
        next(err);
    }
});
// View suspicious user profile details
router.get('/bot-detection/:userId/view', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { detectBotBehavior } = await import('../utils/fraudDetection.js');
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                age: true,
                gender: true,
                location: true,
                bio: true,
                photos: true,
                avatar: true,
                createdAt: true,
                questionnaire: true,
                botIgnoredByAdmin: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const botAnalysis = await detectBotBehavior(userId);
        // Get engagement stats
        const likes = await prisma.like.count({
            where: { likerId: userId }
        });
        const messages = await prisma.message.count({
            where: { senderId: userId }
        });
        const adViews = await prisma.adView.count({
            where: { userId }
        });
        res.json({
            user: {
                ...user,
                photos: user.photos ? JSON.parse(user.photos) : []
            },
            botAnalysis,
            engagement: {
                likes,
                messages,
                adViews
            }
        });
    }
    catch (err) {
        next(err);
    }
});
// Ignore bot detection alert for a user
router.put('/bot-detection/:userId/ignore', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.update({
            where: { id: userId },
            data: { botIgnoredByAdmin: true }
        });
        res.json({
            message: 'User ignored from bot detection report',
            userId: user.id,
            ignored: user.botIgnoredByAdmin
        });
    }
    catch (err) {
        next(err);
    }
});
// Un-ignore bot detection alert for a user
router.put('/bot-detection/:userId/unignore', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.update({
            where: { id: userId },
            data: { botIgnoredByAdmin: false }
        });
        res.json({
            message: 'User un-ignored from bot detection report',
            userId: user.id,
            ignored: user.botIgnoredByAdmin
        });
    }
    catch (err) {
        next(err);
    }
});
// Get blocked users list
router.get('/blocked-users', authenticate, isAdmin, async (req, res, next) => {
    try {
        const blockedUsers = await prisma.blockedUser.findMany({
            include: {
                blocker: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                blockedUser: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        age: true,
                        gender: true,
                        location: true,
                        avatar: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(blockedUsers);
    }
    catch (err) {
        next(err);
    }
});
export default router;
