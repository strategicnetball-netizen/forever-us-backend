import express from 'express';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get prisma from global scope (set by index.js)
const getPrisma = () => {
  if (!global.prisma) {
    throw new Error('Prisma client not initialized');
  }
  return global.prisma;
}

const QUESTIONS = [
  "What's your ideal first date?",
  "What's your biggest life goal?",
  "How do you spend your weekends?",
  "What's your favorite travel destination?",
  "What's your relationship with your family like?",
  "What's your career ambition?",
  "How important is fitness to you?",
  "What's your favorite type of cuisine?",
  "Do you want kids in the future?",
  "What's your love language?",
  "How do you handle conflict?",
  "What's your ideal vacation?",
  "What's your biggest pet peeve?",
  "How important is religion/spirituality?",
  "What's your favorite hobby?",
  "How do you define success?",
  "What's your biggest fear?",
  "How important is financial stability?",
  "What's your ideal partner's personality?",
  "What's your life motto?"
];

// Get user's own questionnaire answers (must come BEFORE / and /:userId)
router.get('/my-answers', authenticate, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { userId: req.userId }
    });

    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    res.json(questionnaire);
  } catch (err) {
    next(err);
  }
});

// Get questionnaire
router.get('/', authenticate, async (req, res, next) => {
  try {
    const prisma = getPrisma();
    const questionnaire = await prisma.questionnaire.findUnique({
      where: { userId: req.userId }
    });

    res.json({
      questions: QUESTIONS,
      answers: questionnaire ? JSON.parse(questionnaire.answers) : null,
      completed: !!questionnaire
    });
  } catch (err) {
    next(err);
  }
});

// Get user's questionnaire by userId
router.get('/:userId', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const prisma = getPrisma();

    const questionnaire = await prisma.questionnaire.findUnique({
      where: { userId }
    });

    if (!questionnaire) {
      return res.status(404).json({ error: 'Questionnaire not found' });
    }

    res.json({
      questions: QUESTIONS,
      answers: JSON.parse(questionnaire.answers)
    });
  } catch (err) {
    next(err);
  }
});

// Extract interests from questionnaire answers
router.get('/:userId/interests', authenticate, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const prisma = getPrisma();

    // Get interests from the InterestsHobbiesQuestionnaire
    const interestsQuestionnaire = await prisma.interestsHobbiesQuestionnaire.findUnique({
      where: { userId }
    });

    if (!interestsQuestionnaire) {
      return res.json({ interests: [] });
    }

    const answers = JSON.parse(interestsQuestionnaire.answers);
    const interests = [];

    // Extract interests from all questions in the interests questionnaire
    // These are typically hobby/interest related answers
    for (let i = 1; i <= 10; i++) {
      const key = `id${i}`;
      if (answers[key]) {
        const answer = String(answers[key]).toLowerCase().trim();
        // Only add if it's a meaningful answer (not single words like "yes", "no", "maybe")
        if (answer.length > 3 && !['yes', 'no', 'maybe', 'sometimes', 'often', 'rarely'].includes(answer)) {
          interests.push(answer);
        }
      }
    }

    // Remove duplicates and limit to 4
    const uniqueInterests = [...new Set(interests)].slice(0, 4);

    res.json({ interests: uniqueInterests });
  } catch (err) {
    next(err);
  }
});

// Submit questionnaire
router.post('/submit', authenticate, async (req, res, next) => {
  try {
    const { answers } = req.body;

    if (!answers) {
      return res.status(400).json({ error: 'Answers are required' });
    }

    // Count main question answers (q1-q20)
    const mainAnswers = Object.keys(answers).filter(key => /^q\d+$/.test(key) && !key.includes('_other'));
    if (mainAnswers.length < 20) {
      return res.status(400).json({ error: 'All 20 questions must be answered' });
    }

    if (!req.userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const prisma = getPrisma();
    
    // Verify user exists first
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.questionnaire.upsert({
      where: { userId: req.userId },
      update: { answers: JSON.stringify(answers) },
      create: {
        userId: req.userId,
        answers: JSON.stringify(answers)
      }
    });

    res.json({
      success: true,
      message: 'Questionnaire submitted successfully'
    });
  } catch (err) {
    next(err);
  }
});

export default router;
