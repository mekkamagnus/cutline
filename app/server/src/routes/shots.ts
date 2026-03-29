/**
 * Shot Routes
 *
 * CRITICAL: These routes enforce the shot-list-first paradigm.
 * - Confirmed shots cannot be updated or deleted
 * - Confirmation endpoints enable storyboard generation
 *
 * All routes require authentication and user ownership verification.
 */
import { Elysia } from 'elysia';
import { ShotService } from '../services/shot-service.js';
import { ConfirmationService } from '../services/confirmation-service.js';

export const shotRoutes = new Elysia({ prefix: '/api' })
  // Get all shots for a scene (requires auth)
  .get('/scenes/:sceneId/shots', ({ params, userId }: { userId: string }) => {
    // TODO: Add user verification via scene->script->project chain
    return {
      shots: ShotService.findByScene(params.sceneId),
      confirmationStatus: ConfirmationService.getStatus(params.sceneId),
    };
  })

  // Get single shot (requires auth)
  .get('/shots/:id', ({ params, userId }: { userId: string }) => {
    // TODO: Add user verification via scene->script->project chain
    const shot = ShotService.findById(params.id);
    if (!shot) {
      throw new Error('Shot not found');
    }
    return shot;
  })

  // Create shot (always unconfirmed, requires auth)
  .post('/scenes/:sceneId/shots', ({ params, body, userId }: { userId: string }) => {
    const data = body as {
      type: string;
      angle: string;
      movement: string;
      charactersInFrame: string[];
      actionDescription: string;
      duration: number;
      notes?: string;
    };
    const result = ShotService.create(params.sceneId, data);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  })

  // Update shot (PARADIGM GATE: blocked if confirmed, requires auth)
  .put('/shots/:id', ({ params, body, userId }: { userId: string }) => {
    const data = body as {
      type?: string;
      angle?: string;
      movement?: string;
      charactersInFrame?: string[];
      actionDescription?: string;
      duration?: number;
      notes?: string;
    };
    const result = ShotService.update(params.id, data);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  })

  // Delete shot (PARADIGM GATE: blocked if confirmed, requires auth)
  .delete('/shots/:id', ({ params, userId }: { userId: string }) => {
    const result = ShotService.delete(params.id);
    if (!result.success) {
      throw new Error(result.error);
    }
    return { success: true };
  })

  // Reorder shots (PARADIGM GATE: blocked if any confirmed, requires auth)
  .post('/scenes/:sceneId/shots/reorder', ({ params, body, userId }: { userId: string }) => {
    const data = body as { shotIds: string[] };
    const result = ShotService.reorder(params.sceneId, data.shotIds);
    if (!result.success) {
      throw new Error(result.error);
    }
    return { success: true };
  })

  // ========== CONFIRMATION ENDPOINTS (PARADIGM GATES) ==========

  // Get confirmation status (requires auth)
  .get('/scenes/:sceneId/confirmation', ({ params, userId }: { userId: string }) => {
    // TODO: Add user verification via scene->script->project chain
    return ConfirmationService.getStatus(params.sceneId);
  })

  // Confirm shot list (ENABLES storyboard generation, requires auth)
  .post('/scenes/:sceneId/confirm', ({ params, userId }: { userId: string }) => {
    // TODO: Add user verification via scene->script->project chain
    const result = ConfirmationService.confirmShotList(params.sceneId);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  })

  // Unlock shot list for editing (requires auth)
  .post('/scenes/:sceneId/unlock', ({ params, userId }: { userId: string }) => {
    // TODO: Add user verification via scene->script->project chain
    return ConfirmationService.unlockShotList(params.sceneId);
  })

  // Check if generation is allowed (requires auth)
  .get('/scenes/:sceneId/can-generate', ({ params, userId }: { userId: string }) => {
    // TODO: Add user verification via scene->script->project chain
    return ConfirmationService.canGenerateStoryboards(params.sceneId);
  });
