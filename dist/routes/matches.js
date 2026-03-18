import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Get all matches for current user
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        // Get matches where user is either side
        const matches = await prisma.match.findMany({
            where: {
                OR: [
                    { userId },
                    { matchedUserId: userId }
                ]
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        age: true,
                        location: true,
                        bio: true
                    }
                },
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
        // Transform to show the matched user info
        const transformedMatches = matches.map(match => ({
            id: match.id,
            matchedUser: match.userId === userId ? match.matchedUser : match.user,
            createdAt: match.createdAt
        }));
        // Return only the last 8 matches
        res.json(transformedMatches.slice(0, 8));
    }
    catch (err) {
        console.error('Error fetching matches:', err);
        res.status(500).json({ error: 'Failed to fetch matches' });
    }
});
// Check if two users have matched
router.get('/check/:userId', authenticate, async (req, res) => {
    try {
        const currentUserId = req.userId;
        const { userId } = req.params;
        const match = await prisma.match.findFirst({
            where: {
                OR: [
                    { userId: currentUserId, matchedUserId: userId },
                    { userId: userId, matchedUserId: currentUserId }
                ]
            }
        });
        res.json({ isMatched: !!match });
    }
    catch (err) {
        console.error('Error checking match:', err);
        res.status(500).json({ error: 'Failed to check match' });
    }
});
// Create a match when both users have liked each other
router.post('/create', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const { targetUserId } = req.body;
        if (!targetUserId) {
            return res.status(400).json({ error: 'targetUserId is required' });
        }
        // Check if both users have liked each other
        const userLikesTarget = await prisma.like.findUnique({
            where: {
                likerId_likedId: {
                    likerId: userId,
                    likedId: targetUserId
                }
            }
        });
        const targetLikesUser = await prisma.like.findUnique({
            where: {
                likerId_likedId: {
                    likerId: targetUserId,
                    likedId: userId
                }
            }
        });
        if (!userLikesTarget || !targetLikesUser) {
            return res.status(400).json({ error: 'Both users must like each other to create a match' });
        }
        // Check if match already exists
        const existingMatch = await prisma.match.findFirst({
            where: {
                OR: [
                    { userId, matchedUserId: targetUserId },
                    { userId: targetUserId, matchedUserId: userId }
                ]
            }
        });
        if (existingMatch) {
            return res.status(400).json({ error: 'Match already exists' });
        }
        // Create match (only from one side to avoid duplicates)
        const match = await prisma.match.create({
            data: {
                userId,
                matchedUserId: targetUserId
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
            }
        });
        res.json({ success: true, match });
    }
    catch (err) {
        console.error('Error creating match:', err);
        res.status(500).json({ error: 'Failed to create match' });
    }
});
// Unmatch
router.post('/unmatch/:matchedUserId', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const { matchedUserId } = req.params;
        await prisma.match.deleteMany({
            where: {
                OR: [
                    { userId, matchedUserId },
                    { userId: matchedUserId, matchedUserId: userId }
                ]
            }
        });
        res.json({ success: true });
    }
    catch (err) {
        console.error('Error unmatching:', err);
        res.status(500).json({ error: 'Failed to unmatch' });
    }
});
export default router;
