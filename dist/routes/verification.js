import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Upload selfie for verification
router.post('/upload-selfie', authenticate, async (req, res, next) => {
    try {
        const { photoUrl } = req.body;
        const userId = req.userId;
        if (!photoUrl) {
            return res.status(400).json({ error: 'Photo URL is required' });
        }
        // Check if photoUrl is a valid base64 string
        if (!photoUrl.startsWith('data:image')) {
            return res.status(400).json({ error: 'Invalid photo format. Must be a base64 image.' });
        }
        // Check size (base64 is ~33% larger than binary, so limit to ~5MB base64)
        if (photoUrl.length > 5242880) {
            return res.status(400).json({ error: 'Photo is too large. Please use a smaller image.' });
        }
        console.log('Uploading verification photo for user:', userId, 'Size:', photoUrl.length);
        // Update user with verification photo
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                verificationPhotoUrl: photoUrl,
                isVerified: true // In production, this would be verified by admin or AI
            }
        });
        console.log('User verified:', user.id, 'isVerified:', user.isVerified);
        // Award verification badge
        const badge = await prisma.userBadge.upsert({
            where: {
                userId_badgeType: {
                    userId: userId,
                    badgeType: 'photo_verified'
                }
            },
            update: {},
            create: {
                userId: userId,
                badgeType: 'photo_verified',
                name: 'Photo Verified',
                icon: '✓',
                description: 'This user has verified their identity with a selfie'
            }
        });
        console.log('Badge awarded:', badge.id);
        res.json({
            success: true,
            isVerified: user.isVerified,
            message: 'Selfie uploaded successfully. Your profile is now verified!'
        });
    }
    catch (err) {
        console.error('Verification upload error:', err);
        next(err);
    }
});
// Get verification status
router.get('/status', authenticate, async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                isVerified: true,
                verificationPhotoUrl: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({
            isVerified: user.isVerified,
            hasVerificationPhoto: !!user.verificationPhotoUrl
        });
    }
    catch (err) {
        next(err);
    }
});
// Get user verification badge
router.get('/badge/:userId', async (req, res, next) => {
    try {
        const { userId } = req.params;
        const badge = await prisma.userBadge.findUnique({
            where: {
                userId_badgeType: {
                    userId: userId,
                    badgeType: 'photo_verified'
                }
            }
        });
        res.json({
            isVerified: !!badge,
            badge: badge || null
        });
    }
    catch (err) {
        next(err);
    }
});
export default router;
