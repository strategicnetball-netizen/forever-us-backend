import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from '../src/routes/auth.js';
import userRoutes from '../src/routes/users.js';
import pointsRoutes from '../src/routes/points.js';
import adsRoutes from '../src/routes/ads.js';
import surveysRoutes from '../src/routes/surveys.js';
import messagesRoutes from '../src/routes/messages.js';
import likesRoutes from '../src/routes/likes.js';
import adminRoutes from '../src/routes/admin.js';
import paymentsRoutes from '../src/routes/payments.js';
import admirersRoutes from '../src/routes/admirers.js';
import blockedRoutes from '../src/routes/blocked.js';
import questionnaireRoutes from '../src/routes/questionnaire.js';
import searchRoutes from '../src/routes/search.js';
import aiPicksRoutes from '../src/routes/aiPicks.js';
import reportsRoutes from '../src/routes/reports.js';
import thirdPartyRoutes from '../src/routes/thirdParty.js';
import callsRoutes from '../src/routes/calls.js';
import profileAdvisorRoutes from '../src/routes/profileAdvisor.js';
import tickerRoutes from '../src/routes/ticker.js';
import adminRewardsRoutes from '../src/routes/adminRewards.js';
import sponsorsRoutes from '../src/routes/sponsors.js';
import referralsRoutes from '../src/routes/referrals.js';
import conversationStartersRoutes from '../src/routes/conversationStarters.js';
import compatibilityRoutes from '../src/routes/compatibility.js';
import badgesRoutes from '../src/routes/badges.js';
import typingRoutes from '../src/routes/typing.js';
import matchesRoutes from '../src/routes/matches.js';
import smartQueueRoutes from '../src/routes/smartQueue.js';
import verificationRoutes from '../src/routes/verification.js';
import introVideoRoutes from '../src/routes/introVideo.js';
import rewardsRoutes from '../src/routes/rewards.js';
import wellnessRoutes from '../src/routes/wellness.js';
import outcomesRoutes from '../src/routes/outcomes.js';
import limitsRoutes from '../src/routes/limits.js';
import notificationsRoutes from '../src/routes/notifications.js';
import matchExpirationRoutes from '../src/routes/matchExpiration.js';
import { errorHandler } from '../src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const prisma = new PrismaClient();

global.prisma = prisma;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/points', pointsRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api/surveys', surveysRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/likes', likesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/admirers', admirersRoutes);
app.use('/api/blocked', blockedRoutes);
app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/ai-picks', aiPicksRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/third-party', thirdPartyRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/profile-advisor', profileAdvisorRoutes);
app.use('/api/ticker', tickerRoutes);
app.use('/api/admin-rewards', adminRewardsRoutes);
app.use('/api/sponsors', sponsorsRoutes);
app.use('/api/referrals', referralsRoutes);
app.use('/api/conversation-starters', conversationStartersRoutes);
app.use('/api/compatibility', compatibilityRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/typing', typingRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/smart-queue', smartQueueRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/intro-video', introVideoRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/outcomes', outcomesRoutes);
app.use('/api/limits', limitsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/match-expiration', matchExpirationRoutes);

app.use(errorHandler);

export default app;
