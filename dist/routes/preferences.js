import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Get user preferences
router.get('/', authenticate, async (req, res, next) => {
    try {
        let preferences = await prisma.userPreferences.findUnique({
            where: { userId: req.userId }
        });
        // Create default preferences if they don't exist
        if (!preferences) {
            preferences = await prisma.userPreferences.create({
                data: { userId: req.userId }
            });
        }
        res.json(preferences);
    }
    catch (err) {
        next(err);
    }
});
// Update user preferences
router.put('/', authenticate, async (req, res, next) => {
    try {
        const { emailNotifications, pushNotifications, messageNotifications, matchNotifications, likeNotifications, privateProfile, allowMessages } = req.body;
        let preferences = await prisma.userPreferences.findUnique({
            where: { userId: req.userId }
        });
        if (!preferences) {
            preferences = await prisma.userPreferences.create({
                data: { userId: req.userId }
            });
        }
        const updated = await prisma.userPreferences.update({
            where: { userId: req.userId },
            data: {
                ...(emailNotifications !== undefined && { emailNotifications }),
                ...(pushNotifications !== undefined && { pushNotifications }),
                ...(messageNotifications !== undefined && { messageNotifications }),
                ...(matchNotifications !== undefined && { matchNotifications }),
                ...(likeNotifications !== undefined && { likeNotifications }),
                ...(privateProfile !== undefined && { privateProfile }),
                ...(allowMessages !== undefined && { allowMessages })
            }
        });
        res.json(updated);
    }
    catch (err) {
        next(err);
    }
});
// Get notification settings
router.get('/notifications', authenticate, async (req, res, next) => {
    try {
        const preferences = await prisma.userPreferences.findUnique({
            where: { userId: req.userId }
        });
        if (!preferences) {
            return res.json({
                emailNotifications: true,
                pushNotifications: true,
                messageNotifications: true,
                matchNotifications: true,
                likeNotifications: true
            });
        }
        res.json({
            emailNotifications: preferences.emailNotifications,
            pushNotifications: preferences.pushNotifications,
            messageNotifications: preferences.messageNotifications,
            matchNotifications: preferences.matchNotifications,
            likeNotifications: preferences.likeNotifications
        });
    }
    catch (err) {
        next(err);
    }
});
// Get privacy settings
router.get('/privacy', authenticate, async (req, res, next) => {
    try {
        const preferences = await prisma.userPreferences.findUnique({
            where: { userId: req.userId }
        });
        if (!preferences) {
            return res.json({
                privateProfile: false,
                allowMessages: true
            });
        }
        res.json({
            privateProfile: preferences.privateProfile,
            allowMessages: preferences.allowMessages
        });
    }
    catch (err) {
        next(err);
    }
});
export default router;
