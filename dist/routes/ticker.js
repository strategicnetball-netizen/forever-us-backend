import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Get all active ticker messages
router.get('/messages', async (req, res, next) => {
    try {
        const messages = await prisma.tickerMessage.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });
        res.json(messages);
    }
    catch (err) {
        next(err);
    }
});
// Admin: Get all ticker messages (including inactive)
router.get('/admin/messages', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const messages = await prisma.tickerMessage.findMany({
            orderBy: { order: 'asc' }
        });
        res.json(messages);
    }
    catch (err) {
        next(err);
    }
});
// Admin: Create new ticker message
router.post('/admin/messages', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { text, action } = req.body;
        if (!text || text.trim().length === 0) {
            return res.status(400).json({ error: 'Message text is required' });
        }
        // Get the highest order number
        const lastMessage = await prisma.tickerMessage.findFirst({
            orderBy: { order: 'desc' }
        });
        const nextOrder = (lastMessage?.order || 0) + 1;
        const message = await prisma.tickerMessage.create({
            data: {
                text,
                action: action || null,
                order: nextOrder
            }
        });
        res.status(201).json(message);
    }
    catch (err) {
        next(err);
    }
});
// Admin: Update ticker message
router.put('/admin/messages/:id', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const { text, action, isActive, order } = req.body;
        const updateData = {};
        if (text !== undefined)
            updateData.text = text;
        if (action !== undefined)
            updateData.action = action;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        if (order !== undefined)
            updateData.order = order;
        const message = await prisma.tickerMessage.update({
            where: { id: req.params.id },
            data: updateData
        });
        res.json(message);
    }
    catch (err) {
        next(err);
    }
});
// Admin: Delete ticker message
router.delete('/admin/messages/:id', authenticate, async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });
        if (!user.email.endsWith('@admin.com')) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        await prisma.tickerMessage.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
export default router;
