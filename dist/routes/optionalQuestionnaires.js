import express from 'express';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
const getPrisma = () => {
    if (!global.prisma) {
        throw new Error('Prisma client not initialized');
    }
    return global.prisma;
};
// Get available questionnaires and completion status
router.get('/available', authenticate, async (req, res, next) => {
    try {
        const prisma = getPrisma();
        const userId = req.userId;
        // Get completion status for all questionnaires
        const completions = await prisma.questionnaireCompletion.findMany({
            where: { userId }
        });
        const completionMap = {};
        completions.forEach(c => {
            completionMap[c.type] = {
                completed: c.completed,
                completedAt: c.completedAt,
                coinsRewarded: c.coinsRewarded
            };
        });
        // Verify that questionnaires marked as completed actually have data
        const verifiedCompletions = {};
        // Check personality
        if (completionMap['personality']?.completed) {
            const data = await prisma.personalityQuestionnaire.findUnique({ where: { userId } });
            verifiedCompletions['personality'] = !!data;
        }
        // Check relationship_goals
        if (completionMap['relationship_goals']?.completed) {
            const data = await prisma.relationshipGoalsQuestionnaire.findUnique({ where: { userId } });
            verifiedCompletions['relationship_goals'] = !!data;
        }
        // Check lifestyle
        if (completionMap['lifestyle']?.completed) {
            const data = await prisma.lifestyleQuestionnaire.findUnique({ where: { userId } });
            verifiedCompletions['lifestyle'] = !!data;
        }
        // Check values_beliefs
        if (completionMap['values_beliefs']?.completed) {
            const data = await prisma.valuesBelifsQuestionnaire.findUnique({ where: { userId } });
            verifiedCompletions['values_beliefs'] = !!data;
        }
        // Check interests_hobbies
        if (completionMap['interests_hobbies']?.completed) {
            const data = await prisma.interestsHobbiesQuestionnaire.findUnique({ where: { userId } });
            verifiedCompletions['interests_hobbies'] = !!data;
        }
        // Check music_personality
        if (completionMap['music_personality']?.completed) {
            const data = await prisma.MusicPersonalityQuestionnaire.findUnique({ where: { userId } });
            verifiedCompletions['music_personality'] = !!data;
        }
        // Check lifestyle_preferences
        if (completionMap['lifestyle_preferences']?.completed) {
            const data = await prisma.lifestylePreferencesQuestionnaire.findUnique({ where: { userId } });
            verifiedCompletions['lifestyle_preferences'] = !!data;
        }
        // Check red_flags
        if (completionMap['red_flags']?.completed) {
            const data = await prisma.redFlagsQuestionnaire.findUnique({ where: { userId } });
            verifiedCompletions['red_flags'] = !!data;
        }
        // Check deal_breakers
        if (completionMap['deal_breakers']?.completed) {
            const data = await prisma.dealBreakersQuestionnaire.findUnique({ where: { userId } });
            verifiedCompletions['deal_breakers'] = !!data;
        }
        const questionnaires = [
            {
                id: 'personality',
                type: 'personality',
                title: '🧠 Personality Profile',
                description: 'Discover your Big Five personality traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism)',
                estimatedTime: '5-7 minutes',
                questions: 10,
                coinsReward: 20,
                completed: verifiedCompletions['personality'] || false,
                completedAt: completionMap['personality']?.completedAt || null
            },
            {
                id: 'relationship_goals',
                type: 'relationship_goals',
                title: '💕 Relationship Compatibility',
                description: 'Explore your relationship style, communication preferences, and what matters most to you in a partner',
                estimatedTime: '4-5 minutes',
                questions: 8,
                coinsReward: 20,
                completed: verifiedCompletions['relationship_goals'] || false,
                completedAt: completionMap['relationship_goals']?.completedAt || null
            },
            {
                id: 'lifestyle',
                type: 'lifestyle',
                title: '🌟 Lifestyle & Values',
                description: 'Share your lifestyle preferences, values, and daily habits',
                estimatedTime: '5-6 minutes',
                questions: 10,
                coinsReward: 20,
                completed: verifiedCompletions['lifestyle'] || false,
                completedAt: completionMap['lifestyle']?.completedAt || null
            },
            {
                id: 'values_beliefs',
                type: 'values_beliefs',
                title: '✨ Values & Beliefs',
                description: 'Share your core values, beliefs, and what matters most to you',
                estimatedTime: '5-7 minutes',
                questions: 10,
                coinsReward: 20,
                completed: verifiedCompletions['values_beliefs'] || false,
                completedAt: completionMap['values_beliefs']?.completedAt || null
            },
            {
                id: 'interests_hobbies',
                type: 'interests_hobbies',
                title: '🎯 Interests & Hobbies',
                description: 'Discover what you\'re passionate about and how you spend your time',
                estimatedTime: '5-6 minutes',
                questions: 10,
                coinsReward: 20,
                completed: verifiedCompletions['interests_hobbies'] || false,
                completedAt: completionMap['interests_hobbies']?.completedAt || null
            },
            {
                id: 'music_personality',
                type: 'music_personality',
                title: '🎵 Music Personality',
                description: 'Discover your music personality and what it reveals about you',
                estimatedTime: '5-6 minutes',
                questions: 13,
                coinsReward: 20,
                completed: verifiedCompletions['music_personality'] || false,
                completedAt: completionMap['music_personality']?.completedAt || null
            },
            {
                id: 'lifestyle_preferences',
                type: 'lifestyle_preferences',
                title: '🚭 Lifestyle Preferences',
                description: 'Share your preferences on smoking, alcohol, drugs, tattoos, and pets',
                estimatedTime: '2-3 minutes',
                questions: 5,
                coinsReward: 20,
                completed: verifiedCompletions['lifestyle_preferences'] || false,
                completedAt: completionMap['lifestyle_preferences']?.completedAt || null
            },
            {
                id: 'red_flags',
                type: 'red_flags',
                title: '🚩 Red Flags',
                description: 'Identify your red flags - warning signs that make someone less attractive',
                estimatedTime: '2-3 minutes',
                questions: 1,
                coinsReward: 20,
                completed: verifiedCompletions['red_flags'] || false,
                completedAt: completionMap['red_flags']?.completedAt || null
            },
            {
                id: 'deal_breakers',
                type: 'deal_breakers',
                title: '⛔ Deal Breakers',
                description: 'Define your deal breakers - absolute must-haves and must-nots',
                estimatedTime: '2-3 minutes',
                questions: 1,
                coinsReward: 20,
                completed: verifiedCompletions['deal_breakers'] || false,
                completedAt: completionMap['deal_breakers']?.completedAt || null
            }
        ];
        res.json({
            questionnaires,
            totalCompleted: completions.filter(c => c.completed).length,
            totalAvailable: questionnaires.length,
            totalCoinsEarned: completions.reduce((sum, c) => sum + c.coinsRewarded, 0)
        });
    }
    catch (err) {
        next(err);
    }
});
// Get music personality answers for a specific user
router.get('/:userId/music-personality', authenticate, async (req, res, next) => {
    try {
        const prisma = getPrisma();
        const { userId } = req.params;
        const questionnaire = await prisma.MusicPersonalityQuestionnaire.findUnique({
            where: { userId }
        });
        if (!questionnaire) {
            return res.json({ musicAnswers: null });
        }
        const answers = JSON.parse(questionnaire.answers);
        // Extract only the text input answers (questions 11, 12, 13)
        const musicAnswers = {
            favoriteBand: answers.id11 || null,
            firstConcert: answers.id12 || null,
            firstPurchase: answers.id13 || null
        };
        res.json({ musicAnswers });
    }
    catch (err) {
        next(err);
    }
});
// Get curated red flags and deal breakers lists
router.get('/lists/red-flags', authenticate, async (req, res, next) => {
    try {
        const prisma = getPrisma();
        const flags = await prisma.redFlagsList.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            take: 20
        });
        res.json({ flags: flags.map(f => f.flag) });
    }
    catch (err) {
        next(err);
    }
});
router.get('/lists/deal-breakers', authenticate, async (req, res, next) => {
    try {
        const prisma = getPrisma();
        const breakers = await prisma.dealBreakersList.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            take: 20
        });
        res.json({ breakers: breakers.map(b => b.breaker) });
    }
    catch (err) {
        next(err);
    }
});
// Get specific questionnaire questions
router.get('/:type', authenticate, async (req, res, next) => {
    try {
        const { type } = req.params;
        const questions = await getQuestionnaireQuestions(type);
        if (!questions) {
            return res.status(400).json({ error: 'Invalid questionnaire type' });
        }
        res.json({
            type,
            questions,
            totalQuestions: questions.length
        });
    }
    catch (err) {
        next(err);
    }
});
// Submit questionnaire answers
router.post('/:type/submit', authenticate, async (req, res, next) => {
    try {
        const prisma = getPrisma();
        const { type } = req.params;
        const { answers } = req.body;
        const userId = req.userId;
        // Validate type
        const validTypes = ['personality', 'relationship_goals', 'lifestyle', 'values_beliefs', 'interests_hobbies', 'music_personality', 'lifestyle_preferences', 'red_flags', 'deal_breakers'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({ error: 'Invalid questionnaire type' });
        }
        // Validate answers
        if (!answers || typeof answers !== 'object') {
            return res.status(400).json({ error: 'Invalid answers format' });
        }
        const coinsReward = 20;
        // Save questionnaire based on type
        let questionnaire;
        if (type === 'personality') {
            questionnaire = await prisma.personalityQuestionnaire.upsert({
                where: { userId },
                update: {
                    answers: JSON.stringify(answers),
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    answers: JSON.stringify(answers)
                }
            });
        }
        else if (type === 'relationship_goals') {
            questionnaire = await prisma.relationshipGoalsQuestionnaire.upsert({
                where: { userId },
                update: {
                    answers: JSON.stringify(answers),
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    answers: JSON.stringify(answers)
                }
            });
        }
        else if (type === 'lifestyle') {
            questionnaire = await prisma.lifestyleQuestionnaire.upsert({
                where: { userId },
                update: {
                    answers: JSON.stringify(answers),
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    answers: JSON.stringify(answers)
                }
            });
        }
        else if (type === 'values_beliefs') {
            questionnaire = await prisma.valuesBelifsQuestionnaire.upsert({
                where: { userId },
                update: {
                    answers: JSON.stringify(answers),
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    answers: JSON.stringify(answers)
                }
            });
        }
        else if (type === 'interests_hobbies') {
            questionnaire = await prisma.interestsHobbiesQuestionnaire.upsert({
                where: { userId },
                update: {
                    answers: JSON.stringify(answers),
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    answers: JSON.stringify(answers)
                }
            });
        }
        else if (type === 'music_personality') {
            questionnaire = await prisma.MusicPersonalityQuestionnaire.upsert({
                where: { userId },
                update: {
                    answers: JSON.stringify(answers),
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    answers: JSON.stringify(answers)
                }
            });
        }
        else if (type === 'lifestyle_preferences') {
            questionnaire = await prisma.lifestylePreferencesQuestionnaire.upsert({
                where: { userId },
                update: {
                    answers: JSON.stringify(answers),
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    answers: JSON.stringify(answers)
                }
            });
        }
        else if (type === 'red_flags') {
            // Extract selected flags from answers (question 1 contains the array)
            const selectedFlags = answers[1] || [];
            questionnaire = await prisma.redFlagsQuestionnaire.upsert({
                where: { userId },
                update: {
                    rawInput: null,
                    selectedFlags: JSON.stringify(selectedFlags),
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    rawInput: null,
                    selectedFlags: JSON.stringify(selectedFlags)
                }
            });
        }
        else if (type === 'deal_breakers') {
            questionnaire = await prisma.dealBreakersQuestionnaire.upsert({
                where: { userId },
                update: {
                    rawInput: answers.rawInput || null,
                    selectedBreakers: JSON.stringify(answers.selectedBreakers || []),
                    updatedAt: new Date()
                },
                create: {
                    userId,
                    rawInput: answers.rawInput || null,
                    selectedBreakers: JSON.stringify(answers.selectedBreakers || [])
                }
            });
        }
        // Update completion status
        const completion = await prisma.questionnaireCompletion.upsert({
            where: {
                userId_type: {
                    userId,
                    type
                }
            },
            update: {
                completed: true,
                completedAt: new Date(),
                coinsRewarded: coinsReward
            },
            create: {
                userId,
                type,
                completed: true,
                completedAt: new Date(),
                coinsRewarded: coinsReward
            }
        });
        // Award coins to user
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                points: { increment: coinsReward }
            }
        });
        // Record transaction
        await prisma.pointsTransaction.create({
            data: {
                userId,
                amount: coinsReward,
                type: 'questionnaire_completion',
                reason: `Completed ${type} questionnaire`
            }
        });
        res.json({
            success: true,
            message: `Questionnaire completed! You earned ${coinsReward} coins.`,
            coinsEarned: coinsReward,
            totalPoints: user.points,
            questionnaire
        });
    }
    catch (err) {
        next(err);
    }
});
// Get user's questionnaire answers
router.get('/:type/answers', authenticate, async (req, res, next) => {
    try {
        const prisma = getPrisma();
        const { type } = req.params;
        const userId = req.userId;
        let questionnaire;
        if (type === 'personality') {
            questionnaire = await prisma.personalityQuestionnaire.findUnique({
                where: { userId }
            });
        }
        else if (type === 'relationship_goals') {
            questionnaire = await prisma.relationshipGoalsQuestionnaire.findUnique({
                where: { userId }
            });
        }
        else if (type === 'lifestyle') {
            questionnaire = await prisma.lifestyleQuestionnaire.findUnique({
                where: { userId }
            });
        }
        else if (type === 'values_beliefs') {
            questionnaire = await prisma.valuesBelifsQuestionnaire.findUnique({
                where: { userId }
            });
        }
        else if (type === 'interests_hobbies') {
            questionnaire = await prisma.interestsHobbiesQuestionnaire.findUnique({
                where: { userId }
            });
        }
        else if (type === 'music_personality') {
            questionnaire = await prisma.MusicPersonalityQuestionnaire.findUnique({
                where: { userId }
            });
        }
        else if (type === 'lifestyle_preferences') {
            questionnaire = await prisma.lifestylePreferencesQuestionnaire.findUnique({
                where: { userId }
            });
        }
        else if (type === 'red_flags') {
            questionnaire = await prisma.redFlagsQuestionnaire.findUnique({
                where: { userId }
            });
            if (questionnaire) {
                return res.json({
                    type,
                    answers: {
                        rawInput: questionnaire.rawInput,
                        selectedFlags: JSON.parse(questionnaire.selectedFlags || '[]')
                    },
                    completedAt: questionnaire.completedAt
                });
            }
        }
        else if (type === 'deal_breakers') {
            questionnaire = await prisma.dealBreakersQuestionnaire.findUnique({
                where: { userId }
            });
            if (questionnaire) {
                return res.json({
                    type,
                    answers: {
                        rawInput: questionnaire.rawInput,
                        selectedBreakers: JSON.parse(questionnaire.selectedBreakers || '[]')
                    },
                    completedAt: questionnaire.completedAt
                });
            }
        }
        if (!questionnaire) {
            return res.status(404).json({ error: 'Questionnaire not found' });
        }
        res.json({
            type,
            answers: JSON.parse(questionnaire.answers),
            completedAt: questionnaire.completedAt
        });
    }
    catch (err) {
        next(err);
    }
});
// Helper function to get questionnaire questions
async function getQuestionnaireQuestions(type) {
    const prisma = getPrisma();
    const questions = {
        personality: [
            {
                id: 1,
                question: 'I am the life of the party',
                type: 'scale',
                category: 'Extraversion',
                scale: 'Strongly Disagree to Strongly Agree'
            },
            {
                id: 2,
                question: 'I get stressed out easily',
                type: 'scale',
                category: 'Neuroticism',
                scale: 'Strongly Disagree to Strongly Agree'
            },
            {
                id: 3,
                question: 'I am interested in art, music, or literature',
                type: 'scale',
                category: 'Openness',
                scale: 'Strongly Disagree to Strongly Agree'
            },
            {
                id: 4,
                question: 'I am always prepared',
                type: 'scale',
                category: 'Conscientiousness',
                scale: 'Strongly Disagree to Strongly Agree'
            },
            {
                id: 5,
                question: 'I sympathize with others\' feelings',
                type: 'scale',
                category: 'Agreeableness',
                scale: 'Strongly Disagree to Strongly Agree'
            },
            {
                id: 6,
                question: 'I am reserved',
                type: 'scale',
                category: 'Extraversion',
                scale: 'Strongly Disagree to Strongly Agree'
            },
            {
                id: 7,
                question: 'I am disorganized',
                type: 'scale',
                category: 'Conscientiousness',
                scale: 'Strongly Disagree to Strongly Agree'
            },
            {
                id: 8,
                question: 'I am open to new experiences',
                type: 'scale',
                category: 'Openness',
                scale: 'Strongly Disagree to Strongly Agree'
            },
            {
                id: 9,
                question: 'I can be critical of others',
                type: 'scale',
                category: 'Agreeableness',
                scale: 'Strongly Disagree to Strongly Agree'
            },
            {
                id: 10,
                question: 'I worry about things',
                type: 'scale',
                category: 'Neuroticism',
                scale: 'Strongly Disagree to Strongly Agree'
            }
        ],
        relationship_goals: [
            {
                id: 1,
                question: 'How important is intellectual compatibility?',
                type: 'scale',
                category: 'Compatibility'
            },
            {
                id: 2,
                question: 'What role should a partner play in your life?',
                type: 'multiple_choice',
                options: ['Best friend and companion', 'Life partner and co-parent', 'Adventure buddy', 'Equal teammate']
            },
            {
                id: 3,
                question: 'How do you prefer to spend quality time together?',
                type: 'multiple_choice',
                options: ['Outdoor activities', 'Cultural experiences', 'Quiet time at home', 'Social gatherings', 'Travel']
            },
            {
                id: 4,
                question: 'How important is independence in a relationship?',
                type: 'scale',
                category: 'Independence'
            },
            {
                id: 5,
                question: 'What\'s your communication style preference?',
                type: 'multiple_choice',
                options: ['Frequent check-ins', 'Deep conversations', 'Spontaneous and casual', 'Planned quality time']
            },
            {
                id: 6,
                question: 'How important is shared life vision?',
                type: 'scale',
                category: 'Vision'
            },
            {
                id: 7,
                question: 'What would be a dealbreaker for you?',
                type: 'multiple_choice',
                options: ['Different life goals', 'Lack of trust', 'Poor communication', 'Incompatible values', 'Unwillingness to grow']
            },
            {
                id: 8,
                question: 'How do you envision your ideal future together?',
                type: 'multiple_choice',
                options: ['Settled and stable', 'Adventurous and spontaneous', 'Career-focused', 'Family-centered', 'Flexible and open']
            }
        ],
        lifestyle: [
            {
                id: 1,
                question: 'How often do you exercise?',
                type: 'multiple_choice',
                options: ['Daily', '3-4 times a week', '1-2 times a week', 'Rarely', 'Never']
            },
            {
                id: 2,
                question: 'What\'s your ideal weekend?',
                type: 'multiple_choice',
                options: ['Outdoors/adventure', 'Social events', 'Relaxing at home', 'Cultural activities', 'Mix of everything']
            },
            {
                id: 3,
                question: 'How important is travel to you?',
                type: 'scale',
                scale: 'Not important to Very important'
            },
            {
                id: 4,
                question: 'What\'s your sleep schedule?',
                type: 'multiple_choice',
                options: ['Early bird', 'Night owl', 'Flexible', 'No preference']
            },
            {
                id: 5,
                question: 'How do you feel about social media?',
                type: 'multiple_choice',
                options: ['Love it', 'Use it casually', 'Minimal use', 'Avoid it']
            },
            {
                id: 6,
                question: 'What\'s your career priority?',
                type: 'multiple_choice',
                options: ['Very ambitious', 'Balanced', 'Work to live', 'Still figuring it out']
            },
            {
                id: 7,
                question: 'How important is spirituality/religion?',
                type: 'scale',
                scale: 'Not important to Very important'
            },
            {
                id: 8,
                question: 'What\'s your ideal living situation?',
                type: 'multiple_choice',
                options: ['City', 'Suburbs', 'Rural', 'No preference']
            },
            {
                id: 9,
                question: 'How do you spend most of your free time?',
                type: 'multiple_choice',
                options: ['Sports/fitness', 'Creative hobbies', 'Socializing', 'Learning', 'Entertainment']
            },
            {
                id: 10,
                question: 'How important is environmental consciousness?',
                type: 'scale',
                scale: 'Not important to Very important'
            }
        ],
        values_beliefs: [
            {
                id: 1,
                question: 'How important are family values to you?',
                type: 'scale',
                category: 'Family'
            },
            {
                id: 2,
                question: 'What\'s your political orientation?',
                type: 'multiple_choice',
                options: ['Very liberal', 'Liberal', 'Moderate', 'Conservative', 'Very conservative']
            },
            {
                id: 3,
                question: 'How important is honesty and integrity?',
                type: 'scale',
                category: 'Ethics'
            },
            {
                id: 4,
                question: 'What role does faith/spirituality play in your life?',
                type: 'multiple_choice',
                options: ['Central to my life', 'Important', 'Somewhat important', 'Not important', 'Actively opposed']
            },
            {
                id: 5,
                question: 'How important is personal growth and self-improvement?',
                type: 'scale',
                category: 'Growth'
            },
            {
                id: 6,
                question: 'What\'s your stance on social justice issues?',
                type: 'multiple_choice',
                options: ['Very passionate', 'Engaged', 'Somewhat interested', 'Not very interested', 'Prefer not to discuss']
            },
            {
                id: 7,
                question: 'How important is loyalty in relationships?',
                type: 'scale',
                category: 'Loyalty'
            },
            {
                id: 8,
                question: 'What\'s your view on work-life balance?',
                type: 'multiple_choice',
                options: ['Career comes first', 'Balanced priority', 'Family/personal life comes first', 'Flexible depending on situation']
            },
            {
                id: 9,
                question: 'How important is financial responsibility?',
                type: 'scale',
                category: 'Finance'
            },
            {
                id: 10,
                question: 'What values matter most to you?',
                type: 'multiple_choice',
                options: ['Love and connection', 'Success and achievement', 'Freedom and independence', 'Security and stability', 'Making a difference']
            }
        ],
        interests_hobbies: [
            {
                id: 1,
                question: 'What\'s your favorite type of music?',
                type: 'multiple_choice',
                options: ['Pop/mainstream', 'Rock/alternative', 'Hip-hop/rap', 'Country', 'Classical/jazz', 'Electronic/EDM', 'Indie', 'Diverse taste']
            },
            {
                id: 2,
                question: 'How often do you read?',
                type: 'multiple_choice',
                options: ['Daily', 'Several times a week', 'Weekly', 'Monthly', 'Rarely', 'Never']
            },
            {
                id: 3,
                question: 'What type of movies/shows do you prefer?',
                type: 'multiple_choice',
                options: ['Comedy', 'Drama', 'Action/thriller', 'Romance', 'Documentary', 'Horror', 'Sci-fi/fantasy', 'Variety']
            },
            {
                id: 4,
                question: 'Are you into sports?',
                type: 'multiple_choice',
                options: ['Play actively', 'Watch regularly', 'Casual interest', 'Not interested']
            },
            {
                id: 5,
                question: 'How important are creative hobbies to you?',
                type: 'scale',
                category: 'Creativity'
            },
            {
                id: 6,
                question: 'What\'s your gaming interest level?',
                type: 'multiple_choice',
                options: ['Hardcore gamer', 'Casual gamer', 'Occasional player', 'Not interested']
            },
            {
                id: 7,
                question: 'How often do you cook?',
                type: 'multiple_choice',
                options: ['Daily', 'Several times a week', 'Weekly', 'Occasionally', 'Rarely', 'Never']
            },
            {
                id: 8,
                question: 'What\'s your travel style?',
                type: 'multiple_choice',
                options: ['Adventure/backpacking', 'Luxury/comfort', 'Cultural exploration', 'Beach/relaxation', 'Road trips', 'Staycation']
            },
            {
                id: 9,
                question: 'How important are outdoor activities?',
                type: 'scale',
                category: 'Outdoors'
            },
            {
                id: 10,
                question: 'What\'s your ideal way to spend a night out?',
                type: 'multiple_choice',
                options: ['Dinner and drinks', 'Live music/concerts', 'Dancing/clubs', 'Movies/theater', 'Casual hangout', 'Quiet dinner']
            }
        ],
        music_personality: [
            {
                id: 1,
                question: 'Music is an important part of my life',
                type: 'scale',
                category: 'Music Importance'
            },
            {
                id: 2,
                question: 'What\'s your primary music listening method?',
                type: 'multiple_choice',
                options: ['Streaming services', 'Radio', 'Vinyl/CDs', 'YouTube', 'Live concerts', 'Mix of everything']
            },
            {
                id: 3,
                question: 'How often do you discover new music?',
                type: 'multiple_choice',
                options: ['Constantly seeking', 'Regularly', 'Occasionally', 'Rarely', 'Stick to what I know']
            },
            {
                id: 4,
                question: 'Do you play any musical instruments?',
                type: 'multiple_choice',
                options: ['Yes, actively', 'Yes, casually', 'Used to', 'No, but interested', 'No interest']
            },
            {
                id: 5,
                question: 'How important is live music to you?',
                type: 'scale',
                category: 'Live Music'
            },
            {
                id: 6,
                question: 'What\'s your music taste like?',
                type: 'multiple_choice',
                options: ['Very specific genre', 'Mostly one genre', 'Mix of 2-3 genres', 'Eclectic/all over', 'No strong preference']
            },
            {
                id: 7,
                question: 'Music helps me express my emotions',
                type: 'scale',
                category: 'Emotional Connection'
            },
            {
                id: 8,
                question: 'How do you feel about sharing music with a partner?',
                type: 'multiple_choice',
                options: ['Love introducing them to my music', 'Open to their suggestions', 'Neutral', 'Prefer my own taste', 'Music is personal']
            },
            {
                id: 9,
                question: 'How important is musical compatibility in a relationship?',
                type: 'scale',
                category: 'Compatibility'
            },
            {
                id: 10,
                question: 'What role does music play in your daily life?',
                type: 'multiple_choice',
                options: ['Constant background', 'During specific activities', 'When I need it', 'Occasional', 'Rarely']
            },
            {
                id: 11,
                question: 'What is your favourite band?',
                type: 'text_input',
                placeholder: 'Enter your favorite band name...'
            },
            {
                id: 12,
                question: 'What was the first concert you attended?',
                type: 'text_input',
                placeholder: 'Tell us about your first concert experience...'
            },
            {
                id: 13,
                question: 'What was the first album/cassette/CD/download you paid for?',
                type: 'text_input',
                placeholder: 'Share your first music purchase...'
            }
        ],
        lifestyle_preferences: [
            {
                id: 1,
                question: 'What\'s your stance on smoking?',
                type: 'multiple_choice',
                options: ['Non-smoker', 'Smoker', 'Quit smoking', 'Occasional smoker', 'No preference']
            },
            {
                id: 2,
                question: 'How do you feel about alcohol?',
                type: 'multiple_choice',
                options: ['Don\'t drink', 'Social drinker', 'Regular drinker', 'Heavy drinker', 'No preference']
            },
            {
                id: 3,
                question: 'What\'s your stance on recreational drugs?',
                type: 'multiple_choice',
                options: ['Strongly opposed', 'Opposed', 'Open-minded', 'Occasional user', 'Regular user']
            },
            {
                id: 4,
                question: 'Do you have any tattoos?',
                type: 'multiple_choice',
                options: ['No tattoos', 'One or two', 'Several', 'Many', 'Planning to get some']
            },
            {
                id: 5,
                question: 'How do you feel about pets?',
                type: 'multiple_choice',
                options: ['Love pets', 'Have pets', 'Like pets but don\'t have any', 'Neutral', 'Prefer no pets']
            }
        ],
        red_flags: [
            {
                id: 1,
                question: 'Select which of these common red flags apply to you:',
                type: 'checkbox_list',
                options: [] // Will be populated from RedFlagsList
            }
        ],
        deal_breakers: [
            {
                id: 1,
                question: 'Select which of these common deal breakers apply to you:',
                type: 'checkbox_list',
                options: [] // Will be populated from DealBreakersList
            }
        ]
    };
    // For red_flags and deal_breakers, fetch the curated lists
    if (type === 'red_flags') {
        const flags = await prisma.redFlagsList.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            take: 20
        });
        questions.red_flags[0].options = flags.map(f => f.flag);
        return questions.red_flags;
    }
    if (type === 'deal_breakers') {
        const breakers = await prisma.dealBreakersList.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' },
            take: 20
        });
        questions.deal_breakers[0].options = breakers.map(b => b.breaker);
        return questions.deal_breakers;
    }
    return questions[type] || null;
}
export default router;
