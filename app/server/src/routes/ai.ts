/**
 * AI Proxy Routes
 *
 * Secure routes for AI image generation.
 * - API keys are stored encrypted and never exposed to client
 * - Supports multiple providers (SDXL, WanXiang)
 * - Provides cost tracking and usage statistics
 *
 * All routes require authentication.
 */
import { Elysia, t } from 'elysia';
import { AIProxyService, type AIProvider, type ImageGenerationParams } from '../services/ai-proxy.service.js';
import { ShotService } from '../services/shot-service.js';
import { db } from '../db/connection.js';

// Types for route bodies
interface GenerateStoryboardBody {
  shotIds: string[];
  style?: string;
  provider?: AIProvider;
}

interface StoreApiKeyBody {
  provider: AIProvider;
  apiKey: string;
}

interface GenerateSingleBody {
  shotId: string;
  style?: string;
  provider?: AIProvider;
  refinementPrompt?: string;
}

export const aiRoutes = new Elysia({ prefix: '/api/ai' })
  // ========== API KEY MANAGEMENT ==========

  // Store an API key for the current user
  .post('/keys', ({ body, userId }: { body: StoreApiKeyBody; userId: string }) => {
    const result = AIProxyService.storeApiKey(userId, body.provider, body.apiKey);
    if (!result.success) {
      throw new Error(result.error);
    }
    return { success: true, message: `API key stored for ${body.provider}` };
  }, {
    body: t.Object({
      provider: t.Union([t.Literal('sdxl'), t.Literal('wanxiang')]),
      apiKey: t.String({ minLength: 1 }),
    }),
  })

  // Check if user has API keys configured
  .get('/keys', ({ userId }: { userId: string }) => {
    return {
      sdxl: AIProxyService.hasApiKey(userId, 'sdxl'),
      wanxiang: AIProxyService.hasApiKey(userId, 'wanxiang'),
    };
  })

  // Delete an API key
  .delete('/keys/:provider', ({ params, userId }: { params: { provider: AIProvider }; userId: string }) => {
    const result = AIProxyService.deleteApiKey(userId, params.provider);
    if (!result.success) {
      throw new Error(result.error);
    }
    return { success: true };
  })

  // ========== STORYBOARD GENERATION ==========

  // Generate storyboards for multiple shots
  .post('/generate/storyboards', async ({ body, userId }: { body: GenerateStoryboardBody; userId: string }) => {
    const { shotIds, style = 'cinematic', provider = 'sdxl' } = body;

    if (!shotIds || shotIds.length === 0) {
      throw new Error('No shots provided');
    }

    // Fetch shots from database
    const shots = [];
    for (const shotId of shotIds) {
      const shot = ShotService.findById(shotId);
      if (shot) {
        // PARADIGM GATE: Only generate for confirmed shots
        if (!shot.confirmed) {
          throw new Error(`Shot ${shotId} is not confirmed. Cannot generate storyboard.`);
        }
        shots.push(shot);
      }
    }

    if (shots.length === 0) {
      throw new Error('No valid shots found');
    }

    // Generate storyboards
    const results = await AIProxyService.generateBatchStoryboards(userId, shots, style, provider);

    // Store results in database and return
    const storyboards = [];
    for (const [shotId, result] of results) {
      if (result.success && result.data) {
        // Store in storyboards table
        const id = `sb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const insert = db.query(`
          INSERT INTO storyboards (id, shot_id, image_url, generation_params, api_provider, cost, style)
          VALUES ($id, $shotId, $imageUrl, $params, $provider, $cost, $style)
        `);

        insert.run({
          $id: id,
          $shotId: shotId,
          $imageUrl: result.data.url,
          $params: JSON.stringify(result.data.params),
          $provider: result.data.provider,
          $cost: result.data.cost,
          $style: style,
        });

        storyboards.push({
          id,
          shotId,
          imageUrl: result.data.url,
          cost: result.data.cost,
          provider: result.data.provider,
        });
      }
    }

    return {
      success: true,
      generated: storyboards.length,
      totalCost: storyboards.reduce((sum, s) => sum + s.cost, 0),
      storyboards,
    };
  }, {
    body: t.Object({
      shotIds: t.Array(t.String()),
      style: t.Optional(t.String()),
      provider: t.Optional(t.Union([t.Literal('sdxl'), t.Literal('wanxiang')])),
    }),
  })

  // Generate single storyboard for a shot
  .post('/generate/single', async ({ body, userId }: { body: GenerateSingleBody; userId: string }) => {
    const { shotId, style = 'cinematic', provider = 'sdxl', refinementPrompt } = body;

    // Fetch shot
    const shot = ShotService.findById(shotId);
    if (!shot) {
      throw new Error('Shot not found');
    }

    // PARADIGM GATE: Only generate for confirmed shots
    if (!shot.confirmed) {
      throw new Error('Shot is not confirmed. Cannot generate storyboard.');
    }

    // Build params with optional refinement
    const params: ImageGenerationParams = {
      prompt: refinementPrompt || AIProxyService['buildShotPrompt'](shot, style),
      negativePrompt: 'blurry, low quality, distorted, deformed',
      style,
      aspectRatio: '16:9',
      width: 1024,
      height: 576,
      steps: 30,
    };

    // Generate
    const result = await AIProxyService.generateImage(userId, provider, params);
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Generation failed');
    }

    // Store in database
    const id = `sb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const insert = db.query(`
      INSERT INTO storyboards (id, shot_id, image_url, generation_params, api_provider, cost, style, refinement_prompt)
      VALUES ($id, $shotId, $imageUrl, $params, $provider, $cost, $style, $refinementPrompt)
    `);

    insert.run({
      $id: id,
      $shotId: shotId,
      $imageUrl: result.data.url,
      $params: JSON.stringify(result.data.params),
      $provider: result.data.provider,
      $cost: result.data.cost,
      $style: style,
      $refinementPrompt: refinementPrompt || null,
    });

    return {
      id,
      shotId,
      imageUrl: result.data.url,
      cost: result.data.cost,
      provider: result.data.provider,
    };
  }, {
    body: t.Object({
      shotId: t.String(),
      style: t.Optional(t.String()),
      provider: t.Optional(t.Union([t.Literal('sdxl'), t.Literal('wanxiang')])),
      refinementPrompt: t.Optional(t.String()),
    }),
  })

  // ========== COST TRACKING ==========

  // Get total cost for a project
  .get('/costs/project/:projectId', ({ params, userId }: { params: { projectId: string }; userId: string }) => {
    const query = db.query(`
      SELECT SUM(s.cost) as total_cost, COUNT(s.id) as total_panels
      FROM storyboards s
      JOIN shots sh ON s.shot_id = sh.id
      JOIN scenes sc ON sh.scene_id = sc.id
      JOIN scripts scr ON sc.script_id = scr.id
      WHERE scr.project_id = $projectId
    `);

    const result = query.get({ $projectId: params.projectId }) as { total_cost: number | null; total_panels: number } | undefined;

    return {
      totalCost: result?.total_cost || 0,
      totalPanels: result?.total_panels || 0,
    };
  })

  // Get cost breakdown by provider
  .get('/costs/breakdown', ({ userId }: { userId: string }) => {
    const query = db.query(`
      SELECT api_provider, SUM(cost) as total_cost, COUNT(*) as count
      FROM storyboards
      GROUP BY api_provider
    `);

    const results = query.all() as Array<{ api_provider: string; total_cost: number; count: number }>;

    return {
      providers: results.map(r => ({
        provider: r.api_provider,
        totalCost: r.total_cost,
        count: r.count,
      })),
    };
  });
