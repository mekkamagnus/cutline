/**
 * Database Connection
 *
 * SQLite database connection using Bun's built-in SQLite.
 */
import { Database } from 'bun:sqlite';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Database file path - stored in data directory
const DATA_DIR = join(__dirname, '..', '..', 'data');
const DB_PATH = join(DATA_DIR, 'cutline.db');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

// Create database connection
export const db = new Database(DB_PATH);

// Enable WAL mode and foreign keys
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

/**
 * Initialize database schema
 */
export function initializeDatabase(): void {
  const schemaPath = join(__dirname, 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');

  // Execute the entire schema as one transaction
  db.transaction(() => {
    // Split by newlines and process each statement
    const lines = schema.split('\n');
    let currentStatement = '';

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('--')) {
        continue;
      }

      // Skip PRAGMA statements (already executed)
      if (trimmed.toUpperCase().startsWith('PRAGMA')) {
        continue;
      }

      currentStatement += ' ' + trimmed;

      // Execute when we hit a semicolon
      if (trimmed.endsWith(';')) {
        try {
          db.run(currentStatement.trim());
        } catch (error) {
          const message = error instanceof Error ? error.message : '';
          if (!message.includes('already exists')) {
            console.error('Schema error:', message, 'Statement:', currentStatement.trim().substring(0, 100));
          }
        }
        currentStatement = '';
      }
    }
  })();

  console.log('✅ Database schema initialized');
}

/**
 * Close database connection
 */
export function closeDatabase(): void {
  db.close();
}

/**
 * Health check for database
 */
export function isDatabaseHealthy(): boolean {
  try {
    const query = db.query('SELECT 1 as ok');
    const result = query.get() as { ok: number } | undefined;
    return result?.ok === 1;
  } catch {
    return false;
  }
}

// Auto-initialize on import
initializeDatabase();

export default db;
