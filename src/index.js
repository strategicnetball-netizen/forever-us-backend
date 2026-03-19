import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('[STARTUP] Initial NODE_ENV:', process.env.NODE_ENV);
console.log('[STARTUP] Initial DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

// Load environment variables only if not in production or if .env file exists
if (process.env.NODE_ENV !== 'production') {
  const envFile = '.env';
  const envPath = path.join(__dirname, '..', envFile);
  console.log('[STARTUP] Loading env file:', envPath);
  dotenv.config({ path: envPath });
} else {
  console.log('[STARTUP] Running in production - using environment variables');
}

console.log('[STARTUP] After dotenv - NODE_ENV:', process.env.NODE_ENV);
console.log('[STARTUP] After dotenv - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('[STARTUP] DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 30));
console.log('[STARTUP] JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');

const app = express();
const httpServer = createServer(app);

let prisma;
try {
  prisma = new PrismaClient({
    log: ['error', 'warn'],
  });
  console.log('[STARTUP] Prisma client created successfully');
} catch (err) {
  console.error('[STARTUP] Failed to create Prisma client:', err.message);
  console.error('[STARTUP] Error details:', err);
  process.exit(1);
}

// Make prisma available globally for routes
global.prisma = prisma;

app.use(cors());
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

httpServer.listen(PORT, () => {
  console.log(`[STARTUP] Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[SHUTDOWN] SIGTERM received, disconnecting Prisma...');
  await prisma.$disconnect();
  process.exit(0);
});
