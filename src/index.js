import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { initializeSocket } from './services/socketService.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import pointsRoutes from './routes/points.js';
import adsRoutes from './routes/ads.js';
import surveysRoutes from './routes/surveys.js';
import messagesRoutes from './routes/messages.js';
import likesRoutes from './routes/likes.js';
import adminRoutes from './routes/admin.js';
import paymentsRoutes from './routes/payments.js';
import admirersRoutes from './routes/admirers.js';
import blockedRoutes from './routes/blocked.js';
import questionnaireRoutes from './routes/questionnaire.js';
import searchRoutes from './routes/search.js';
import aiPicksRoutes from './routes/aiPicks.js';
import reportsRoutes from './routes/reports.js';
import thirdPartyRoutes from './routes/thirdParty.js';
import callsRoutes from './routes/calls.js';
import profileAdvisorRoutes from './routes/profileAdvisor.js';
import tickerRoutes from './routes/ticker.js';
import adminRewardsRoutes from './routes/adminRewards.js';
import sponsorsRoutes from './routes/sponsors.js';
import referralsRoutes from './routes/referrals.js';
import conversationStartersRoutes from './routes/conversationStarters.js';
import compatibilityRoutes from './routes/compatibility.js';
import badgesRoutes from './routes/badges.js';
import typingRoutes from './routes/typing.js';
import matchesRoutes from './routes/matches.js';
import smartQueueRoutes from './routes/smartQueue.js';
import verificationRoutes from './routes/verification.js';
import introVideoRoutes from './routes/introVideo.js';
import rewardsRoutes from './routes/rewards.js';
import wellnessRoutes from './routes/wellness.js';
import outcomesRoutes from './routes/outcomes.js';
import limitsRoutes from './routes/limits.js';
import notificationsRoutes from './routes/notifications.js';
import matchExpirationRoutes from './routes/matchExpiration.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();

// Initialize Socket.io with prisma instance
initializeSocket(httpServer, prisma);

// Set prisma on global scope for routes to access
global.prisma = prisma;

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb' }));

// Routes
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

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { prisma };
