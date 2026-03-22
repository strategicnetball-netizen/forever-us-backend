import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { getEffectiveTier } from '../utils/constants.js';

const router = express.Router();

// Get prisma from global scope (set by index.js)
const getPrisma = () => {
  if (!global.prisma) {
    throw new Error('Prisma client not initialized');
  }
  return global.prisma;
}



router.post('/browse', authenticate, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { minAge, maxAge, gender, location, distance, name, showAllCountries, verificationStatus, profileCompletion, lastActive } = req.body

    console.log('Browse filters received:', { minAge, maxAge, gender, location, distance, name, showAllCountries, verificationStatus, profileCompletion, lastActive })

    // Get current user's tier
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { tier: true }
    })

    // Get list of users already liked by current user
    const likedUsers = await prisma.like.findMany({
      where: { likerId: req.userId },
      select: { likedId: true }
    })
    const likedIds = likedUsers.map(like => like.likedId)

    // Get list of users already passed on by current user
    const passedUsers = await prisma.userBehavior.findMany({
      where: { 
        userId: req.userId,
        actionType: 'pass'
      },
      select: { targetUserId: true }
    })
    const passedIds = passedUsers.map(pass => pass.targetUserId)

    // Get list of users blocked by current user
    const blockedUsers = await prisma.blockedUser.findMany({
      where: { blockerId: req.userId },
      select: { blockedId: true }
    })
    const blockedIds = blockedUsers.map(block => block.blockedId)

    const where = {
      id: { notIn: [req.userId, ...likedIds, ...passedIds, ...blockedIds] }
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

    // VIP-ONLY FILTERS
    if (currentUser?.tier === 'vip') {
      // Verification status filter (VIP only)
      if (verificationStatus && verificationStatus !== '') {
        if (verificationStatus === 'verified') {
          where.isVerified = true
        } else if (verificationStatus === 'unverified') {
          where.isVerified = false
        }
      }

      // Profile completion filter (VIP only)
      if (profileCompletion && profileCompletion !== '') {
        if (profileCompletion === 'complete') {
          where.profileCompleted = true
        } else if (profileCompletion === 'incomplete') {
          where.profileCompleted = false
        }
      }

      // Last active filter (VIP only) - show users active in last X days
      if (lastActive && lastActive !== '') {
        const daysAgo = parseInt(lastActive)
        const dateThreshold = new Date()
        dateThreshold.setDate(dateThreshold.getDate() - daysAgo)
        where.updatedAt = { gte: dateThreshold }
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
        tier: true,
        isVerified: true,
        profileCompleted: true,
        updatedAt: true
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
    const prisma = getPrisma();
    // Get current user's country and preference
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { country: true, showAllCountries: true }
    });

    // Get list of users already liked by current user
    const likedUsers = await prisma.like.findMany({
      where: { likerId: req.userId },
      select: { likedId: true }
    });
    const likedIds = likedUsers.map(like => like.likedId);

    // Get list of users already passed on by current user
    const passedUsers = await prisma.userBehavior.findMany({
      where: { 
        userId: req.userId,
        actionType: 'pass'
      },
      select: { targetUserId: true }
    });
    const passedIds = passedUsers.map(pass => pass.targetUserId);

    const where = {
      id: { 
        notIn: [req.userId, ...likedIds, ...passedIds]
      }
    };

    // Apply country filter unless user chose to see all countries
    if (currentUser?.country && !currentUser?.showAllCountries) {
      where.country = currentUser.country;
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
        location: true,
        country: true,
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
    const prisma = getPrisma();
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
        lookingFor: true,
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
        profileCompleted: true,
        showAllCountries: true,
        isAdmin: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Parse photos back to array
    const effectiveTier = getEffectiveTier(user);
    const userData = {
      ...user,
      effectiveTier,
      photos: user.photos ? JSON.parse(user.photos) : [],
      lookingFor: user.lookingFor ? (typeof user.lookingFor === 'string' ? JSON.parse(user.lookingFor) : user.lookingFor) : []
    };
    
    res.json(userData);
  } catch (err) {
    console.error('GET /me error:', err);
    next(err);
  }
});

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { name, bio, avatar, age, gender, lookingFor, location, country, state, city, photos } = req.body;
    
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
    if (lookingFor !== undefined && lookingFor !== null) updateData.lookingFor = typeof lookingFor === 'string' ? lookingFor : JSON.stringify(lookingFor);
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
        lookingFor: true,
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
    const prisma = getPrisma();
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
        isVerified: true,
        introVideoUrl: true,
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
    const prisma = getPrisma();
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
    console.error('POST /upload-photos error:', err);
    next(err);
  }
});

// Toggle country preference
router.put('/preferences/country', authenticate, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { showAllCountries } = req.body;

    if (typeof showAllCountries !== 'boolean') {
      return res.status(400).json({ error: 'showAllCountries must be a boolean' });
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { showAllCountries },
      select: {
        id: true,
        country: true,
        showAllCountries: true
      }
    });

    res.json({
      message: showAllCountries ? 'Now viewing profiles from all countries' : `Now viewing profiles from ${user.country} only`,
      user
    });
  } catch (err) {
    next(err);
  }
});

// Block a user
router.post('/:userId/block', authenticate, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const { userId } = req.params;

    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already blocked
    const existingBlock = await prisma.blockedUser.findFirst({
      where: {
        blockerId: req.userId,
        blockedId: userId
      }
    });

    if (existingBlock) {
      return res.status(400).json({ error: 'User is already blocked' });
    }

    // Create block
    await prisma.blockedUser.create({
      data: {
        blockerId: req.userId,
        blockedId: userId
      }
    });

    res.json({ message: 'User blocked successfully' });
  } catch (err) {
    next(err);
  }
});

export default router;
