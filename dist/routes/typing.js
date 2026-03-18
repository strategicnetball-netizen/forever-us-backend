import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Set typing status
router.post('/set-typing', authenticate, async (req, res) => {
    try {
        const { conversationWith, isTyping } = req.body;
        if (!conversationWith) {
            return res.status(400).json({ error: 'conversationWith is required' });
        }
        // Upsert typing indicator
        const indicator = await prisma.typingIndicator.upsert({
            where: {
                userId_conversationWith: {
                    userId: req.userId,
                    conversationWith
                }
            },
            update: {
                isTyping,
                updatedAt: new Date()
            },
            create: {
                userId: req.userId,
                conversationWith,
                isTyping
            }
        });
        res.json(indicator);
    }
    catch (err) {
        console.error('Error setting typing status:', err);
        res.status(500).json({ error: 'Failed to set typing status' });
    }
});
// Get typing status for a conversation
router.get('/status/:conversationWith', authenticate, async (req, res) => {
    try {
        const { conversationWith } = req.params;
        const indicator = await prisma.typingIndicator.findUnique({
            where: {
                userId_conversationWith: {
                    userId: conversationWith,
                    conversationWith: req.userId
                }
            }
        });
        res.json({
            isTyping: indicator?.isTyping || false,
            lastUpdated: indicator?.updatedAt
        });
    }
    catch (err) {
        console.error('Error getting typing status:', err);
        res.status(500).json({ error: 'Failed to get typing status' });
    }
});
export default router;
