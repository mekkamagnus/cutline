/**
 * Storyboard Routes
 *
 * CRUD operations for storyboards with paradigm gates.
 * - Storyboards can only be created for confirmed shots
 * - Supports version history for refinements
 *
 * All routes require authentication.
 */
import { Elysia, t } from 'elysia';
import { db } from '../db/connection.js';

// Types
interface CreateStoryboardBody {
  imageUrl: string;
  generationParams: Record<string, unknown>;
  apiProvider?: 'sdxl' | 'wanxiang';
  cost?: number;
  style?: string;
  refinementPrompt?: string;
}

interface UpdateStoryboardBody {
  imageUrl?: string;
  refinementPrompt?: string;
}

interface AddVersionBody {
  imageUrl: string;
  generationParams: Record<string, unknown>;
  apiProvider?: 'sdxl' | 'wanxiang';
  cost?: number;
  refinementPrompt?: string;
}

// Helper to verify shot is confirmed
async function verifyShotConfirmed(shotId: string): Promise<boolean> {
  const query = db.query(`
    SELECT confirmed FROM shots WHERE id = $shotId
  `);
  const result = query.get({ $shotId: shotId }) as { confirmed: number } | undefined;
  return result?.confirmed === 1;
}

export const storyboardRoutes = new Elysia({ prefix: '/api' })
  // ========== CRUD ROUTES ==========

  // Get storyboard for a shot (one-to-one)
  .get('/shots/:id/storyboard', ({ params, userId }: { userId: string }) => {
    // TODO: Add user verification via shot->scene->script->project chain
    const query = db.query(`
      SELECT * FROM storyboards WHERE shot_id = $shotId ORDER BY version DESC LIMIT 1
    `);
    const result = query.get({ $shotId: params.id });
    return result || null;
  })

  // Get storyboard by ID with version history
  .get('/storyboards/:id', ({ params, userId }: { userId: string }) => {
    const query = db.query(`
      SELECT * FROM storyboards WHERE id = $id
    `);
    const result = query.get({ $id: params.id });
    return result || null;
  })

  // Get all storyboards for a scene
  .get('/scenes/:sceneId/storyboards', ({ params, userId }: { userId: string }) => {
    // TODO: Add user verification via scene->script->project chain
    const query = db.query(`
      SELECT s.*, sh.shot_number, sh.type as shot_type
      FROM storyboards s
      JOIN shots sh ON s.shot_id = sh.id
      WHERE sh.scene_id = $sceneId
      ORDER BY sh.shot_number
    `);
    return query.all({ $sceneId: params.sceneId });
  })

  // Create storyboard for a shot (PARADIGM GATE: requires confirmed shot)
  .post('/shots/:id/storyboard', async ({ params, body, userId }: { body: CreateStoryboardBody; userId: string }) => {
    // PARADIGM GATE: Verify shot is confirmed
    const isConfirmed = await verifyShotConfirmed(params.id);
    if (!isConfirmed) {
      throw new Error('Cannot create storyboard for unconfirmed shot');
    }

    const id = `sb-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const insert = db.query(`
      INSERT INTO storyboards (id, shot_id, image_url, generation_params, api_provider, cost, style, refinement_prompt, version)
      VALUES ($id, $shotId, $imageUrl, $params, $provider, $cost, $style, $refinement, 1)
    `);

    insert.run({
      $id: id,
      $shotId: params.id,
      $imageUrl: body.imageUrl,
      $params: JSON.stringify(body.generationParams),
      $provider: body.apiProvider || 'sdxl',
      $cost: body.cost || 0,
      $style: body.style || 'pencil-sketch',
      $refinement: body.refinementPrompt || null,
    });

    return {
      id,
      shotId: params.id,
      imageUrl: body.imageUrl,
      version: 1,
    };
  }, {
    body: t.Object({
      imageUrl: t.String(),
      generationParams: t.Object({}),
      apiProvider: t.Optional(t.Union([t.Literal('sdxl'), t.Literal('wanxiang')])),
      cost: t.Optional(t.Number()),
      style: t.Optional(t.String()),
      refinementPrompt: t.Optional(t.String()),
    }),
  })

  // Add a new version to a storyboard (refinement)
  .post('/storyboards/:id/versions', async ({ params, body, userId }: { body: AddVersionBody; userId: string }) => {
    // Get current storyboard
    const currentQuery = db.query(`
      SELECT * FROM storyboards WHERE id = $id
    `);
    const current = currentQuery.get({ $id: params.id }) as {
      shot_id: string;
      version: number;
      previous_versions: string;
    } | undefined;

    if (!current) {
      throw new Error('Storyboard not found');
    }

    // PARADIGM GATE: Verify shot is still confirmed
    const isConfirmed = await verifyShotConfirmed(current.shot_id);
    if (!isConfirmed) {
      throw new Error('Cannot add version for unconfirmed shot');
    }

    // Store current version in history
    const previousVersions = JSON.parse(current.previous_versions || '[]');
    previousVersions.push({
      version: current.version,
      timestamp: new Date().toISOString(),
    });

    // Update to new version
    const update = db.query(`
      UPDATE storyboards SET
        image_url = $imageUrl,
        generation_params = $params,
        api_provider = $provider,
        cost = $cost,
        refinement_prompt = $refinement,
        version = $newVersion,
        previous_versions = $prevVersions,
        generated_at = $now
      WHERE id = $id
    `);

    update.run({
      $id: params.id,
      $imageUrl: body.imageUrl,
      $params: JSON.stringify(body.generationParams),
      $provider: body.apiProvider || 'sdxl',
      $cost: body.cost || 0,
      $refinement: body.refinementPrompt || null,
      $newVersion: current.version + 1,
      $prevVersions: JSON.stringify(previousVersions),
      $now: new Date().toISOString(),
    });

    return {
      id: params.id,
      version: current.version + 1,
      imageUrl: body.imageUrl,
    };
  }, {
    body: t.Object({
      imageUrl: t.String(),
      generationParams: t.Object({}),
      apiProvider: t.Optional(t.Union([t.Literal('sdxl'), t.Literal('wanxiang')])),
      cost: t.Optional(t.Number()),
      refinementPrompt: t.Optional(t.String()),
    }),
  })

  // Delete storyboard
  .delete('/storyboards/:id', ({ params, userId }: { userId: string }) => {
    const del = db.query(`
      DELETE FROM storyboards WHERE id = $id
    `);
    del.run({ $id: params.id });
    return { success: true };
  })

  // Get version history for a storyboard
  .get('/storyboards/:id/history', ({ params, userId }: { userId: string }) => {
    const query = db.query(`
      SELECT previous_versions, version FROM storyboards WHERE id = $id
    `);
    const result = query.get({ $id: params.id }) as { previous_versions: string; version: number } | undefined;

    if (!result) {
      return null;
    }

    return {
      currentVersion: result.version,
      history: JSON.parse(result.previous_versions || '[]'),
    };
  })

  // ========== COST TRACKING ==========

  // Get total cost for a scene
  .get('/scenes/:sceneId/storyboard-cost', ({ params, userId }: { userId: string }) => {
    const query = db.query(`
      SELECT SUM(s.cost) as total_cost, COUNT(s.id) as total_panels
      FROM storyboards s
      JOIN shots sh ON s.shot_id = sh.id
      WHERE sh.scene_id = $sceneId
    `);

    const result = query.get({ $sceneId: params.sceneId }) as { total_cost: number | null; total_panels: number } | undefined;

    return {
      totalCost: result?.total_cost || 0,
      totalPanels: result?.total_panels || 0,
    };
  });
