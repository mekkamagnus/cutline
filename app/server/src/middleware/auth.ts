/**
 * Authentication Middleware
 *
 * Verifies JWT tokens and adds user context to requests.
 */
import { Elysia } from 'elysia';
import { AuthService } from '../services/auth.service.js';

export interface AuthUser {
  userId: string;
  email: string;
}

export const authMiddleware = new Elysia({ name: 'auth' })
  .derive(async ({ request }: { request: Request }) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: undefined as AuthUser | undefined };
    }

    const token = authHeader.slice(7);

    try {
      const payload = await AuthService.verifyToken(token);
      return { user: payload };
    } catch {
      return { user: undefined as AuthUser | undefined };
    }
  })
  .onBeforeHandle(({ user, path }: { user?: AuthUser; path: string }) => {
    // Skip auth for public routes
    const publicPaths = ['/health', '/', '/auth/signup', '/auth/login', '/swagger', '/api-docs'];
    if (publicPaths.some(p => path === p || path.startsWith(p + '/'))) {
      return;
    }

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });
