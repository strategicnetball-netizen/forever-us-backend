import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
router.get('/', authenticate, async (req, res, next) => {
    try {
        const surveys = await prisma.survey.findMany({
            where: { isActive: true },
            select: {
                id: true,
                title: true,
                description: true,
                rewardPoints: true,
                questions: true
            }
        });
        res.json(surveys);
    }
    catch (err) {
        next(err);
    }
});
router.post('/:surveyId/submit', authenticate, async (req, res, next) => {
    try {
        const { surveyId } = req.params;
        const { answers } = req.body;
        if (!answers) {
            return res.status(400).json({ error: 'Missing answers' });
        }
        const survey = await prisma.survey.findUnique({
            where: { id: surveyId }
        });
        if (!survey) {
            return res.status(404).json({ error: 'Survey not found' });
        }
        // Check if already completed
        const existingResponse = await prisma.surveyResponse.findUnique({
            where: {
                userId_surveyId: {
                    userId: req.userId,
                    surveyId
                }
            }
        });
        if (existingResponse) {
            return res.status(400).json({ error: 'Already completed this survey' });
        }
        // Create response
        await prisma.surveyResponse.create({
            data: {
                userId: req.userId,
                surveyId,
                answers: JSON.stringify(answers)
            }
        });
        // Award points
        const user = await prisma.user.update({
            where: { id: req.userId },
            data: { points: { increment: survey.rewardPoints } }
        });
        // Record transaction
        await prisma.pointsTransaction.create({
            data: {
                userId: req.userId,
                amount: survey.rewardPoints,
                type: 'survey_complete',
                reason: `Completed survey: ${survey.title}`
            }
        });
        res.json({
            points: user.points,
            earned: survey.rewardPoints
        });
    }
    catch (err) {
        next(err);
    }
});
export default router;
