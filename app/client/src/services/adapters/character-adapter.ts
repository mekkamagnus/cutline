/**
 * Character Adapter - Domain <-> DB Type Transformations
 *
 * Handles conversions between domain types (Date objects) and
 * database types (ISO strings) for Character entities.
 */
import type { Character, DBCharacter, CharacterData } from '@/types';

/**
 * Transform a database character to a domain character
 */
export function toDomain(dbCharacter: DBCharacter): Character {
  return {
    id: dbCharacter.id,
    projectId: dbCharacter.projectId,
    name: dbCharacter.name,
    description: dbCharacter.description,
    color: dbCharacter.color,
    avatarUrl: dbCharacter.avatarUrl,
    createdAt: new Date(dbCharacter.createdAt),
  };
}

/**
 * Transform a domain character to a database character
 */
export function toDB(character: Character): DBCharacter {
  return {
    id: character.id,
    projectId: character.projectId,
    name: character.name,
    description: character.description,
    color: character.color,
    avatarUrl: character.avatarUrl,
    createdAt: character.createdAt.toISOString(),
  };
}

/**
 * Create a DBCharacter from character data for insertion
 */
export function createDBCharacter(id: string, projectId: string, data: CharacterData): DBCharacter {
  return {
    id,
    projectId,
    name: data.name,
    description: data.description,
    color: data.color,
    avatarUrl: data.avatarUrl,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Transform an array of database characters to domain characters
 */
export function toDomainArray(dbCharacters: DBCharacter[]): Character[] {
  return dbCharacters.map(toDomain);
}
