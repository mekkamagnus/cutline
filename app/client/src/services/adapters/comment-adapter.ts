/**
 * Comment Adapter - Domain <-> DB Type Transformations
 *
 * Handles conversions between domain types (Date objects) and
 * database types (ISO strings) for Comment entities.
 */
import type { Comment, DBComment, CommentData } from '@/types';

/**
 * Transform a database comment to a domain comment
 */
export function toDomain(dbComment: DBComment): Comment {
  return {
    id: dbComment.id,
    entityType: dbComment.entityType,
    entityId: dbComment.entityId,
    content: dbComment.content,
    author: dbComment.author,
    createdAt: new Date(dbComment.createdAt),
    updatedAt: new Date(dbComment.updatedAt),
  };
}

/**
 * Transform a domain comment to a database comment
 */
export function toDB(comment: Comment): DBComment {
  return {
    id: comment.id,
    entityType: comment.entityType,
    entityId: comment.entityId,
    content: comment.content,
    author: comment.author,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}

/**
 * Create a DBComment from comment data for insertion
 */
export function createDBComment(id: string, data: CommentData): DBComment {
  const now = new Date().toISOString();
  return {
    id,
    entityType: data.entityType,
    entityId: data.entityId,
    content: data.content,
    author: data.author,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Transform an array of database comments to domain comments
 */
export function toDomainArray(dbComments: DBComment[]): Comment[] {
  return dbComments.map(toDomain);
}
