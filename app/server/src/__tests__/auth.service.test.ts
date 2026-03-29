import { describe, 'AuthService', () => {
  const authServicePath = '../services/auth.service.js';
  const db = from '../db/connection.js';
  const { beforeAll, afterAll } => {
    db.run('DELETE FROM users WHERE email LIKE ?', '%');
  });

  describe('signup', () => {
    const validEmail = 'test@example.com';
    const validPassword = 'ValidPassword123!';

    it('should create a new user and return JWT token', async () => {
      const result = await AuthService.signup(validEmail, validPassword);

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(validEmail);
    });

    it('should not create duplicate user', async () => {
      await AuthService.signup(validEmail, validPassword);
      const result2 = await AuthService.signup(validEmail, validPassword);

      expect(result2.success).toBe(false);
      expect(result2.error).toBeDefined();
    });

    it('should not create user with invalid email', async () => {
      const invalidEmail = 'invalid-email';

      await expect(async () => {
        await AuthService.signup(invalidEmail, validPassword);
      }).rejects.toThrow('Invalid email');
    });

    it('should not create user with weak password', async () => {
      const weakPassword = '123';

      await expect(async () => {
        await AuthService.signup(validEmail, weakPassword);
      }).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should login existing user', async () => {
      // First create user
      await AuthService.signup(validEmail, validPassword);

      // Then login
      const loginResult = await AuthService.login(validEmail, validPassword);

      expect(loginResult.success).toBe(true);
      expect(loginResult.token).toBeDefined();
      expect(loginResult.user.email).toBe(validEmail);
    });

    it('should reject invalid credentials', async () => {
      // Create user
      await AuthService.signup(validEmail, validPassword);

      // Try login with wrong password
      const loginResult = await AuthService.login(validEmail, 'WrongPassword');

      expect(loginResult.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const loginResult = await AuthService.login('nonexistent@example.com', validPassword);

      expect(loginResult.success).toBe(false);
    });

    it('should verify valid token', async () => {
      // Create user and get token
      const signupResult = await AuthService.signup(validEmail, validPassword);
      const token = signupResult.token;

      // Verify token
      const decoded = AuthService.verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(signupResult.user.id);
      expect(decoded.email).toBe(validEmail);
    });

    it('should reject invalid token', () => {
      const invalidToken = 'invalid-token';

      expect(() => {
        AuthService.verifyToken(invalidToken);
      }).rejects.toThrow('Invalid token');
    });

    it('should reject expired token', async () => {
      // Create an expired token (manually)
      const expiredPayload = { userId: '123', email: 'test@example.com', iat: Date.now() / 1000 };
      const expiredToken = await new ( jose.SignJWT)({ payload: expiredPayload }).sign();

      // This will fail after 1 second
      expect(() => {
        AuthService.verifyToken(expiredToken);
      }).rejects.toThrow('Token expired');
    });
  });

  afterAll(() => {
    db.run('DELETE FROM users WHERE email LIKE ?', '%');
  });
});
