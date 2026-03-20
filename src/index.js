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

let prisma;
try {
  console.log('[STARTUP] Creating Prisma client...');
  console.log('[STARTUP] DATABASE_URL being used:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  prisma = new PrismaClient({
    log: ['error', 'warn'],
    errorFormat: 'pretty',
  });
  console.log('[STARTUP] Prisma client created successfully');
  global.prisma = prisma;
  
  // Test connection immediately
  prisma.$queryRaw`SELECT 1`.then(() => {
    console.log('[STARTUP] MongoDB connection test: SUCCESS');
  }).catch(err => {
    console.error('[STARTUP] MongoDB connection test FAILED:', err.message);
  });
} catch (err) {
  console.error('[STARTUP] Failed to create Prisma client:', err.message);
  console.error('[STARTUP] Error details:', err);
  process.exit(1);
}

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
  console.log('[SHUTDOWN] SIGTERM received');
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});
