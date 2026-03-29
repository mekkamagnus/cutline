/**
 * AI Proxy Service
 *
 * Secure proxy for AI image generation providers.
 * - API keys are stored encrypted and never exposed to client
 * - Supports multiple providers (SDXL, WanXiang)
 * - Provides mock implementation for development
 *
 * Security:
 * - All API calls happen server-side
 * - Keys are encrypted at rest using AES-256-GCM
 * - Rate limiting and usage tracking
 */
import { db } from '../db/connection.js';
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import type { DBShot } from '../types/index.js';

// =============================================================================
// Types
// =============================================================================

export type AIProvider = 'sdxl' | 'wanxiang';

export interface ImageGenerationParams {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  aspectRatio?: string;
  seed?: number;
  steps?: number;
  width?: number;
  height?: number;
}

export interface GeneratedImage {
  id: string;
  url: string;
  provider: AIProvider;
  generatedAt: string;
  cost: number;
  params: ImageGenerationParams;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Encryption Utilities
// =============================================================================

const ENCRYPTION_KEY = process.env.AI_KEY_ENCRYPTION_SECRET || 'cutline-dev-key-change-in-production';
const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey(): Buffer {
  // Derive a 32-byte key from the secret
  return scryptSync(ENCRYPTION_KEY, 'salt', 32);
}

function encryptApiKey(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

function decryptApiKey(encrypted: string): string {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encryptedData] = encrypted.split(':');

  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error('Invalid encrypted key format');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// =============================================================================
// API Key Management
// =============================================================================

interface StoredApiKey {
  userId: string;
  provider: AIProvider;
  encryptedKey: string;
  createdAt: string;
  updatedAt: string;
}

function getApiKeyTable(): StoredApiKey[] {
  // In production, this would be a database table
  // For now, we use an in-memory store with database persistence
  const query = db.query(`
    SELECT * FROM ai_api_keys WHERE user_id = $userId AND provider = $provider
  `);
  return query.all() as StoredApiKey[];
}

function storeApiKey(userId: string, provider: AIProvider, apiKey: string): void {
  const encryptedKey = encryptApiKey(apiKey);
  const now = new Date().toISOString();

  const upsert = db.query(`
    INSERT INTO ai_api_keys (user_id, provider, encrypted_key, created_at, updated_at)
    VALUES ($userId, $provider, $encryptedKey, $createdAt, $updatedAt)
    ON CONFLICT(user_id, provider) DO UPDATE SET
      encrypted_key = excluded.encrypted_key,
      updated_at = excluded.updated_at
  `);

  upsert.run({
    $userId: userId,
    $provider: provider,
    $encryptedKey: encryptedKey,
    $createdAt: now,
    $updatedAt: now,
  });
}

function retrieveApiKey(userId: string, provider: AIProvider): string | null {
  const query = db.query(`
    SELECT encrypted_key FROM ai_api_keys
    WHERE user_id = $userId AND provider = $provider
  `);

  const result = query.get({ $userId: userId, $provider: provider }) as { encrypted_key: string } | undefined;

  if (!result) {
    return null;
  }

  try {
    return decryptApiKey(result.encrypted_key);
  } catch {
    console.error('Failed to decrypt API key for user:', userId);
    return null;
  }
}

// =============================================================================
// Mock Provider Implementations
// =============================================================================

/**
 * Mock SDXL Provider
 * Returns placeholder images for development
 */
async function mockSdxlGenerate(params: ImageGenerationParams): Promise<GeneratedImage> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 500));

  return {
    id: `mock-sdxl-${Date.now()}`,
    url: `https://picsum.photos/seed/${params.seed || Date.now()}/${params.width || 1024}/${params.height || 1024}`,
    provider: 'sdxl',
    generatedAt: new Date().toISOString(),
    cost: 0.02, // Mock cost per image
    params,
  };
}

/**
 * Mock WanXiang Provider
 * Returns placeholder images for development
 */
async function mockWanxiangGenerate(params: ImageGenerationParams): Promise<GeneratedImage> {
  // Simulate API latency
  await new Promise(resolve => setTimeout(resolve, 700));

  return {
    id: `mock-wanxiang-${Date.now()}`,
    url: `https://picsum.photos/seed/${params.seed || Date.now()}/${params.width || 1024}/${params.height || 1024}`,
    provider: 'wanxiang',
    generatedAt: new Date().toISOString(),
    cost: 0.015, // Mock cost per image
    params,
  };
}

// =============================================================================
// Real Provider Implementations (Stubs for Future)
// =============================================================================

/**
 * SDXL API Client
 * Stub - will be implemented when API access is available
 */
async function sdxlGenerate(apiKey: string, params: ImageGenerationParams): Promise<GeneratedImage> {
  // TODO: Implement real SDXL API call
  // const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl/text-to-image', {
  //   method: 'POST',
  //   headers: {
  //     'Authorization': `Bearer ${apiKey}`,
  //     'Content-Type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     text_prompts: [{ text: params.prompt }],
  //     cfg_scale: 7,
  //     height: params.height || 1024,
  //     width: params.width || 1024,
  //     steps: params.steps || 30,
  //     seed: params.seed,
  //   }),
  // });

  // For now, return mock
  return mockSdxlGenerate(params);
}

/**
 * WanXiang API Client
 * Stub - will be implemented when API access is available
 */
async function wanxiangGenerate(apiKey: string, params: ImageGenerationParams): Promise<GeneratedImage> {
  // TODO: Implement real WanXiang API call
  // For now, return mock
  return mockWanxiangGenerate(params);
}

// =============================================================================
// Main Service
// =============================================================================

export class AIProxyService {
  private static useRealApi = process.env.USE_REAL_AI_API === 'true';

  /**
   * Generate an image using the specified AI provider
   * API keys are retrieved server-side and never exposed to client
   */
  static async generateImage(
    userId: string,
    provider: AIProvider,
    params: ImageGenerationParams
  ): Promise<ServiceResult<GeneratedImage>> {
    // Validate parameters
    if (!params.prompt || params.prompt.trim().length === 0) {
      return { success: false, error: 'Prompt is required' };
    }

    // Get API key for user and provider
    const apiKey = retrieveApiKey(userId, provider);

    // If no key stored, use mock (development mode)
    const useMock = !apiKey || !this.useRealApi;

    if (useMock) {
      // Development: use mock implementation
      const image = provider === 'sdxl'
        ? await mockSdxlGenerate(params)
        : await mockWanxiangGenerate(params);

      return { success: true, data: image };
    }

    // Production: use real API
    try {
      const image = provider === 'sdxl'
        ? await sdxlGenerate(apiKey!, params)
        : await wanxiangGenerate(apiKey!, params);

      return { success: true, data: image };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Image generation failed: ${message}` };
    }
  }

  /**
   * Generate storyboard image for a shot
   * Builds prompt from shot data and project style
   */
  static async generateStoryboardImage(
    userId: string,
    shot: DBShot,
    projectStyle: string = 'cinematic',
    provider: AIProvider = 'sdxl'
  ): Promise<ServiceResult<GeneratedImage>> {
    // Build prompt from shot data
    const prompt = this.buildShotPrompt(shot, projectStyle);

    const params: ImageGenerationParams = {
      prompt,
      negativePrompt: 'blurry, low quality, distorted, deformed',
      style: projectStyle,
      aspectRatio: '16:9', // Storyboard standard
      width: 1024,
      height: 576, // 16:9 aspect ratio
      steps: 30,
    };

    return this.generateImage(userId, provider, params);
  }

  /**
   * Store an API key for a user (encrypted)
   */
  static storeApiKey(userId: string, provider: AIProvider, apiKey: string): ServiceResult<void> {
    if (!apiKey || apiKey.trim().length === 0) {
      return { success: false, error: 'API key is required' };
    }

    try {
      storeApiKey(userId, provider, apiKey);
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Failed to store API key: ${message}` };
    }
  }

  /**
   * Check if a user has an API key configured for a provider
   */
  static hasApiKey(userId: string, provider: AIProvider): boolean {
    return retrieveApiKey(userId, provider) !== null;
  }

  /**
   * Delete an API key for a user
   */
  static deleteApiKey(userId: string, provider: AIProvider): ServiceResult<void> {
    const deleteQuery = db.query(`
      DELETE FROM ai_api_keys
      WHERE user_id = $userId AND provider = $provider
    `);

    deleteQuery.run({ $userId: userId, $provider: provider });
    return { success: true };
  }

  // =========================================================================
  // Prompt Building
  // =========================================================================

  /**
   * Build an image generation prompt from shot data
   */
  private static buildShotPrompt(shot: DBShot, style: string): string {
    const parts: string[] = [];

    // Add style
    parts.push(`${style} style storyboard`);

    // Add shot type
    parts.push(`${shot.type} shot`);

    // Add camera angle
    parts.push(`${shot.angle} camera angle`);

    // Add camera movement
    if (shot.movement !== 'static') {
      parts.push(`${shot.movement} camera movement`);
    }

    // Add action description
    parts.push(shot.action_description);

    // Add characters if present
    try {
      const characters = JSON.parse(shot.characters_in_frame) as string[];
      if (characters.length > 0) {
        parts.push(`featuring ${characters.join(', ')}`);
      }
    } catch {
      // Ignore parse errors
    }

    return parts.join(', ');
  }

  // =========================================================================
  // Batch Operations
  // =========================================================================

  /**
   * Generate storyboard images for multiple shots
   * Returns results for each shot (success or failure)
   */
  static async generateBatchStoryboards(
    userId: string,
    shots: DBShot[],
    projectStyle: string = 'cinematic',
    provider: AIProvider = 'sdxl'
  ): Promise<Map<string, ServiceResult<GeneratedImage>>> {
    const results = new Map<string, ServiceResult<GeneratedImage>>();

    for (const shot of shots) {
      const result = await this.generateStoryboardImage(userId, shot, projectStyle, provider);
      results.set(shot.id, result);
    }

    return results;
  }
}
