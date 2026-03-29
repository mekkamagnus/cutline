/**
 * Script Adapter - Domain <-> DB Type Transformations
 *
 * Handles conversions between domain types (Date objects) and
 * database types (ISO strings) for Script entities.
 */
import type { Script, DBScript, ScriptData } from '@/types';

/**
 * Transform a database script to a domain script
 */
export function toDomain(dbScript: DBScript): Script {
  return {
    id: dbScript.id,
    projectId: dbScript.projectId,
    fountainText: dbScript.fountainText,
    format: dbScript.format,
    createdAt: new Date(dbScript.createdAt),
    updatedAt: new Date(dbScript.updatedAt),
  };
}

/**
 * Transform a domain script to a database script
 */
export function toDB(script: Script): DBScript {
  return {
    id: script.id,
    projectId: script.projectId,
    fountainText: script.fountainText,
    format: script.format,
    createdAt: script.createdAt.toISOString(),
    updatedAt: script.updatedAt.toISOString(),
  };
}

/**
 * Create a DBScript from script data for insertion
 */
export function createDBScript(id: string, projectId: string, data: ScriptData): DBScript {
  const now = new Date().toISOString();
  return {
    id,
    projectId,
    fountainText: data.fountainText,
    format: data.format ?? 'fountain',
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Transform an array of database scripts to domain scripts
 */
export function toDomainArray(dbScripts: DBScript[]): Script[] {
  return dbScripts.map(toDomain);
}
