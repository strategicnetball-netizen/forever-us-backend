import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Search with filters
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { minAge, maxAge, gender, location, distance } = req.body;

    // Get list of users already liked by current user
    const likedUsers = await prisma.like.findMany({
      where: { likerId: req.userId },
      select: { likedId: true }
    });
    const likedIds = likedUsers.map(like => like.likedId);

    const where = {
      id: { 
        not: req.userId,
        notIn: likedIds
      }
    };

    if (minAge || maxAge) {
      where.age = {};
      if (minAge) where.age.gte = minAge;
      if (maxAge) where.age.lte = maxAge;
    }

    if (gender) {
      where.gender = gender;
    }

    if (location) {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
        age: true,
        gender: true,
        location: true
      },
      take: 50
    });

    res.json(users);
  } catch (err) {
    next(err);
  }
});

export default router;
