import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Get blocked users
router.get('/', authenticate, async (req, res, next) => {
    try {
        const blocked = await prisma.blockedUser.findMany({
            where: { blockerId: req.userId },
            include: {
                blocked: {
                    select: {
                        id: true,
                        name: true,
                        avatar: true,
                        age: true
                    }
                }
            }
        });
        res.json(blocked);
    }
    catch (err) {
        next(err);
    }
});
// Block a user
router.post('/:blockedId', authenticate, async (req, res, next) => {
    try {
        const { blockedId } = req.params;
        if (req.userId === blockedId) {
            return res.status(400).json({ error: 'Cannot block yourself' });
        }
        const blocked = await prisma.blockedUser.create({
            data: {
                blockerId: req.userId,
                blockedId
            }
        });
        res.status(201).json(blocked);
    }
    catch (err) {
        next(err);
    }
});
// Unblock a user
router.delete('/:blockedId', authenticate, async (req, res, next) => {
    try {
        const { blockedId } = req.params;
        await prisma.blockedUser.delete({
            where: {
                blockerId_blockedId: {
                    blockerId: req.userId,
                    blockedId
                }
            }
        });
        res.json({ success: true });
    }
    catch (err) {
        next(err);
    }
});
export default router;
