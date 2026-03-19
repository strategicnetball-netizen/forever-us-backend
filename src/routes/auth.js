import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';
import { POINTS_CONFIG, getEffectiveTier } from '../utils/constants.js';

const router = express.Router();

// Get prisma from global scope (set by index.js)
const getPrisma = () => {
  if (!global.prisma) {
    throw new Error('Prisma client not initialized');
  }
  return global.prisma;
}

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name, age } = req.body;
    
    if (!email || !password || !name || !age) {
      return res.status(400).json({ error: 'Missing required fields: email, password, name, age' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = email === 'admin@foreverus-dating.com';
    const prisma = getPrisma();
    
    console.log('[AUTH] Attempting to create user:', email);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        age: parseInt(age),
        points: POINTS_CONFIG.STARTING_BONUS,
        tier: 'free',
        isAdmin
      }
    });
    
    console.log('[AUTH] User created successfully:', user.id);
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        profileCompleted: user.profileCompleted,
        points: user.points,
        tier: user.tier,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (err) {
    console.error('[AUTH] Register error:', err.message);
    console.error('[AUTH] Error type:', err.constructor.name);
    console.error('[AUTH] Error code:', err.code);
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      console.log(`[AUTH] Login failed: User not found with email: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`[AUTH] Login failed: Invalid password for user: ${email}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log(`[AUTH] Login successful for user: ${email} (${user.id})`);
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    const effectiveTier = getEffectiveTier(user);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        location: user.location,
        country: user.country,
        bio: user.bio,
        profileCompleted: user.profileCompleted,
        points: user.points,
        tier: user.tier,
        effectiveTier,
        trialTier: user.trialTier,
        trialExpiresAt: user.trialExpiresAt,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (err) {
    console.error(`[AUTH] Login error:`, err);
    next(err);
  }
});

router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const { age, gender, lookingFor, state, city, location, bio, country, profileCompleted } = req.body;
    
    console.log('[Auth] PUT /profile called with:', { age, gender, lookingFor, state, city, location, bio, country, profileCompleted, userId: req.userId })
    
    // Handle both location (combined) and state/city (separate) formats
    let finalCity = city;
    let finalState = state;
    
    if (location && !city) {
      // Parse location string into state and city
      const parts = location.split(',').map(p => p.trim());
      if (parts.length === 2) {
        finalState = parts[0];
        finalCity = parts[1];
      } else if (parts.length === 1) {
        finalCity = parts[0];
      }
    }
    
    // Validate required fields - city is required, state is optional
    if (!age || !gender || !finalCity || !bio || !country) {
      console.log('[Auth] Missing required fields:', { age, gender, finalCity, bio, country })
      return res.status(400).json({ error: 'Missing required fields: age, gender, city, bio, and country are required' });
    }

    const prisma = getPrisma();
    const updateData = {
      age: parseInt(age),
      gender,
      state: finalState || null,
      city: finalCity,
      bio,
      country,
      profileCompleted: profileCompleted === true
    };

    // Only update lookingFor if provided
    if (lookingFor) {
      updateData.lookingFor = typeof lookingFor === 'string' ? lookingFor : JSON.stringify(lookingFor);
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData
    });

    console.log('[Auth] Profile updated successfully for user:', user.id)

    const effectiveTier = getEffectiveTier(user);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        age: user.age,
        gender: user.gender,
        lookingFor: user.lookingFor,
        state: user.state,
        city: user.city,
        country: user.country,
        bio: user.bio,
        profileCompleted: user.profileCompleted,
        points: user.points,
        tier: user.tier,
        effectiveTier,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error('[Auth] Error updating profile:', err)
    next(err);
  }
});

export default router;
