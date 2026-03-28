/**
 * Project Routes
 */
import { Elysia } from 'elysia';
import { ProjectService } from '../services/project-service.js';

export const projectRoutes = new Elysia({ prefix: '/api/projects' })
  // List all projects
  .get('/', () => {
    return ProjectService.getAll();
  })

  // Get single project
  .get('/:id', ({ params: { id } }) => {
    const project = ProjectService.getById(id);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  })

  // Create project
  .post('/', ({ body }) => {
    const data = body as { name: string; visualStyle?: string; colorPalette?: string[]; tone?: string };
    return ProjectService.create(data);
  })

  // Update project
  .put('/:id', ({ params: { id }, body }) => {
    const data = body as { name?: string; visualStyle?: string; colorPalette?: string[]; tone?: string };
    const project = ProjectService.update(id, data);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  })

  // Delete project
  .delete('/:id', ({ params: { id } }) => {
    const success = ProjectService.delete(id);
    if (!success) {
      throw new Error('Project not found');
    }
    return { success: true };
  });
