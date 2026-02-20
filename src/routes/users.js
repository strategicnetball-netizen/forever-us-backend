import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { getEffectiveTier } from '../utils/constants.js';

const router = express.Router();

router.post('/browse', authenticate, async (req, res, next) => {
  try {
    const { minAge, maxAge, gender, location, distance, name } = req.body

    console.log('Browse filters received:', { minAge, maxAge, gender, location, distance, name })

    // Get list of users already liked by current user
    const likedUsers = await prisma.like.findMany({
      where: { likerId: req.userId },
      select: { likedId: true }
    })
    const likedIds = likedUsers.map(like => like.likedId)

    const where = {
      id: { notIn: [req.userId, ...likedIds] }
    }

    // Age filter - ensure we have valid numbers
    if (minAge !== undefined && minAge !== null && minAge !== '') {
      if (!where.age) where.age = {}
      where.age.gte = parseInt(minAge)
    }
    if (maxAge !== undefined && maxAge !== null && maxAge !== '') {
      if (!where.age) where.age = {}
      where.age.lte = parseInt(maxAge)
    }

    // Gender filter
    if (gender && gender !== '') {
      where.gender = gender
    }

    // Location filter
    if (location && location !== '') {
      where.location = {
        contains: location
      }
    }

    // Name filter
    if (name && name !== '') {
      where.name = {
        contains: name
      }
    }

    console.log('Browse where clause:', JSON.stringify(where, null, 2))

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
        age: true,
        gender: true,
        location: true,
        tier: true
      },
      take: 20
    })
    
    console.log('Browse results count:', users.length)
    res.json(users)
  } catch (err) {
    console.error('Browse error:', err)
    next(err)
  }
})

router.get('/browse', authenticate, async (req, res, next) => {
  try {
    // Get list of users already liked by current user
    const likedUsers = await prisma.like.findMany({
      where: { likerId: req.userId },
      select: { likedId: true }
    });
    const likedIds = likedUsers.map(like => like.likedId);

    const users = await prisma.user.findMany({
      where: {
        id: { 
          not: req.userId,
          notIn: likedIds
        }
      },
      select: {
        id: true,
        name: true,
        bio: true,
        avatar: true,
        age: true,
        gender: true,
        location: true,
        tier: true
      },
      take: 20 // Limit to 20 profiles
    });
    
    res.json(users);
  } catch (err) {
    next(err);
  }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        photos: true,
        age: true,
        gender: true,
        location: true,
        country: true,
        state: true,
        city: true,
        points: true,
        tier: true,
        trialTier: true,
        trialExpiresAt: true,
        isVerified: true,
        verificationPhotoUrl: true,
        introVideoUrl: true,
        hasClaimedProfileBonus: true,
        createdAt: true
      }
    });
    
    // Parse photos back to array
    const effectiveTier = getEffectiveTier(user);
    const userData = {
      ...user,
      effectiveTier,
      photos: user.photos ? JSON.parse(user.photos) : []
    };
    
    res.json(userData);
  } catch (err) {
    next(err);
  }
});

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { name, bio, avatar, age, gender, location, country, state, city, photos } = req.body;
    
    // Verify user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Validate photos array if provided
    let photosToStore = undefined;
    if (photos !== undefined) {
      if (!Array.isArray(photos)) {
        return res.status(400).json({ error: 'Photos must be an array' });
      }
      if (photos.length > 5) {
        return res.status(400).json({ error: 'Maximum 5 photos allowed' });
      }
      photosToStore = JSON.stringify(photos);
    }
    
    const updateData = {};
    if (name !== undefined && name !== null) updateData.name = name;
    if (bio !== undefined && bio !== null) updateData.bio = bio;
    if (avatar !== undefined && avatar !== null) updateData.avatar = avatar;
    if (age !== undefined && age !== null) updateData.age = parseInt(age);
    if (gender !== undefined && gender !== null) updateData.gender = gender;
    if (location !== undefined && location !== null) updateData.location = location;
    if (country !== undefined && country !== null) updateData.country = country;
    if (state !== undefined && state !== null) updateData.state = state;
    if (city !== undefined && city !== null) updateData.city = city;
    if (photosToStore !== undefined) updateData.photos = photosToStore;
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        photos: true,
        age: true,
        gender: true,
        location: true,
        country: true,
        state: true,
        city: true,
        points: true
      }
    });
    
    // Parse photos back to array for response
    const userData = {
      ...user,
      photos: user.photos ? JSON.parse(user.photos) : []
    };
    
    res.json(userData);
  } catch (err) {
    console.error('PUT /me error:', err);
    next(err);
  }
});

router.get('/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        avatar: true,
        photos: true,
        age: true,
        gender: true,
        location: true,
        country: true,
        state: true,
        city: true,
        points: true,
        tier: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Parse photos back to array
    const userData = {
      ...user,
      photos: user.photos ? JSON.parse(user.photos) : []
    };
    
    res.json(userData);
  } catch (err) {
    next(err);
  }
});

router.post('/upload-photos', authenticate, async (req, res, next) => {
  try {
    const { photos } = req.body;
    
    if (!Array.isArray(photos)) {
      return res.status(400).json({ error: 'Photos must be an array' });
    }
    
    if (photos.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 photos allowed' });
    }

    // Filter out base64 strings that are too large (keep only valid ones)
    // Each photo should be < 2MB (2097152 bytes)
    const validPhotos = photos.filter(photo => {
      return photo && photo.length < 2097152;
    });

    if (validPhotos.length === 0) {
      return res.status(400).json({ error: 'Photos are too large. Please use smaller images.' });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: {
        photos: JSON.stringify(validPhotos)
      },
      select: {
        id: true,
        photos: true
      }
    });

    const userData = {
      ...user,
      photos: user.photos ? JSON.parse(user.photos) : []
    };

    res.json(userData);
  } catch (err) {
    next(err);
  }
});

export default router;
