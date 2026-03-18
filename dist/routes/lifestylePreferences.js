import express from 'express';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Get prisma from global scope (set by index.js)
const getPrisma = () => {
    if (!global.prisma) {
        throw new Error('Prisma client not initialized');
    }
    return global.prisma;
};
router.post('/save', authenticate, async (req, res, next) => {
    try {
        const { answers } = req.body;
        console.log('[LifestylePreferences] POST /save called with:', { answers, userId: req.userId });
        if (!answers || !answers.smoking || !answers.alcohol || !answers.drugs || !answers.tattoos || !answers.pets) {
            console.log('[LifestylePreferences] Missing required fields');
            return res.status(400).json({ error: 'Missing required lifestyle preference fields' });
        }
        const prisma = getPrisma();
        // Create or update lifestyle preferences questionnaire
        const questionnaire = await prisma.lifestylePreferencesQuestionnaire.upsert({
            where: { userId: req.userId },
            update: {
                answers: JSON.stringify(answers),
                updatedAt: new Date()
            },
            create: {
                userId: req.userId,
                answers: JSON.stringify(answers)
            }
        });
        console.log('[LifestylePreferences] Saved successfully for user:', req.userId);
        res.json({
            success: true,
            message: 'Lifestyle preferences saved successfully',
            questionnaire
        });
    }
    catch (err) {
        console.error('[LifestylePreferences] Error saving:', err);
        next(err);
    }
});
router.get('/', authenticate, async (req, res, next) => {
    try {
        const prisma = getPrisma();
        const questionnaire = await prisma.lifestylePreferencesQuestionnaire.findUnique({
            where: { userId: req.userId }
        });
        if (!questionnaire) {
            return res.status(404).json({ error: 'Lifestyle preferences not found' });
        }
        res.json({
            questionnaire: {
                ...questionnaire,
                answers: JSON.parse(questionnaire.answers)
            }
        });
    }
    catch (err) {
        console.error('[LifestylePreferences] Error fetching:', err);
        next(err);
    }
});
export default router;
