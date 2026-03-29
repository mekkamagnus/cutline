/**
 * Project Adapter - Domain <-> DB Type Transformations
 *
 * Handles conversions between domain types (Date objects) and
 * database types (ISO strings) for Project entities.
 */
import type { Project, DBProject, ProjectData } from '@/types';

/**
 * Transform a database project to a domain project
 */
export function toDomain(dbProject: DBProject): Project {
  return {
    id: dbProject.id,
    name: dbProject.name,
    createdAt: new Date(dbProject.createdAt),
    updatedAt: new Date(dbProject.updatedAt),
    visualStyle: dbProject.visualStyle,
    colorPalette: dbProject.colorPalette,
    tone: dbProject.tone,
    lastSyncedAt: dbProject.lastSyncedAt ? new Date(dbProject.lastSyncedAt) : undefined,
    syncStatus: dbProject.syncStatus,
  };
}

/**
 * Transform a domain project to a database project
 */
export function toDB(project: Project): DBProject {
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    visualStyle: project.visualStyle,
    colorPalette: project.colorPalette,
    tone: project.tone,
    lastSyncedAt: project.lastSyncedAt?.toISOString(),
    syncStatus: project.syncStatus,
  };
}

/**
 * Create a DBProject from project data for insertion
 */
export function createDBProject(id: string, data: ProjectData): DBProject {
  const now = new Date().toISOString();
  return {
    id,
    name: data.name,
    createdAt: now,
    updatedAt: now,
    visualStyle: data.visualStyle,
    colorPalette: data.colorPalette,
    tone: data.tone,
    syncStatus: 'pending',
  };
}

/**
 * Transform an array of database projects to domain projects
 */
export function toDomainArray(dbProjects: DBProject[]): Project[] {
  return dbProjects.map(toDomain);
}
