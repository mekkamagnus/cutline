/**
 * Sync Routes
 *
 * Bidirectional sync between client IndexedDB and server SQLite.
 * Supports offline-first architecture with conflict resolution.
 */
import { Elysia, t } from 'elysia';
import { db } from '../db/connection.js';

export const syncRoutes = new Elysia({ prefix: '/api/sync' })
  // Pull changes from server
  .post('/pull', ({ body }) => {
    const { lastSyncAt, entities } = body;
    const pulledAt = new Date().toISOString();

    const changes = {
      projects: [] as Record<string, unknown>[],
      scripts: [] as Record<string, unknown>[],
      scenes: [] as Record<string, unknown>[],
      shots: [] as Record<string, unknown>[],
      storyboards: [] as Record<string, unknown>[],
    };

    // Fetch updated entities since lastSyncAt
    if (entities.projects?.length) {
      const placeholders = entities.projects.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT * FROM projects
        WHERE id IN (${placeholders})
        AND updated_at > ?
      `);
      changes.projects = stmt.all(...entities.projects, lastSyncAt || '1970-01-01') as Record<string, unknown>[];
    }

    if (entities.scripts?.length) {
      const placeholders = entities.scripts.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT * FROM scripts
        WHERE id IN (${placeholders})
        AND updated_at > ?
      `);
      changes.scripts = stmt.all(...entities.scripts, lastSyncAt || '1970-01-01') as Record<string, unknown>[];
    }

    if (entities.scenes?.length) {
      const placeholders = entities.scenes.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT * FROM scenes
        WHERE id IN (${placeholders})
        AND updated_at > ?
      `);
      changes.scenes = stmt.all(...entities.scenes, lastSyncAt || '1970-01-01') as Record<string, unknown>[];
    }

    if (entities.shots?.length) {
      const placeholders = entities.shots.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT * FROM shots
        WHERE id IN (${placeholders})
        AND updated_at > ?
      `);
      changes.shots = stmt.all(...entities.shots, lastSyncAt || '1970-01-01') as Record<string, unknown>[];
    }

    if (entities.storyboards?.length) {
      const placeholders = entities.storyboards.map(() => '?').join(',');
      const stmt = db.prepare(`
        SELECT * FROM storyboards
        WHERE id IN (${placeholders})
        AND generated_at > ?
      `);
      changes.storyboards = stmt.all(...entities.storyboards, lastSyncAt || '1970-01-01') as Record<string, unknown>[];
    }

    // Get deleted entities (using sync_metadata for tombstones)
    const deleted = {
      projectIds: [] as string[],
      scriptIds: [] as string[],
      sceneIds: [] as string[],
      shotIds: [] as string[],
      storyboardIds: [] as string[],
    };

    return {
      pulledAt,
      changes,
      deleted,
    };
  }, {
    body: t.Object({
      lastSyncAt: t.Optional(t.String()),
      entities: t.Object({
        projects: t.Optional(t.Array(t.String())),
        scripts: t.Optional(t.Array(t.String())),
        scenes: t.Optional(t.Array(t.String())),
        shots: t.Optional(t.Array(t.String())),
        storyboards: t.Optional(t.Array(t.String())),
      }),
    }),
  })

  // Push changes to server
  .post('/push', ({ body }) => {
    const { changes, deleted } = body;
    const pushedAt = new Date().toISOString();
    const accepted: string[] = [];
    const rejected: { id: string; reason: string }[] = [];

    const transaction = db.transaction(() => {
      // Handle project changes
      if (changes.projects) {
        for (const project of changes.projects) {
          try {
            const stmt = db.prepare(`
              INSERT INTO projects (id, name, visual_style, color_palette, tone, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                visual_style = excluded.visual_style,
                color_palette = excluded.color_palette,
                tone = excluded.tone,
                updated_at = excluded.updated_at
              WHERE excluded.version > (SELECT version FROM projects WHERE id = excluded.id)
                OR (SELECT version FROM projects WHERE id = excluded.id) IS NULL
            `);
            stmt.run(
              project.id,
              project.name,
              project.visual_style,
              project.color_palette,
              project.tone,
              project.created_at,
              project.updated_at
            );
            accepted.push(`project:${project.id}`);
          } catch (error) {
            rejected.push({ id: `project:${project.id}`, reason: String(error) });
          }
        }
      }

      // Handle shot changes (with confirmation paradigm check)
      if (changes.shots) {
        for (const shot of changes.shots) {
          try {
            // Check if shot is confirmed on server
            const existing = db.prepare('SELECT confirmed FROM shots WHERE id = ?').get(shot.id) as { confirmed: number } | undefined;

            if (existing && existing.confirmed === 1) {
              // Server-side paradigm enforcement: reject updates to confirmed shots
              rejected.push({ id: `shot:${shot.id}`, reason: 'Shot is confirmed on server. Unlock first.' });
              continue;
            }

            const stmt = db.prepare(`
              INSERT INTO shots (
                id, scene_id, shot_number, type, angle, movement,
                characters_in_frame, action_description, duration, notes,
                confirmed, confirmed_at, created_at, updated_at, version
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                shot_number = excluded.shot_number,
                type = excluded.type,
                angle = excluded.angle,
                movement = excluded.movement,
                characters_in_frame = excluded.characters_in_frame,
                action_description = excluded.action_description,
                duration = excluded.duration,
                notes = excluded.notes,
                confirmed = excluded.confirmed,
                confirmed_at = excluded.confirmed_at,
                updated_at = excluded.updated_at,
                version = version + 1
              WHERE excluded.version > (SELECT version FROM shots WHERE id = excluded.id)
                OR (SELECT version FROM shots WHERE id = excluded.id) IS NULL
            `);
            stmt.run(
              shot.id,
              shot.scene_id,
              shot.shot_number,
              shot.type,
              shot.angle,
              shot.movement,
              shot.characters_in_frame,
              shot.action_description,
              shot.duration,
              shot.notes,
              shot.confirmed,
              shot.confirmed_at,
              shot.created_at,
              shot.updated_at,
              shot.version || 1
            );
            accepted.push(`shot:${shot.id}`);
          } catch (error) {
            rejected.push({ id: `shot:${shot.id}`, reason: String(error) });
          }
        }
      }

      // Handle deletions
      if (deleted.projectIds) {
        for (const id of deleted.projectIds) {
          db.prepare('DELETE FROM projects WHERE id = ?').run(id);
          accepted.push(`project:${id}:deleted`);
        }
      }

      if (deleted.shotIds) {
        for (const id of deleted.shotIds) {
          // Check paradigm gate before deleting
          const existing = db.prepare('SELECT confirmed FROM shots WHERE id = ?').get(id) as { confirmed: number } | undefined;
          if (existing && existing.confirmed === 1) {
            rejected.push({ id: `shot:${id}`, reason: 'Cannot delete confirmed shot' });
          } else {
            db.prepare('DELETE FROM shots WHERE id = ?').run(id);
            accepted.push(`shot:${id}:deleted`);
          }
        }
      }
    });

    transaction();

    return {
      pushedAt,
      accepted,
      rejected,
    };
  }, {
    body: t.Object({
      changes: t.Object({
        projects: t.Optional(t.Array(t.Any())),
        scripts: t.Optional(t.Array(t.Any())),
        scenes: t.Optional(t.Array(t.Any())),
        shots: t.Optional(t.Array(t.Any())),
        storyboards: t.Optional(t.Array(t.Any())),
      }),
      deleted: t.Object({
        projectIds: t.Optional(t.Array(t.String())),
        scriptIds: t.Optional(t.Array(t.String())),
        sceneIds: t.Optional(t.Array(t.String())),
        shotIds: t.Optional(t.Array(t.String())),
        storyboardIds: t.Optional(t.Array(t.String())),
      }),
    }),
  });
