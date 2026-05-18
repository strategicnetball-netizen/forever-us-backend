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
};
router.post('/register', async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const isAdmin = email.endsWith('@admin.com');
        const prisma = getPrisma();
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
                profileCompleted: user.profileCompleted,
                points: user.points,
                tier: user.tier,
                isAdmin: user.isAdmin
            },
            token
        });
    }
    catch (err) {
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
                age: user.age,
                gender: user.gender,
                location: user.location,
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
    }
    catch (err) {
        next(err);
    }
});
router.put('/profile', authenticate, async (req, res, next) => {
    try {
        const { age, gender, location, bio, profileCompleted } = req.body;
        console.log('[Auth] PUT /profile called with:', { age, gender, location, bio, profileCompleted, userId: req.userId });
        if (!age || !gender || !location || !bio) {
            console.log('[Auth] Missing required fields');
            return res.status(400).json({ error: 'Missing required fields' });
        }
        const prisma = getPrisma();
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: {
                age: parseInt(age),
                gender,
                location,
                bio,
                profileCompleted: profileCompleted === true
            }
        });
        console.log('[Auth] Profile updated successfully for user:', user.id);
        const effectiveTier = getEffectiveTier(user);
        res.json({
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                age: user.age,
                gender: user.gender,
                location: user.location,
                bio: user.bio,
                profileCompleted: user.profileCompleted,
                points: user.points,
                tier: user.tier,
                effectiveTier,
                isAdmin: user.isAdmin
            }
        });
    }
    catch (err) {
        console.error('[Auth] Error updating profile:', err);
        next(err);
    }
});
export default router;
