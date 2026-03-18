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
import optionalQuestionnairesRoutes from './routes/optionalQuestionnaires.js';
import lifestylePreferencesRoutes from './routes/lifestylePreferences.js';
import boostsRoutes from './routes/boosts.js';
import preferencesRoutes from './routes/preferences.js';
import easyWinsRoutes from './routes/easyWins.js';
import achievementsRoutes from './routes/achievements.js';
import activityFeedRoutes from './routes/activityFeed.js';
import discussionsRoutes from './routes/discussions.js';
import eventsRoutes from './routes/events.js';
import emailNotificationsRoutes from './routes/emailNotifications.js';
import { errorHandler } from './middleware/errorHandler.js';
import { initializeBackupScheduler } from './services/backupService.js';
import { startDailyCleanup } from './utils/eventCleanup.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.development first if it exists, then .env (production overrides)
const devEnvPath = `${__dirname}/../.env.development`;
if (fs.existsSync(devEnvPath)) {
  dotenv.config({ path: devEnvPath, override: true });
}
dotenv.config({ path: `${__dirname}/../.env` });

const app = express();
const httpServer = createServer(app);

// Initialize Prisma - will connect on first query
let prisma;
try {
  prisma = new PrismaClient({
    errorFormat: 'pretty',
  });
  console.log('Prisma initialized successfully');
} catch (err) {
  console.error('Prisma initialization error:', err.message);
  prisma = null;
}

// Initialize Socket.io with prisma instance if available
if (prisma) {
  try {
    initializeSocket(httpServer, prisma);
    global.prisma = prisma;
  } catch (err) {
    console.error('Socket.io initialization error:', err.message);
  }
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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
app.use('/api/optional-questionnaires', optionalQuestionnairesRoutes);
app.use('/api/lifestyle-preferences', lifestylePreferencesRoutes);
app.use('/api/boosts', boostsRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/easy-wins', easyWinsRoutes);
app.use('/api/achievements', achievementsRoutes);
app.use('/api/activity-feed', activityFeedRoutes);
app.use('/api/discussions', discussionsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/email-notifications', emailNotificationsRoutes);

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const server = httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize backup scheduler
  initializeBackupScheduler();
  
  // Initialize daily event cleanup
  startDailyCleanup();
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
});

export { prisma };
