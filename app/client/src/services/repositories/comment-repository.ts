/**
 * Comment Repository - Data Access Layer for Comments
 *
 * Uses fp-ts facade (Option, AsyncResult) for functional error handling.
 */
import type { Comment, DBComment, CommentData } from '@/types';
import type { CutlineDB } from '../db';
import { AsyncResult, AppError } from '@/lib/fp';
import { toDomain, toDB, createDBComment, toDomainArray } from '../adapters/comment-adapter';

export class CommentRepository {
  constructor(private db: CutlineDB) {}

  /**
   * Create a new comment
   */
  create(data: CommentData): AsyncResult<AppError, Comment> {
    const run = async (): Promise<Comment> => {
      const id = crypto.randomUUID();
      const dbComment = createDBComment(id, data);
      await this.db.comments.add(dbComment);
      return toDomain(dbComment);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to create comment', { data }, error)
    );
  }

  /**
   * Find a comment by ID
   */
  findById(id: string): AsyncResult<AppError, Comment | null> {
    const promise = this.db.comments.get(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find comment', { id }, error)
    );
    return AsyncResult.map((dbComment: DBComment | undefined): Comment | null => {
      if (!dbComment) return null;
      return toDomain(dbComment);
    })(asyncResult);
  }

  /**
   * Find all comments for an entity
   */
  findByEntity(entityType: CommentData['entityType'], entityId: string): AsyncResult<AppError, Comment[]> {
    const promise = this.db.comments
      .where('[entityType+entityId]')
      .equals([entityType, entityId])
      .sortBy('createdAt');
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to find comments by entity', { entityType, entityId }, error)
    );
    return AsyncResult.map(toDomainArray)(asyncResult);
  }

  /**
   * Update a comment
   */
  update(id: string, content: string): AsyncResult<AppError, Comment> {
    const run = async (): Promise<Comment> => {
      const dbComment = await this.db.comments.get(id);
      if (!dbComment) {
        throw AppError.notFound(`Comment not found: ${id}`, { id });
      }

      const updatedComment: DBComment = {
        ...dbComment,
        content,
        updatedAt: new Date().toISOString(),
      };

      await this.db.comments.put(updatedComment);
      return toDomain(updatedComment);
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to update comment', { id }, error)
    );
  }

  /**
   * Delete a comment
   */
  delete(id: string): AsyncResult<AppError, void> {
    const promise = this.db.comments.delete(id);
    const asyncResult = AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to delete comment', { id }, error)
    );
    return AsyncResult.map(() => undefined)(asyncResult);
  }

  /**
   * Delete all comments for an entity
   */
  deleteByEntity(entityType: CommentData['entityType'], entityId: string): AsyncResult<AppError, void> {
    const run = async (): Promise<void> => {
      await this.db.comments
        .where('[entityType+entityId]')
        .equals([entityType, entityId])
        .delete();
    };

    return AsyncResult.fromPromise(run(), (error) =>
      AppError.database('Failed to delete comments by entity', { entityType, entityId }, error)
    );
  }

  /**
   * Count comments for an entity
   */
  countByEntity(entityType: CommentData['entityType'], entityId: string): AsyncResult<AppError, number> {
    const promise = this.db.comments
      .where('[entityType+entityId]')
      .equals([entityType, entityId])
      .count();
    return AsyncResult.fromPromise(promise, (error) =>
      AppError.database('Failed to count comments', { entityType, entityId }, error)
    );
  }
}
