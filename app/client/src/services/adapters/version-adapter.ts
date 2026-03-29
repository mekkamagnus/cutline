/**
 * Version Adapter - Domain <-> DB Type Transformations
 *
 * Handles conversions between domain types (Date objects) and
 * database types (ISO strings) for Version entities.
 */
import type { Version, DBVersion, VersionData } from '@/types';

/**
 * Transform a database version to a domain version
 */
export function toDomain(dbVersion: DBVersion): Version {
  return {
    id: dbVersion.id,
    projectId: dbVersion.projectId,
    entityType: dbVersion.entityType,
    entityId: dbVersion.entityId,
    snapshot: dbVersion.snapshot,
    createdAt: new Date(dbVersion.createdAt),
  };
}

/**
 * Transform a domain version to a database version
 */
export function toDB(version: Version): DBVersion {
  return {
    id: version.id,
    projectId: version.projectId,
    entityType: version.entityType,
    entityId: version.entityId,
    snapshot: version.snapshot,
    createdAt: version.createdAt.toISOString(),
  };
}

/**
 * Create a DBVersion from version data for insertion
 */
export function createDBVersion(id: string, projectId: string, data: VersionData): DBVersion {
  return {
    id,
    projectId,
    entityType: data.entityType,
    entityId: data.entityId,
    snapshot: data.snapshot,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Transform an array of database versions to domain versions
 */
export function toDomainArray(dbVersions: DBVersion[]): Version[] {
  return dbVersions.map(toDomain);
}
