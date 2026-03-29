/**
 * Character Repository - Data Access Layer for Characters
 *
 * Uses fp-ts facade (Option, AsyncResult) for functional error handling.
 */
import type { Character, DBCharacter, CharacterData } from '@/types';
import type { CutlineDB } from '../db';
import { AsyncResult, AppError } from '@/lib/fp';
import { toDomain, toDB, createDBCharacter, toDomainArray } from '../adapters/character-adapter';

export class CharacterRepository {
  constructor(private db: CutlineDB) {}

  /**
   * Create a new character
   */
  create(projectId: string, data: CharacterData): AsyncResult<AppError, Character> {
    const run = async (): Promise<Character> => {
      const id = crypto.randomUUID();
      const dbCharacter = createDBCharacter(id, projectId, data);
      await this.db.characters.add(dbCharacter);
      return toDomain(dbCharacter);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to create character', { projectId, data }, error)
    );
  }

  /**
   * Find a character by ID
   */
  findById(id: string): AsyncResult<AppError, Character | null> {
    const promise = this.db.characters.get(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find character', { id }, error)
    );
    return AsyncResult.map((dbCharacter: DBCharacter | undefined): Character | null => {
      if (!dbCharacter) return null;
      return toDomain(dbCharacter);
    })(asyncResult);
  }

  /**
   * Find all characters for a project
   */
  findByProjectId(projectId: string): AsyncResult<AppError, Character[]> {
    const promise = this.db.characters.where('projectId').equals(projectId).toArray();
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find characters by project', { projectId }, error)
    );
    return AsyncResult.map(toDomainArray)(asyncResult);
  }

  /**
   * Find character by name in project
   */
  findByName(projectId: string, name: string): AsyncResult<AppError, Character | null> {
    const promise = this.db.characters.where('[projectId+name]').equals([projectId, name]).first();
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find character by name', { projectId, name }, error)
    );
    return AsyncResult.map((dbCharacter: DBCharacter | undefined): Character | null => {
      if (!dbCharacter) return null;
      return toDomain(dbCharacter);
    })(asyncResult);
  }

  /**
   * Update a character
   */
  update(id: string, data: Partial<CharacterData>): AsyncResult<AppError, Character> {
    const run = async (): Promise<Character> => {
      const dbCharacter = await this.db.characters.get(id);
      if (!dbCharacter) {
        throw AppError.notFound(`Character not found: ${id}`, { id });
      }

      const updatedCharacter: DBCharacter = {
        ...dbCharacter,
        ...data,
      };

      await this.db.characters.put(updatedCharacter);
      return toDomain(updatedCharacter);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to update character', { id, data }, error)
    );
  }

  /**
   * Delete a character
   */
  delete(id: string): AsyncResult<AppError, void> {
    const promise = this.db.characters.delete(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to delete character', { id }, error)
    );
    return AsyncResult.map(() => undefined)(asyncResult);
  }

  /**
   * Check if character name exists in project
   */
  nameExists(projectId: string, name: string): AsyncResult<AppError, boolean> {
    const promise = this.db.characters.where('[projectId+name]').equals([projectId, name]).first();
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to check character name', { projectId, name }, error)
    );
    return AsyncResult.map((character) => character !== undefined)(asyncResult);
  }
}
