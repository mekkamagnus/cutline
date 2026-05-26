/**
 * Cutline Server - Main Entry Point
 *
 * Elysia server with SQLite backend for the Cutline PWA.
 */
import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { projectRoutes } from './routes/projects.js';
import { shotRoutes } from './routes/shots.js';
import { syncRoutes } from './routes/sync.js';
import { authRoutes } from './routes/auth.js';
import { aiRoutes } from './routes/ai.js';
import { storyboardRoutes } from './routes/storyboards.js';
import { isDatabaseHealthy } from './db/connection.js';

import { authMiddleware } from './middleware/auth.js';

const PORT = Number(process.env.PORT || 3011);
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5175',
  'http://127.0.0.1:5175',
  ...(process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : []),
];

const app = new Elysia()
  .use(cors({
    origin: (request) => {
      const origin = request.headers.get('origin');
      return !origin || allowedOrigins.includes(origin);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }))
  .use(swagger({
    documentation: {
      info: {
        title: 'Cutline API',
        version: '0.2.0',
        description: 'Script to video platform API with shot-list-first paradigm',
      },
    },
  }))
  .get('/', () => ({
    name: 'Cutline API',
    version: '0.2.0',
    status: 'healthy',
    database: isDatabaseHealthy(),
  }))
  // Auth routes (no authentication required)
  .use(authRoutes)
  // Protected routes (require authentication)
  .use(authMiddleware)
  .use(projectRoutes)
  .use(shotRoutes)
  .use(syncRoutes)
  .use(aiRoutes)
  .use(storyboardRoutes)
  .onError(({ error }) => {
    // Handle paradigm gate errors
    if (error instanceof Error) {
      const message = error.message;
      if (message.includes('Cannot') && message.includes('confirmed')) {
        return {
          error: 'PARADIGM_VIOLATION',
          message: message,
        };
      }
    }
    return {
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  })
  .listen(PORT, ({ port }) => {
    console.log(`🚀 Cutline API server running on http://localhost:${port}`);
  });

export default app;
