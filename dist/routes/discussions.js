import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Get all discussions with reply counts
router.get('/', async (req, res, next) => {
    try {
        const discussions = await prisma.discussion.findMany({
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                },
                _count: {
                    select: { replies: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        const formatted = discussions.map(d => ({
            id: d.id,
            title: d.title,
            category: d.category,
            author: d.author,
            content: d.content.substring(0, 150) + '...',
            replyCount: d._count.replies,
            createdAt: d.createdAt,
            timeAgo: getTimeAgo(d.createdAt)
        }));
        res.json(formatted);
    }
    catch (err) {
        console.error('Error fetching discussions:', err);
        next(err);
    }
});
// Get single discussion with replies
router.get('/:id', async (req, res, next) => {
    try {
        const discussion = await prisma.discussion.findUnique({
            where: { id: req.params.id },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                },
                replies: {
                    include: {
                        author: {
                            select: { id: true, name: true, avatar: true }
                        }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            }
        });
        if (!discussion) {
            return res.status(404).json({ error: 'Discussion not found' });
        }
        res.json({
            ...discussion,
            timeAgo: getTimeAgo(discussion.createdAt),
            replies: discussion.replies.map(r => ({
                ...r,
                timeAgo: getTimeAgo(r.createdAt)
            }))
        });
    }
    catch (err) {
        console.error('Error fetching discussion:', err);
        next(err);
    }
});
// Create new discussion
router.post('/', authenticate, async (req, res, next) => {
    try {
        const { title, content, category } = req.body;
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const discussion = await prisma.discussion.create({
            data: {
                title,
                content,
                category,
                authorId: req.userId
            },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });
        res.json(discussion);
    }
    catch (err) {
        console.error('Error creating discussion:', err);
        next(err);
    }
});
// Add reply to discussion
router.post('/:id/replies', authenticate, async (req, res, next) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ error: 'Reply content required' });
        }
        const reply = await prisma.discussionReply.create({
            data: {
                content,
                authorId: req.userId,
                discussionId: req.params.id
            },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                }
            }
        });
        res.json(reply);
    }
    catch (err) {
        console.error('Error creating reply:', err);
        next(err);
    }
});
// Get discussions by category
router.get('/category/:category', async (req, res, next) => {
    try {
        const discussions = await prisma.discussion.findMany({
            where: { category: req.params.category },
            include: {
                author: {
                    select: { id: true, name: true, avatar: true }
                },
                _count: {
                    select: { replies: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        const formatted = discussions.map(d => ({
            id: d.id,
            title: d.title,
            category: d.category,
            author: d.author,
            content: d.content.substring(0, 150) + '...',
            replyCount: d._count.replies,
            createdAt: d.createdAt,
            timeAgo: getTimeAgo(d.createdAt)
        }));
        res.json(formatted);
    }
    catch (err) {
        console.error('Error fetching discussions by category:', err);
        next(err);
    }
});
function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - new Date(date)) / 1000);
    if (seconds < 60)
        return 'just now';
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800)
        return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
}
export default router;
