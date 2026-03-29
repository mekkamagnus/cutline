/**
 * Authentication Routes
 *
 * Handles user signup and login.
 */
import { Elysia, t } from 'elysia';
import { AuthService } from '../services/auth.service.js';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .post(
    '/signup',
    async ({ body }) => {
      const { email, password } = body as { email: string; password: string };

      // Validate email format
      if (!email.includes('@')) {
        throw new Error('Invalid email format');
      }

      // Validate password length
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const result = await AuthService.signup(email, password);
      return result;
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String({ minLength: 8 }),
      }),
    }
  )
  .post(
    '/login',
    async ({ body }) => {
      const { email, password } = body as { email: string; password: string };
      const result = await AuthService.login(email, password);
      return result;
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  );
