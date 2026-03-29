/**
 * Cutline Server - Shared Type Definitions
 *
 * These types are shared between server and client (via API contracts).
 * They mirror the client types but are are defined here for server validation.
 */

// ============================================================================
// Authentication Types (Phase 1.5)
// ============================================================================

export interface DBUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface DBApiKey {
  id: string;
  user_id: string;
  provider: string;
  encrypted_key: string;
  created_at: string;
}

// ============================================================================
// Authentication Request/Response Types
// ============================================================================

export interface SignupRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  createdAt: string;
  };
}

// ============================================================================
// JWT Payload
// ============================================================================

export interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
}

// ============================================================================
// Extend existing types with auth-related fields
// ============================================================================

// Update DBProject to include user_id
export interface DBProject {
  id: string;
  user_id: string;
  name: string;
  visual_style: string;
  color_palette: string; // JSON array
  tone: string;
  created_at: string;
  updated_at: string;
}
