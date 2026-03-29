/**
 * Authentication Service
 *
 * Handles user authentication with JWT tokens.
 */
import { SignJWT, jwtVerify } from 'jose';
import { hash, compare } from 'bcrypt';
import { db } from '../db/connection.js';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'development-secret-change-in-production'
);

export interface User {
  id: string;
  email: string;
  createdAt: Date;
}

export class AuthService {
  static async signup(email: string, password: string): Promise<{ token: string; user: User }> {
    // Check if user exists
    const existing = db.query('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      throw new Error('Email already exists');
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Create user
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.run(
      'INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, email, passwordHash, now, now]
    );

    // Generate token
    const token = await this.generateToken(id, email);

    return {
      token,
      user: { id, email, createdAt: new Date(now) },
    };
  }

  static async login(email: string, password: string): Promise<{ token: string; user: User }> {
    // Find user
    const row = db.query('SELECT * FROM users WHERE email = ?').get(email) as {
      id: string;
      email: string;
      password_hash: string;
      created_at: string;
    } | undefined;

    if (!row) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await compare(password, row.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Generate token
    const token = await this.generateToken(row.id, row.email);

    return {
      token,
      user: { id: row.id, email: row.email, createdAt: new Date(row.created_at) },
    };
  }

  private static async generateToken(userId: string, email: string): Promise<string> {
    return await new SignJWT({ userId, email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET);
  }

  static async verifyToken(token: string): Promise<{ userId: string; email: string }> {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
    };
  }
}
