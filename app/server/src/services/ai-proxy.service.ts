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
import { generateViaOpenAICompat, mockGenerate } from './openai-image.provider.js';

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
  provider: string;
  encryptedKey: string;
  createdAt: string;
  updatedAt: string;
}

function storeApiKey(userId: string, provider: string, apiKey: string): void {
  const encryptedKey = encryptApiKey(apiKey);
  const now = new Date().toISOString();

  const upsert = db.query(`
    INSERT INTO api_keys (id, user_id, provider, encrypted_key, created_at)
    VALUES ($id, $userId, $provider, $encryptedKey, $createdAt)
    ON CONFLICT(user_id, provider) DO UPDATE SET
      encrypted_key = excluded.encrypted_key
  `);

  const id = `key-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  upsert.run({
    $id: id,
    $userId: userId,
    $provider: provider,
    $encryptedKey: encryptedKey,
    $createdAt: now,
  });
}

function retrieveApiKey(userId: string, provider: string): string | null {
  const query = db.query(`
    SELECT encrypted_key FROM api_keys
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
// Real Provider Implementations
// =============================================================================

/**
 * SDXL API Client via Replicate
 * Uses the stable-diffusion-xl-base-1.0 model
 */
async function sdxlGenerate(apiKey: string, params: ImageGenerationParams): Promise<GeneratedImage> {
  const REPLICATE_API_URL = 'https://api.replicate.com/v1/predictions';

  // Build the prompt with style prefix
  const stylePrompt = params.style ? `${params.style} style storyboard, ` : '';
  const fullPrompt = `${stylePrompt}${params.prompt}`;

  // Create prediction
  const createResponse = await fetch(REPLICATE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      version: 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
      input: {
        prompt: fullPrompt,
        negative_prompt: params.negativePrompt || 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
        width: params.width || 1024,
        height: params.height || 576,
        num_inference_steps: params.steps || 30,
        seed: params.seed,
        refine: 'expert_ensemble_refiner',
        scheduler: 'KarrasDPM',
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.json() as { detail?: string };
    throw new Error(error.detail || `Replicate API error: ${createResponse.status}`);
  }

  const prediction = await createResponse.json() as {
    id: string;
    status: string;
    urls: { get: string };
  };

  // Poll for result
  let result = prediction;
  const maxAttempts = 60; // 60 * 2s = 2 minutes max
  let attempts = 0;

  while (result.status !== 'succeeded' && result.status !== 'failed' && attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusResponse = await fetch(result.urls.get, {
      headers: {
        'Authorization': `Token ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
    }

    result = await statusResponse.json() as typeof prediction & {
      output?: string[];
      error?: string;
    };
    attempts++;
  }

  if (result.status === 'failed') {
    const errorResult = result as typeof prediction & { error?: string };
    throw new Error(errorResult.error || 'Image generation failed');
  }

  if (result.status !== 'succeeded') {
    throw new Error('Image generation timed out');
  }

  const successResult = result as typeof prediction & { output: string[] };
  const imageUrl = successResult.output[0];

  if (!imageUrl) {
    throw new Error('No image URL in response');
  }

  return {
    id: `sdxl-${prediction.id}`,
    url: imageUrl,
    provider: 'sdxl',
    generatedAt: new Date().toISOString(),
    cost: 0.002, // Approximate cost per SDXL image
    params,
  };
}

/**
 * WanXiang API Client via Alibaba DashScope
 * Uses the wanx-v1 model
 */
async function wanxiangGenerate(apiKey: string, params: ImageGenerationParams): Promise<GeneratedImage> {
  const DASHSCOPE_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis';

  // Build the prompt with style prefix
  const stylePrompt = params.style ? `${params.style} style storyboard, ` : '';
  const fullPrompt = `${stylePrompt}${params.prompt}`;

  // Create synthesis task
  const createResponse = await fetch(DASHSCOPE_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'X-DashScope-Async': 'enable',
    },
    body: JSON.stringify({
      model: 'wanx-v1',
      input: {
        prompt: fullPrompt,
        negative_prompt: params.negativePrompt || '模糊, 低质量, 变形, 丑陋',
      },
      parameters: {
        style: '<storyboard>',
        size: `${params.width || 1024}*${params.height || 576}`,
        n: 1,
        seed: params.seed,
      },
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.json() as { message?: string };
    throw new Error(error.message || `DashScope API error: ${createResponse.status}`);
  }

  const task = await createResponse.json() as {
    output: { task_id: string; task_status: string };
    request_id: string;
  };

  // Poll for result
  const taskId = task.output.task_id;
  const taskStatusUrl = `${DASHSCOPE_API_URL}/${taskId}`;
  const maxAttempts = 60; // 60 * 2s = 2 minutes max
  let attempts = 0;

  let taskResult = task;
  while (
    taskResult.output.task_status !== 'SUCCEEDED' &&
    taskResult.output.task_status !== 'FAILED' &&
    attempts < maxAttempts
  ) {
    await new Promise(resolve => setTimeout(resolve, 2000));

    const statusResponse = await fetch(taskStatusUrl, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Failed to check task status: ${statusResponse.status}`);
    }

    taskResult = await statusResponse.json() as typeof task;
    attempts++;
  }

  if (taskResult.output.task_status === 'FAILED') {
    const failedResult = taskResult as typeof task & { output: { message?: string } };
    throw new Error(failedResult.output.message || 'Image generation failed');
  }

  if (taskResult.output.task_status !== 'SUCCEEDED') {
    throw new Error('Image generation timed out');
  }

  const successResult = taskResult as typeof task & {
    output: { results: Array<{ url: string }> };
  };
  const imageUrl = successResult.output.results[0]?.url;

  if (!imageUrl) {
    throw new Error('No image URL in response');
  }

  return {
    id: `wanxiang-${taskId}`,
    url: imageUrl,
    provider: 'wanxiang',
    generatedAt: new Date().toISOString(),
    cost: 0.028, // Approximate cost per WanXiang image (~¥0.20)
    params,
  };
}

// =============================================================================
// Main Service
// =============================================================================

export class AIProxyService {
  private static useRealApi = process.env.USE_REAL_AI_API === 'true';

  /**
   * Generate an image using the specified AI provider
   * API keys are retrieved server-side and never exposed to client
   * Internal implementation
   */
  private static async generateImageInternal(
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

    return this.generateImageInternal(userId, provider, params);
  }

  /**
   * Store an API key for a user (encrypted)
   */
  static storeApiKey(userId: string, provider: string, apiKey: string): ServiceResult<void> {
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
  static hasApiKey(userId: string, provider: string): boolean {
    return retrieveApiKey(userId, provider) !== null;
  }

  /**
   * Delete an API key for a user
   */
  static deleteApiKey(userId: string, provider: string): ServiceResult<void> {
    const deleteQuery = db.query(`
      DELETE FROM api_keys
      WHERE user_id = $userId AND provider = $provider
    `);

    deleteQuery.run({ $userId: userId, $provider: provider });
    return { success: true };
  }

  /**
   * Retrieve a stored API key for a provider (decrypted)
   */
  static getApiKey(userId: string, provider: string): string | null {
    return retrieveApiKey(userId, provider);
  }

  /**
   * List all provider IDs that have keys configured for a user
   */
  static listApiKeys(userId: string): Record<string, boolean> {
    const query = db.query(`
      SELECT provider FROM api_keys WHERE user_id = $userId
    `);
    const rows = query.all({ $userId: userId }) as Array<{ provider: string }>;
    const result: Record<string, boolean> = {};
    for (const row of rows) {
      result[row.provider] = true;
    }
    return result;
  }

  // =========================================================================
  // Direct Image Generation
  // =========================================================================

  /**
   * Generate an image with custom parameters
   * Public method for direct API access
   */
  static async generateImage(
    userId: string,
    provider: AIProvider,
    params: ImageGenerationParams
  ): Promise<ServiceResult<GeneratedImage>> {
    return this.generateImageInternal(userId, provider, params);
  }

  // =========================================================================
  // Dynamic Provider Generation
  // =========================================================================

  /**
   * Generate using a dynamically-configured provider (OpenAI-compatible).
   * Looks up API key from server-side storage. Falls back to mock if no key.
   */
  static async generateDynamic(
    endpoint: string,
    apiKey: string | undefined,
    model: string,
    providerName: string,
    providerId: string,
    params: ImageGenerationParams,
    costPerImage?: number,
    userId?: string,
  ): Promise<ServiceResult<GeneratedImage>> {
    if (!params.prompt || params.prompt.trim().length === 0) {
      return { success: false, error: 'Prompt is required' };
    }

    // Look up key from server storage if not provided directly
    let resolvedKey = apiKey;
    if (!resolvedKey && userId) {
      resolvedKey = retrieveApiKey(userId, providerId) ?? undefined;
    }

    const useMock = !resolvedKey;

    try {
      if (useMock) {
        const result = await mockGenerate(
          { prompt: params.prompt, model, size: `${params.width ?? 1024}x${params.height ?? 576}` },
          providerId,
          costPerImage ?? 0.01,
        );

        return {
          success: true,
          data: {
            id: result.id,
            url: result.url,
            provider: providerId,
            generatedAt: new Date().toISOString(),
            cost: result.cost,
            params,
          },
        };
      }

      const result = await generateViaOpenAICompat(
        endpoint,
        resolvedKey!,
        {
          prompt: params.prompt,
          model,
          size: `${params.width ?? 1024}x${params.height ?? 576}`,
          style: params.style,
        },
        costPerImage ?? 0.01,
        providerId,
      );

      return {
        success: true,
        data: {
          id: result.id,
          url: result.url,
          provider: providerId,
          generatedAt: new Date().toISOString(),
          cost: result.cost,
          params,
        },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: `Image generation failed: ${message}` };
    }
  }

  // =========================================================================
  // Prompt Building
  // =========================================================================

  /**
   * Build an image generation prompt from shot data
   */
  static buildShotPrompt(shot: DBShot, style: string): string {
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
