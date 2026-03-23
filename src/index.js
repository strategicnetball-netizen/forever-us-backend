import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import pointsRoutes from './routes/points.js';
import likesRoutes from './routes/likes.js';
import messagesRoutes from './routes/messages.js';
import admirersRoutes from './routes/admirers.js';
import matchesRoutes from './routes/matches.js';
import aiPicksRoutes from './routes/aiPicks.js';
import usersRoutes from './routes/users.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('[STARTUP] Initial NODE_ENV:', process.env.NODE_ENV);
console.log('[STARTUP] Initial DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Load environment variables only if not in production
if (process.env.NODE_ENV !== 'production') {
  const envFile = '.env';
  const envPath = path.join(__dirname, '..', envFile);
  console.log('[STARTUP] Loading env file:', envPath);
  dotenv.config({ path: envPath });
}

console.log('[STARTUP] After dotenv - NODE_ENV:', process.env.NODE_ENV);
console.log('[STARTUP] After dotenv - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('[STARTUP] JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

// Log the cluster name from DATABASE_URL to verify it's correct
if (process.env.DATABASE_URL) {
  const dbUrl = process.env.DATABASE_URL;
  const clusterMatch = dbUrl.match(/@([^.]+)/);
  const cluster = clusterMatch ? clusterMatch[1] : 'unknown';
  console.log('[STARTUP] MongoDB Cluster:', cluster);
}

const app = express();
const httpServer = createServer(app);

// Initialize Prisma and attach to global scope
const prisma = new PrismaClient();
global.prisma = prisma;

app.use(cors({
  origin: [
    'https://forever-us-frontend-ten.vercel.app',
    'https://forever-us-frontend-e4p2e3imi-foreverus-dating.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Forever Us Dating App API', version: '1.0.0', status: 'running' });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
console.log('[STARTUP] Loading auth routes...');
app.use('/api/auth', authRoutes);
console.log('[STARTUP] Auth routes loaded successfully');

console.log('[STARTUP] Loading points routes...');
app.use('/api/points', pointsRoutes);
console.log('[STARTUP] Points routes loaded successfully');

console.log('[STARTUP] Loading likes routes...');
app.use('/api/likes', likesRoutes);
console.log('[STARTUP] Likes routes loaded successfully');

console.log('[STARTUP] Loading messages routes...');
app.use('/api/messages', messagesRoutes);
console.log('[STARTUP] Messages routes loaded successfully');

console.log('[STARTUP] Loading admirers routes...');
app.use('/api/admirers', admirersRoutes);
console.log('[STARTUP] Admirers routes loaded successfully');

console.log('[STARTUP] Loading matches routes...');
app.use('/api/matches', matchesRoutes);
console.log('[STARTUP] Matches routes loaded successfully');

console.log('[STARTUP] Loading AI picks routes...');
app.use('/api/ai-picks', aiPicksRoutes);
console.log('[STARTUP] AI picks routes loaded successfully');

console.log('[STARTUP] Loading users routes...');
app.use('/api/users', usersRoutes);
console.log('[STARTUP] Users routes loaded successfully');

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  console.error('[ERROR] Stack:', err.stack);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message,
    type: err.constructor.name
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`[STARTUP] Server running on port ${PORT}`);
  console.log(`[STARTUP] Listening on 0.0.0.0:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[SHUTDOWN] SIGTERM received');
  if (global.prisma) {
    await global.prisma.$disconnect();
  }
  process.exit(0);
});
