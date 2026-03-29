/**
 * Project Routes
 *
 * All routes now require authentication and include user ownership verification.
 */
import { Elysia } from 'elysia';
import { ProjectService } from '../services/project-service.js';

export const projectRoutes = new Elysia({ prefix: '/api/projects' })
  // List all projects for authenticated user
  .get('/', ({ userId }: { userId: string }) => {
    return ProjectService.findAll(userId);
  })

  // Get single project (with ownership verification)
  .get('/:id', ({ params: { id }, userId }: { userId: string }) => {
    const project = ProjectService.findById(id, userId);
    if (!project) {
      throw new Error('Project not found or access denied');
    }
    return project;
  })

  // Create project
  .post('/', ({ body, userId }: { userId: string }) => {
    const data = body as { name: string; visualStyle?: string; colorPalette?: string[]; tone?: string };
    const result = ProjectService.create(userId, data);
    if (!result.success) {
      throw new Error(result.error);
    }
    return result.data;
  })

  // Update project (with ownership verification)
  .put('/:id', ({ params: { id }, body, userId }: { userId: string }) => {
    const data = body as { name?: string; visualStyle?: string; colorPalette?: string[]; tone?: string };
    const result = ProjectService.update(id, userId, data);
    if (!result.success) {
      throw new Error(result.error || 'Project not found');
    }
    return result.data;
  })

  // Delete project (with ownership verification)
  .delete('/:id', ({ params: { id }, userId }: { userId: string }) => {
    const result = ProjectService.delete(id, userId);
    if (!result.success) {
      throw new Error(result.error || 'Project not found');
    }
    return { success: true };
  });
