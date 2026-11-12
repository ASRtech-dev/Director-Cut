import Database from '@tauri-apps/plugin-sql';
import { INITIAL_SCHEMA } from './database/schema';
import { SEED_DATA } from './database/seed';
import { seedPromptTemplates } from './prompt-seed';

class HttpDatabaseClient {
  private serverUrl: string;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl.replace(/\/$/, '');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const authToken = localStorage.getItem('serverAuthToken');
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
    return headers;
  }

  async select<T>(query: string, bindValues?: any[]): Promise<T> {
    const res = await fetch(`${this.serverUrl}/api/db/select`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query, params: bindValues || [] })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Select failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  async execute(query: string, bindValues?: any[]): Promise<{ lastInsertId: number; rowsAffected: number }> {
    const res = await fetch(`${this.serverUrl}/api/db/execute`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ query, params: bindValues || [] })
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText || `Execute failed: ${res.status}`);
    }
    return res.json();
  }
}

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  const syncEnabled = localStorage.getItem('serverSyncEnabled') === 'true';
  const serverUrl = localStorage.getItem('serverUrl') || 'http://localhost:5000';

  if (syncEnabled) {
    return new HttpDatabaseClient(serverUrl) as unknown as Database;
  }

  if (!dbInstance) {
    dbInstance = await Database.load('sqlite:director_cut.db');
  }
  return dbInstance;
}

export async function initDatabase(): Promise<void> {
  const db = await getDb();
  
  // 1. Create schema
  const schemaStatements = INITIAL_SCHEMA.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of schemaStatements) {
    try { 
      await db.execute(stmt); 
    } catch (e) { 
      console.warn('[DB Schema] Statement failed (may be OK if table exists):', (e as Error).message?.substring(0, 100));
    }
  }

  // 2. Seed step definitions and dependencies
  const seedStatements = SEED_DATA.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of seedStatements) {
    try { 
      await db.execute(stmt); 
    } catch (e) { 
      console.warn('[DB Seed] Statement failed:', (e as Error).message?.substring(0, 120));
    }
  }
  
  // 3. Seed prompt templates
  try {
    await seedPromptTemplates();
  } catch (e) {
    console.error('[DB] seedPromptTemplates failed:', e);
  }
  
  // 4. Migration: fix stale states from previous sessions
  try {
    await db.execute(
      "UPDATE workflow_step_runs SET state = 'awaiting_review' WHERE state = 'awaiting_human_review'"
    );
  } catch (_e) { /* table may not exist yet */ }

  // 5. Migration: ensure Step 01 is never blocked (it has no dependencies)
  try {
    await db.execute(
      "UPDATE workflow_step_runs SET state = 'ready' WHERE step_number = 1 AND state = 'blocked'"
    );
  } catch (_e) { /* table may not exist yet */ }

  // 6. Init Sandbox Table
  try {
    await db.execute(
      "CREATE TABLE IF NOT EXISTS sandbox_ideas (id TEXT PRIMARY KEY, content TEXT, created_at TEXT)"
    );
  } catch (e) {
    console.error('[DB] Failed to create sandbox_ideas table:', e);
  }

  // 7. Migration: add assigned_to to episodes
  try {
    await db.execute("ALTER TABLE episodes ADD COLUMN assigned_to TEXT");
    console.log("[DB Migration] Added assigned_to column to episodes");
  } catch (_e) { /* column may already exist */ }

  // 8. Migration: add outro_template and sponsor_guidelines to channels
  try {
    await db.execute("ALTER TABLE channels ADD COLUMN outro_template TEXT");
    console.log("[DB Migration] Added outro_template column to channels");
  } catch (_e) { /* column may already exist */ }
  try {
    await db.execute("ALTER TABLE channels ADD COLUMN sponsor_guidelines TEXT");
    console.log("[DB Migration] Added sponsor_guidelines column to channels");
  } catch (_e) { /* column may already exist */ }

  // 9. Init Chat Table
  try {
    await db.execute(
      "CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, sender TEXT NOT NULL, content TEXT, gif_url TEXT, created_at TEXT NOT NULL)"
    );
    console.log("[DB] Ensured chat_messages table exists");
  } catch (e) {
    console.error('[DB] Failed to create chat_messages table:', e);
  }

  // 10. Migration: add channel_id and episode_id to prompt_templates
  try {
    await db.execute("ALTER TABLE prompt_templates ADD COLUMN channel_id TEXT");
    console.log("[DB Migration] Added channel_id column to prompt_templates");
  } catch (_e) { /* column may already exist */ }
  try {
    await db.execute("ALTER TABLE prompt_templates ADD COLUMN episode_id TEXT");
    console.log("[DB Migration] Added episode_id column to prompt_templates");
  } catch (_e) { /* column may already exist */ }

  console.log("[DB] Database initialized successfully");
}

/**
 * Reset the entire local workspace — deletes all episode data, 
 * step runs, artifacts, and versions. Re-seeds from scratch.
 */
export async function resetDatabase(): Promise<void> {
  const db = await getDb();
  
  // Drop user data tables (order matters due to foreign keys)
  const tablesToClear = [
    'human_reviews',
    'artifact_dependencies', 
    'artifact_versions',
    'artifacts',
    'episode_variables',
    'workflow_step_runs',
    'episodes',
    'channels',
    'projects'
  ];

  for (const table of tablesToClear) {
    try {
      await db.execute(`DELETE FROM ${table}`);
      console.log(`[DB Reset] Cleared table: ${table}`);
    } catch (e) {
      console.warn(`[DB Reset] Failed to clear ${table}:`, (e as Error).message);
    }
  }

  console.log('[DB Reset] All user data cleared. App will re-initialize on next load.');
}
