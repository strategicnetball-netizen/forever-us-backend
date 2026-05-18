import express from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
// Helper function to normalize answers for comparison
const normalizeAnswer = (answer) => {
    if (Array.isArray(answer)) {
        return answer.map(a => String(a).toLowerCase().trim()).sort().join('|');
    }
    return String(answer).toLowerCase().trim();
};
// Calculate similarity score between two answers (0-100)
const calculateSimilarity = (answer1, answer2) => {
    const norm1 = normalizeAnswer(answer1);
    const norm2 = normalizeAnswer(answer2);
    if (norm1 === norm2)
        return 100;
    if (norm1.includes(norm2) || norm2.includes(norm1))
        return 70;
    return 0;
};
// Calculate compatibility score using all questionnaires
const calculateCompatibility = (user1Data, user2Data) => {
    if (!user1Data || !user2Data) {
        return { overallScore: 0, breakdown: {}, summary: 'Unable to calculate compatibility' };
    }
    let scores = {
        profileValues: 0,
        profileLifestyle: 0,
        profileGoals: 0,
        personality: 0,
        relationshipGoals: 0,
        lifestyle: 0,
        valuesBeliefs: 0,
        interestsHobbies: 0,
        musicPersonality: 0,
        intimatePreferences: 0,
        dealbreakers: 100
    };
    // ===== PROFILE QUESTIONNAIRE (20 questions) =====
    if (user1Data.profile && user2Data.profile) {
        const p1 = user1Data.profile;
        const p2 = user2Data.profile;
        // Values Alignment (q9=kids, q10=religion, q11=politics, q14=spirituality)
        const profileValuesQuestions = ['q9', 'q10', 'q11', 'q14'];
        let profileValuesMatches = 0;
        profileValuesQuestions.forEach(q => {
            profileValuesMatches += calculateSimilarity(p1[q], p2[q]) / 100;
        });
        scores.profileValues = Math.round((profileValuesMatches / profileValuesQuestions.length) * 100);
        // Lifestyle Compatibility (q4=spontaneity, q5=personality, q6=career, q8=cuisine, q11=conflict)
        const profileLifestyleQuestions = ['q4', 'q5', 'q6', 'q8', 'q11'];
        let profileLifestyleMatches = 0;
        profileLifestyleQuestions.forEach(q => {
            profileLifestyleMatches += calculateSimilarity(p1[q], p2[q]) / 100;
        });
        scores.profileLifestyle = Math.round((profileLifestyleMatches / profileLifestyleQuestions.length) * 100);
        // Goals Alignment (q7=fitness, q12=vacation, q13=pet peeve, q16=success, q20=life motto)
        const profileGoalsQuestions = ['q7', 'q12', 'q13', 'q16', 'q20'];
        let profileGoalsMatches = 0;
        profileGoalsQuestions.forEach(q => {
            profileGoalsMatches += calculateSimilarity(p1[q], p2[q]) / 100;
        });
        scores.profileGoals = Math.round((profileGoalsMatches / profileGoalsQuestions.length) * 100);
        // Dealbreaker Check - Hard incompatibilities
        if (p1.q9 && p2.q9) {
            const q9_1 = normalizeAnswer(p1.q9);
            const q9_2 = normalizeAnswer(p2.q9);
            const wantsKids1 = q9_1.includes('yes') || q9_1.includes('want');
            const wantsKids2 = q9_2.includes('yes') || q9_2.includes('want');
            if (wantsKids1 !== wantsKids2) {
                scores.dealbreakers = 30;
            }
        }
        if (p1.q10 && p2.q10) {
            const q10_1 = normalizeAnswer(p1.q10);
            const q10_2 = normalizeAnswer(p2.q10);
            const isReligious1 = q10_1.includes('very') || q10_1.includes('important');
            const isReligious2 = q10_2.includes('very') || q10_2.includes('important');
            if (isReligious1 !== isReligious2) {
                scores.dealbreakers = Math.min(scores.dealbreakers, 40);
            }
        }
    }
    // ===== PERSONALITY QUESTIONNAIRE (10 questions) =====
    if (user1Data.personality && user2Data.personality) {
        const pers1 = user1Data.personality;
        const pers2 = user2Data.personality;
        let personalityMatches = 0;
        for (let i = 1; i <= 10; i++) {
            const q = `id${i}`;
            if (pers1[q] && pers2[q]) {
                personalityMatches += calculateSimilarity(pers1[q], pers2[q]) / 100;
            }
        }
        scores.personality = Math.round((personalityMatches / 10) * 100);
    }
    // ===== RELATIONSHIP GOALS QUESTIONNAIRE (8 questions) =====
    if (user1Data.relationshipGoals && user2Data.relationshipGoals) {
        const rel1 = user1Data.relationshipGoals;
        const rel2 = user2Data.relationshipGoals;
        let relMatches = 0;
        for (let i = 1; i <= 8; i++) {
            const q = `id${i}`;
            if (rel1[q] && rel2[q]) {
                relMatches += calculateSimilarity(rel1[q], rel2[q]) / 100;
            }
        }
        scores.relationshipGoals = Math.round((relMatches / 8) * 100);
    }
    // ===== LIFESTYLE QUESTIONNAIRE (10 questions) =====
    if (user1Data.lifestyle && user2Data.lifestyle) {
        const life1 = user1Data.lifestyle;
        const life2 = user2Data.lifestyle;
        let lifeMatches = 0;
        for (let i = 1; i <= 10; i++) {
            const q = `id${i}`;
            if (life1[q] && life2[q]) {
                lifeMatches += calculateSimilarity(life1[q], life2[q]) / 100;
            }
        }
        scores.lifestyle = Math.round((lifeMatches / 10) * 100);
    }
    // ===== VALUES & BELIEFS QUESTIONNAIRE (10 questions) =====
    if (user1Data.valuesBeliefs && user2Data.valuesBeliefs) {
        const val1 = user1Data.valuesBeliefs;
        const val2 = user2Data.valuesBeliefs;
        let valMatches = 0;
        for (let i = 1; i <= 10; i++) {
            const q = `id${i}`;
            if (val1[q] && val2[q]) {
                valMatches += calculateSimilarity(val1[q], val2[q]) / 100;
            }
        }
        scores.valuesBeliefs = Math.round((valMatches / 10) * 100);
    }
    // ===== INTERESTS & HOBBIES QUESTIONNAIRE (10 questions) =====
    if (user1Data.interestsHobbies && user2Data.interestsHobbies) {
        const int1 = user1Data.interestsHobbies;
        const int2 = user2Data.interestsHobbies;
        let intMatches = 0;
        for (let i = 1; i <= 10; i++) {
            const q = `id${i}`;
            if (int1[q] && int2[q]) {
                intMatches += calculateSimilarity(int1[q], int2[q]) / 100;
            }
        }
        scores.interestsHobbies = Math.round((intMatches / 10) * 100);
    }
    // ===== MUSIC PERSONALITY QUESTIONNAIRE (10 questions) =====
    if (user1Data.musicPersonality && user2Data.musicPersonality) {
        const mus1 = user1Data.musicPersonality;
        const mus2 = user2Data.musicPersonality;
        let musMatches = 0;
        for (let i = 1; i <= 10; i++) {
            const q = `id${i}`;
            if (mus1[q] && mus2[q]) {
                musMatches += calculateSimilarity(mus1[q], mus2[q]) / 100;
            }
        }
        scores.musicPersonality = Math.round((musMatches / 10) * 100);
    }
    // ===== INTIMATE PREFERENCES (7 categories) =====
    if (user1Data.intimatePreferences && user2Data.intimatePreferences) {
        const int1 = user1Data.intimatePreferences;
        const int2 = user2Data.intimatePreferences;
        const categories = ['dominanceSubmission', 'bondage', 'roleplay', 'voyeurism', 'communicationStyle', 'boundaries', 'frequency'];
        let intimateMatches = 0;
        let categoriesWithData = 0;
        categories.forEach(cat => {
            const pref1 = int1[cat];
            const pref2 = int2[cat];
            if (pref1 && pref2) {
                categoriesWithData++;
                // Parse if they're JSON strings
                const p1 = typeof pref1 === 'string' ? JSON.parse(pref1) : pref1;
                const p2 = typeof pref2 === 'string' ? JSON.parse(pref2) : pref2;
                // Check for overlap in preferences
                if (Array.isArray(p1) && Array.isArray(p2)) {
                    const overlap = p1.filter(item => p2.includes(item));
                    if (overlap.length > 0) {
                        intimateMatches += 100 / 100;
                    }
                    else if (p1.length > 0 && p2.length > 0) {
                        intimateMatches += 50 / 100; // Partial match for having preferences
                    }
                }
            }
        });
        if (categoriesWithData > 0) {
            scores.intimatePreferences = Math.round((intimateMatches / categoriesWithData) * 100);
        }
    }
    // Calculate weighted overall score
    const overallScore = Math.round((scores.profileValues * 0.20) +
        (scores.profileGoals * 0.15) +
        (scores.profileLifestyle * 0.12) +
        (scores.relationshipGoals * 0.15) +
        (scores.valuesBeliefs * 0.12) +
        (scores.lifestyle * 0.10) +
        (scores.personality * 0.08) +
        (scores.interestsHobbies * 0.05) +
        (scores.musicPersonality * 0.03) +
        (scores.intimatePreferences * 0.05));
    // Apply dealbreaker penalty
    const finalScore = Math.round(overallScore * (scores.dealbreakers / 100));
    // Generate summary
    let summary = '';
    if (finalScore >= 85) {
        summary = 'Excellent match! You share core values, goals, and lifestyle.';
    }
    else if (finalScore >= 75) {
        summary = 'Great match! Strong compatibility across multiple dimensions.';
    }
    else if (finalScore >= 65) {
        summary = 'Good match! Solid common ground on what matters.';
    }
    else if (finalScore >= 55) {
        summary = 'Decent match. Compatible in key areas with some differences.';
    }
    else if (finalScore >= 45) {
        summary = 'Moderate compatibility. Different priorities but potential.';
    }
    else if (finalScore >= 35) {
        summary = 'Limited compatibility. Significant differences to navigate.';
    }
    else {
        summary = 'Low compatibility. Very different values and goals.';
    }
    return {
        overallScore: finalScore,
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
        // Get current user
        const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, points: true }
        });
        if (!currentUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Check if user has enough coins (2 coins to view compatibility)
        const COMPATIBILITY_COST = 2;
        if (currentUser.points < COMPATIBILITY_COST) {
            return res.json({
                overallScore: null,
                breakdown: null,
                summary: 'Insufficient coins',
                locked: true,
                message: `Need ${COMPATIBILITY_COST} coins to view compatibility scores. You have ${currentUser.points} coins.`
            });
        }
        // Get both users' questionnaire data
        const [user1Q, user2Q, user1Pers, user2Pers, user1Rel, user2Rel, user1Life, user2Life, user1Val, user2Val, user1Int, user2Int, user1Mus, user2Mus, user1Intimate, user2Intimate] = await Promise.all([
            prisma.questionnaire.findUnique({ where: { userId } }),
            prisma.questionnaire.findUnique({ where: { userId: targetUserId } }),
            prisma.personalityQuestionnaire.findUnique({ where: { userId } }),
            prisma.personalityQuestionnaire.findUnique({ where: { userId: targetUserId } }),
            prisma.relationshipGoalsQuestionnaire.findUnique({ where: { userId } }),
            prisma.relationshipGoalsQuestionnaire.findUnique({ where: { userId: targetUserId } }),
            prisma.lifestyleQuestionnaire.findUnique({ where: { userId } }),
            prisma.lifestyleQuestionnaire.findUnique({ where: { userId: targetUserId } }),
            prisma.valuesBelifsQuestionnaire.findUnique({ where: { userId } }),
            prisma.valuesBelifsQuestionnaire.findUnique({ where: { userId: targetUserId } }),
            prisma.interestsHobbiesQuestionnaire.findUnique({ where: { userId } }),
            prisma.interestsHobbiesQuestionnaire.findUnique({ where: { userId: targetUserId } }),
            prisma.MusicPersonalityQuestionnaire.findUnique({ where: { userId } }),
            prisma.MusicPersonalityQuestionnaire.findUnique({ where: { userId: targetUserId } }),
            prisma.intimatePreferences.findUnique({ where: { userId } }),
            prisma.intimatePreferences.findUnique({ where: { userId: targetUserId } })
        ]);
        if (!user1Q || !user2Q) {
            return res.status(404).json({ error: 'Profile questionnaire data not found for one or both users' });
        }
        // Prepare user data object
        const user1Data = {
            profile: user1Q.answers ? JSON.parse(user1Q.answers) : {},
            personality: user1Pers?.answers ? JSON.parse(user1Pers.answers) : null,
            relationshipGoals: user1Rel?.answers ? JSON.parse(user1Rel.answers) : null,
            lifestyle: user1Life?.answers ? JSON.parse(user1Life.answers) : null,
            valuesBeliefs: user1Val?.answers ? JSON.parse(user1Val.answers) : null,
            interestsHobbies: user1Int?.answers ? JSON.parse(user1Int.answers) : null,
            musicPersonality: user1Mus?.answers ? JSON.parse(user1Mus.answers) : null,
            intimatePreferences: user1Intimate ? {
                dominanceSubmission: user1Intimate.dominanceSubmission,
                bondage: user1Intimate.bondage,
                roleplay: user1Intimate.roleplay,
                voyeurism: user1Intimate.voyeurism,
                communicationStyle: user1Intimate.communicationStyle,
                boundaries: user1Intimate.boundaries,
                frequency: user1Intimate.frequency
            } : null
        };
        const user2Data = {
            profile: user2Q.answers ? JSON.parse(user2Q.answers) : {},
            personality: user2Pers?.answers ? JSON.parse(user2Pers.answers) : null,
            relationshipGoals: user2Rel?.answers ? JSON.parse(user2Rel.answers) : null,
            lifestyle: user2Life?.answers ? JSON.parse(user2Life.answers) : null,
            valuesBeliefs: user2Val?.answers ? JSON.parse(user2Val.answers) : null,
            interestsHobbies: user2Int?.answers ? JSON.parse(user2Int.answers) : null,
            musicPersonality: user2Mus?.answers ? JSON.parse(user2Mus.answers) : null,
            intimatePreferences: user2Intimate ? {
                dominanceSubmission: user2Intimate.dominanceSubmission,
                bondage: user2Intimate.bondage,
                roleplay: user2Intimate.roleplay,
                voyeurism: user2Intimate.voyeurism,
                communicationStyle: user2Intimate.communicationStyle,
                boundaries: user2Intimate.boundaries,
                frequency: user2Intimate.frequency
            } : null
        };
        // Calculate compatibility
        const compatibility = calculateCompatibility(user1Data, user2Data);
        // Deduct coins from user
        await prisma.user.update({
            where: { id: userId },
            data: { points: { decrement: COMPATIBILITY_COST } }
        });
        // Record transaction
        await prisma.pointsTransaction.create({
            data: {
                userId: userId,
                amount: -COMPATIBILITY_COST,
                type: 'compatibility_view',
                reason: `Viewed compatibility score with user ${targetUserId}`
            }
        });
        res.json(compatibility);
    }
    catch (err) {
        console.error('Error calculating compatibility:', err);
        res.status(500).json({ error: 'Failed to calculate compatibility' });
    }
});
export default router;
