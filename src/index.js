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

// Load environment variables
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.join(__dirname, '..', envFile);
console.log('[STARTUP] Loading env file:', envPath);
dotenv.config({ path: envPath });

console.log('[STARTUP] After dotenv - NODE_ENV:', process.env.NODE_ENV);
console.log('[STARTUP] After dotenv - DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('[STARTUP] DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 30));

const app = express();
const httpServer = createServer(app);

let prisma;
try {
  prisma = new PrismaClient();
  console.log('[STARTUP] Prisma client initialized successfully');
} catch (err) {
  console.error('[STARTUP] Failed to initialize Prisma:', err.message);
  throw err;
}

// Make prisma available globally for routes
global.prisma = prisma;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
try {
  app.use('/api/auth', authRoutes);
} catch (err) {
  console.error('[STARTUP] Failed to load auth routes:', err.message);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found', path: req.path });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
