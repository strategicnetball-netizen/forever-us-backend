import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Calculate compatibility score between two users with more nuanced algorithm
const calculateCompatibility = (user1Answers, user2Answers) => {
    if (!user1Answers || !user2Answers) {
        return { overallScore: 0, breakdown: {}, summary: 'Unable to calculate compatibility' };
    }
    let scores = {
        values: 0,
        lifestyle: 0,
        goals: 0,
        dealbreakers: 100
    };
    // Values Alignment (q9=kids, q10=religion, q11=politics, q14=spirituality)
    const valuesQuestions = ['q9', 'q10', 'q11', 'q14'];
    let valuesMatches = 0;
    valuesQuestions.forEach(q => {
        const a1 = Array.isArray(user1Answers[q]) ? user1Answers[q].join('').toLowerCase() : String(user1Answers[q]).toLowerCase();
        const a2 = Array.isArray(user2Answers[q]) ? user2Answers[q].join('').toLowerCase() : String(user2Answers[q]).toLowerCase();
        if (a1 === a2) {
            valuesMatches++;
        }
    });
    scores.values = Math.round((valuesMatches / valuesQuestions.length) * 100);
    // Lifestyle Compatibility (q4=spontaneity, q5=personality, q6=career, q8=cuisine, q11=conflict)
    const lifestyleQuestions = ['q4', 'q5', 'q6', 'q8', 'q11'];
    let lifestyleMatches = 0;
    lifestyleQuestions.forEach(q => {
        const a1 = Array.isArray(user1Answers[q]) ? user1Answers[q].join('').toLowerCase() : String(user1Answers[q]).toLowerCase();
        const a2 = Array.isArray(user2Answers[q]) ? user2Answers[q].join('').toLowerCase() : String(user2Answers[q]).toLowerCase();
        if (a1 === a2) {
            lifestyleMatches++;
        }
    });
    scores.lifestyle = Math.round((lifestyleMatches / lifestyleQuestions.length) * 100);
    // Goals Alignment (q7=fitness, q12=vacation, q13=pet peeve, q16=success, q20=life motto)
    const goalsQuestions = ['q7', 'q12', 'q13', 'q16', 'q20'];
    let goalsMatches = 0;
    goalsQuestions.forEach(q => {
        const a1 = Array.isArray(user1Answers[q]) ? user1Answers[q].join('').toLowerCase() : String(user1Answers[q]).toLowerCase();
        const a2 = Array.isArray(user2Answers[q]) ? user2Answers[q].join('').toLowerCase() : String(user2Answers[q]).toLowerCase();
        if (a1 === a2) {
            goalsMatches++;
        }
    });
    scores.goals = Math.round((goalsMatches / goalsQuestions.length) * 100);
    // Dealbreaker Check - Hard incompatibilities
    // Kids dealbreaker
    if (user1Answers.q9 && user2Answers.q9) {
        const q9_1 = Array.isArray(user1Answers.q9) ? user1Answers.q9.join(' ').toLowerCase() : String(user1Answers.q9).toLowerCase();
        const q9_2 = Array.isArray(user2Answers.q9) ? user2Answers.q9.join(' ').toLowerCase() : String(user2Answers.q9).toLowerCase();
        const wantsKids1 = q9_1.includes('yes') || q9_1.includes('want');
        const wantsKids2 = q9_2.includes('yes') || q9_2.includes('want');
        if (wantsKids1 !== wantsKids2) {
            scores.dealbreakers = 30;
        }
    }
    // Religion dealbreaker - if one is very religious and other isn't
    if (user1Answers.q10 && user2Answers.q10) {
        const q10_1 = Array.isArray(user1Answers.q10) ? user1Answers.q10.join(' ').toLowerCase() : String(user1Answers.q10).toLowerCase();
        const q10_2 = Array.isArray(user2Answers.q10) ? user2Answers.q10.join(' ').toLowerCase() : String(user2Answers.q10).toLowerCase();
        const isReligious1 = q10_1.includes('very') || q10_1.includes('important');
        const isReligious2 = q10_2.includes('very') || q10_2.includes('important');
        if (isReligious1 !== isReligious2) {
            scores.dealbreakers = Math.min(scores.dealbreakers, 40);
        }
    }
    // Calculate weighted overall score with more nuance
    const overallScore = Math.round((scores.values * 0.35) + // Values are most important
        (scores.lifestyle * 0.25) + // Lifestyle compatibility
        (scores.goals * 0.20) + // Goals alignment
        (scores.dealbreakers * 0.20) // Dealbreakers
    );
    // Generate summary based on score
    let summary = '';
    if (overallScore >= 85) {
        summary = 'Excellent match! You share core values and life goals.';
    }
    else if (overallScore >= 75) {
        summary = 'Great match! Strong compatibility on what matters.';
    }
    else if (overallScore >= 65) {
        summary = 'Good match! You have solid common ground.';
    }
    else if (overallScore >= 55) {
        summary = 'Decent match. Some differences to explore.';
    }
    else if (overallScore >= 45) {
        summary = 'Moderate compatibility. Different priorities.';
    }
    else if (overallScore >= 35) {
        summary = 'Limited compatibility. Significant differences.';
    }
    else {
        summary = 'Low compatibility. Very different values.';
    }
    return {
        overallScore,
        breakdown: scores,
        summary
    };
};
// Get compatibility score with another user
router.get('/score/:targetUserId', authenticate, async (req, res) => {
    try {
        const userId = req.userId;
        const { targetUserId } = req.params;
        if (userId === targetUserId) {
            return res.status(400).json({ error: 'Cannot calculate compatibility with yourself' });
        }
        // Get current user's tier
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { tier: true, trialTier: true, trialExpiresAt: true }
        });
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check if user has premium access (premium, vip, or active trial)
        const effectiveTier = currentUser.trialTier && currentUser.trialExpiresAt && new Date(currentUser.trialExpiresAt) > new Date()
            ? currentUser.trialTier
            : currentUser.tier;
        const isPremium = effectiveTier !== 'free';
        const isVIP = effectiveTier === 'vip';
        // If free user, return locked response
        if (!isPremium) {
            return res.json({
                overallScore: null,
                breakdown: null,
                summary: 'Premium feature',
                locked: true,
                message: 'Upgrade to Premium or VIP to see compatibility scores'
            });
        }
        // Get both users' questionnaire answers
        const [user1Q, user2Q] = await Promise.all([
            prisma.questionnaire.findUnique({
                where: { userId }
            }),
            prisma.questionnaire.findUnique({
                where: { userId: targetUserId }
            })
        ]);
        if (!user1Q || !user2Q) {
            return res.status(404).json({ error: 'Questionnaire data not found for one or both users' });
        }
        // Parse questionnaire answers
        const user1Answers = user1Q.answers ? JSON.parse(user1Q.answers) : {};
        const user2Answers = user2Q.answers ? JSON.parse(user2Q.answers) : {};
        // Calculate compatibility
        const compatibility = calculateCompatibility(user1Answers, user2Answers);
        res.json(compatibility);
    }
    catch (err) {
        console.error('Error calculating compatibility:', err);
        res.status(500).json({ error: 'Failed to calculate compatibility' });
    }
});
export default router;
