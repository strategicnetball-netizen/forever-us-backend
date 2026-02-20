import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get users who liked me
router.get('/', authenticate, async (req, res, next) => {
  try {
    // Get all users who liked me
    const admirers = await prisma.like.findMany({
      where: { likedId: req.userId },
      include: {
        liker: {
          select: {
            id: true,
            name: true,
            avatar: true,
            age: true,
            gender: true,
            location: true,
            bio: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out admirers I've already liked back (mutual likes)
    const filteredAdmirers = [];
    for (const admirer of admirers) {
      const mutualLike = await prisma.like.findUnique({
        where: {
          likerId_likedId: {
            likerId: req.userId,
            likedId: admirer.liker.id
          }
        }
      });
      
      if (!mutualLike) {
        filteredAdmirers.push(admirer);
      }
    }

    res.json(filteredAdmirers);
  } catch (err) {
    next(err);
  }
});

export default router;
