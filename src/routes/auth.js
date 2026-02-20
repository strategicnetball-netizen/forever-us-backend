import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { POINTS_CONFIG, getEffectiveTier } from '../utils/constants.js';

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const isAdmin = email.endsWith('@admin.com');
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        points: POINTS_CONFIG.STARTING_BONUS,
        tier: 'free',
        isAdmin
      }
    });
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });
    
    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        points: user.points,
        tier: user.tier,
        isAdmin: user.isAdmin
      },
      token
    });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }
    
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    const effectiveTier = getEffectiveTier(user);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
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
    next(err);
  }
});

export default router;
