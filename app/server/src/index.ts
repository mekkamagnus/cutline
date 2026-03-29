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
import { isDatabaseHealthy } from './db/connection.js';

import { authMiddleware } from './middleware/auth.js';

const app = new Elysia()
  .use(cors())
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
  .listen(3001, () => {
    console.log('🚀 Cutline API server running on http://localhost:3001');
  });

export default app;
