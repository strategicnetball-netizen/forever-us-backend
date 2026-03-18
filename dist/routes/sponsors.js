import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Get all active sponsors
router.get('/', async (req, res, next) => {
    try {
        const sponsors = await prisma.sponsor.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            select: {
                id: true,
                name: true,
                logo: true,
                website: true
            }
        });
        res.json(sponsors);
    }
    catch (err) {
        next(err);
    }
});
// Log sponsor click and redirect
router.post('/:sponsorId/click', authenticate, async (req, res, next) => {
    try {
        const { sponsorId } = req.params;
        // Get sponsor
        const sponsor = await prisma.sponsor.findUnique({
            where: { id: sponsorId }
        });
        if (!sponsor) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }
        if (!sponsor.isActive) {
            return res.status(400).json({ error: 'Sponsor is not active' });
        }
        // Log the click
        await prisma.sponsorClick.create({
            data: {
                userId: req.userId,
                sponsorId
            }
        });
        // Return the sponsor website URL
        res.json({ website: sponsor.website });
    }
    catch (err) {
        next(err);
    }
});
// Admin: Get all sponsors
router.get('/admin/all', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user?.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const sponsors = await prisma.sponsor.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(sponsors);
    }
    catch (err) {
        next(err);
    }
});
// Admin: Create sponsor
router.post('/admin/create', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user?.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { name, logo, website, isActive, order } = req.body;
        if (!name || !website) {
            return res.status(400).json({ error: 'Name and website are required' });
        }
        const sponsor = await prisma.sponsor.create({
            data: {
                name,
                logo,
                website,
                isActive: isActive !== undefined ? isActive : true,
                order: order || 0
            }
        });
        res.status(201).json(sponsor);
    }
    catch (err) {
        next(err);
    }
});
// Admin: Update sponsor
router.put('/admin/:sponsorId', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user?.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { sponsorId } = req.params;
        const { name, logo, website, isActive, order } = req.body;
        const sponsor = await prisma.sponsor.update({
            where: { id: sponsorId },
            data: {
                ...(name && { name }),
                ...(logo && { logo }),
                ...(website && { website }),
                ...(isActive !== undefined && { isActive }),
                ...(order !== undefined && { order })
            }
        });
        res.json(sponsor);
    }
    catch (err) {
        next(err);
    }
});
// Admin: Delete sponsor
router.delete('/admin/:sponsorId', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user?.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { sponsorId } = req.params;
        await prisma.sponsor.delete({
            where: { id: sponsorId }
        });
        res.json({ message: 'Sponsor deleted' });
    }
    catch (err) {
        next(err);
    }
});
// Admin: Get sponsor click analytics
router.get('/admin/:sponsorId/analytics', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user?.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { sponsorId } = req.params;
        const sponsor = await prisma.sponsor.findUnique({
            where: { id: sponsorId }
        });
        if (!sponsor) {
            return res.status(404).json({ error: 'Sponsor not found' });
        }
        const totalClicks = await prisma.sponsorClick.count({
            where: { sponsorId }
        });
        const clicksLast7Days = await prisma.sponsorClick.count({
            where: {
                sponsorId,
                createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
        });
        const uniqueUsers = await prisma.sponsorClick.findMany({
            where: { sponsorId },
            distinct: ['userId'],
            select: { userId: true }
        });
        res.json({
            sponsor,
            totalClicks,
            clicksLast7Days,
            uniqueUsers: uniqueUsers.length
        });
    }
    catch (err) {
        next(err);
    }
});
export default router;
