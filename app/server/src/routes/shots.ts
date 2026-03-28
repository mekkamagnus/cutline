/**
 * Shot Routes
 *
 * CRITICAL: These routes enforce the shot-list-first paradigm.
 * - Confirmed shots cannot be updated or deleted
 * - Confirmation endpoints enable storyboard generation
 */
import { Elysia } from 'elysia';
import { ShotService } from '../services/shot-service.js';
import { ConfirmationService } from '../services/confirmation-service.js';

export const shotRoutes = new Elysia({ prefix: '/api' })
  // Get all shots for a scene
  .get('/scenes/:sceneId/shots', ({ params }) => {
    return {
      shots: ShotService.getByScene(params.sceneId),
      confirmationStatus: ConfirmationService.getStatus(params.sceneId),
    };
  })

  // Get single shot
  .get('/shots/:id', ({ params }) => {
    const shot = ShotService.getById(params.id);
    if (!shot) {
      throw new Error('Shot not found');
    }
    return shot;
  })

  // Create shot (always unconfirmed)
  .post('/scenes/:sceneId/shots', ({ params, body }) => {
    const data = body as {
      type: string;
      angle: string;
      movement: string;
      charactersInFrame: string[];
      actionDescription: string;
      duration: number;
      notes?: string;
    };
    return ShotService.create(params.sceneId, data);
  })

  // Update shot (PARADIGM GATE: blocked if confirmed)
  .put('/shots/:id', ({ params, body }) => {
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
    if ('error' in result) {
      throw new Error(result.error);
    }
    return result;
  })

  // Delete shot (PARADIGM GATE: blocked if confirmed)
  .delete('/shots/:id', ({ params }) => {
    const result = ShotService.delete(params.id);
    if ('error' in result) {
      throw new Error(result.error);
    }
    return result;
  })

  // Reorder shots (PARADIGM GATE: blocked if any confirmed)
  .post('/scenes/:sceneId/shots/reorder', ({ params, body }) => {
    const data = body as { shotIds: string[] };
    const result = ShotService.reorder(params.sceneId, data.shotIds);
    if ('error' in result) {
      throw new Error(result.error);
    }
    return result;
  })

  // ========== CONFIRMATION ENDPOINTS (PARADIGM GATES) ==========

  // Get confirmation status
  .get('/scenes/:sceneId/confirmation', ({ params }) => {
    return ConfirmationService.getStatus(params.sceneId);
  })

  // Confirm shot list (ENABLES storyboard generation)
  .post('/scenes/:sceneId/confirm', ({ params }) => {
    const result = ConfirmationService.confirmShotList(params.sceneId);
    if ('error' in result) {
      throw new Error(result.error);
    }
    return result;
  })

  // Unlock shot list for editing
  .post('/scenes/:sceneId/unlock', ({ params }) => {
    return ConfirmationService.unlockShotList(params.sceneId);
  })

  // Check if generation is allowed
  .get('/scenes/:sceneId/can-generate', ({ params }) => {
    return ConfirmationService.canGenerateStoryboards(params.sceneId);
  });
