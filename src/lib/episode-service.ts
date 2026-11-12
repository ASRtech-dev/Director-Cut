import { getDb } from './database';
import { generateId, generateEpisodeSlug } from './id-generator';
import { createStepRunsForEpisode } from './workflow-engine';
import { logAuditEvent } from './audit';
import { Channel, Episode } from '../types';

// ── Channel CRUD ──────────────────────────────────────────────

export interface CreateChannelInput {
  name: string;
  language?: string;
  region?: string;
  target_audience?: string;
  desired_tone?: string;
  narrator_mode?: string;
  visual_style?: string;
  default_duration_minutes?: number;
  spoiler_policy?: string;
  adaptation_policy?: string;
  outro_template?: string;
  sponsor_guidelines?: string;
}

export async function createChannel(projectId: string, input: CreateChannelInput): Promise<string> {
  const db = await getDb();
  const id = generateId('chan');
  const now = new Date().toISOString();
  
  await db.execute(
    `INSERT INTO channels (id, project_id, name, language, region, target_audience, desired_tone, narrator_mode, visual_style, default_duration_minutes, spoiler_policy, adaptation_policy, outro_template, sponsor_guidelines, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      id, projectId, input.name, input.language || null, input.region || null, 
      input.target_audience || null, input.desired_tone || null, input.narrator_mode || null, 
      input.visual_style || null, input.default_duration_minutes || null, input.spoiler_policy || null, 
      input.adaptation_policy || null, input.outro_template || null, input.sponsor_guidelines || null,
      now, now
    ]
  );
  
  return id;
}

export async function getChannels(projectId: string): Promise<Channel[]> {
  const db = await getDb();
  return await db.select<Channel[]>(
    'SELECT * FROM channels WHERE project_id = $1 ORDER BY name ASC',
    [projectId]
  );
}

export async function getChannel(channelId: string): Promise<Channel | null> {
  const db = await getDb();
  const rows = await db.select<Channel[]>('SELECT * FROM channels WHERE id = $1', [channelId]);
  return rows.length > 0 ? rows[0] : null;
}

const ALLOWED_CHANNEL_UPDATE_FIELDS = new Set<string>([
  'name',
  'language',
  'region',
  'target_audience',
  'desired_tone',
  'narrator_mode',
  'visual_style',
  'default_duration_minutes',
  'spoiler_policy',
  'adaptation_policy',
  'outro_template',
  'sponsor_guidelines',
  'metadata_json',
]);

export async function updateChannel(channelId: string, input: Partial<CreateChannelInput>): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      if (!ALLOWED_CHANNEL_UPDATE_FIELDS.has(key)) {
        throw new Error(`Invalid channel update field: ${key}`);
      }
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }
  
  if (fields.length === 0) return;
  
  fields.push(`updated_at = $${paramIndex}`);
  values.push(now);
  paramIndex++;
  
  values.push(channelId);
  
  await db.execute(
    `UPDATE channels SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
}

// ── Episode CRUD ──────────────────────────────────────────────

export interface CreateEpisodeInput {
  title: string;
  topic: string;
  primary_work?: string;
  channel_id?: string;
  target_language?: string;
  target_region?: string;
  target_audience?: string;
  desired_tone?: string;
  spoiler_policy?: string;
  adaptation_policy?: string;
  research_depth?: string;
  assigned_to?: string;
}

export async function getNextEpisodeCode(projectId: string): Promise<string> {
  const db = await getDb();
  const rows = await db.select<any[]>(
    'SELECT episode_code FROM episodes WHERE project_id = $1 ORDER BY episode_code DESC LIMIT 1',
    [projectId]
  );
  
  if (rows.length === 0) return '001';
  
  const lastCode = rows[0].episode_code;
  const nextNum = parseInt(lastCode, 10) + 1;
  return nextNum.toString().padStart(3, '0');
}

export async function createEpisode(projectId: string, input: CreateEpisodeInput): Promise<string> {
  const db = await getDb();
  const id = generateId('ep');
  const now = new Date().toISOString();
  const episodeCode = await getNextEpisodeCode(projectId);
  const slug = generateEpisodeSlug(input.title);
  
  await db.execute(
    `INSERT INTO episodes (id, project_id, channel_id, episode_code, title, slug, topic, primary_work, target_language, target_region, target_audience, desired_tone, spoiler_policy, adaptation_policy, research_depth, status, current_step_number, assigned_to, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
    [
      id, projectId, input.channel_id || null, episodeCode, input.title, slug, input.topic, 
      input.primary_work || null, input.target_language || null, input.target_region || null, 
      input.target_audience || null, input.desired_tone || null, input.spoiler_policy || null, 
      input.adaptation_policy || null, input.research_depth || null, 'in_progress', 1, 
      input.assigned_to || null, now, now
    ]
  );
  
  // Create 16 step runs for this episode
  await createStepRunsForEpisode(id);

  await logAuditEvent('EPISODE_CREATED', `Created episode EP${episodeCode}: ${input.title}`, {
    projectId, episodeId: id, metadata: { episodeCode, title: input.title, topic: input.topic }
  });

  return id;
}

export async function getEpisodes(projectId: string): Promise<Episode[]> {
  const db = await getDb();
  return await db.select<Episode[]>(
    'SELECT * FROM episodes WHERE project_id = $1 ORDER BY created_at DESC',
    [projectId]
  );
}

export async function getEpisode(episodeId: string): Promise<Episode | null> {
  const db = await getDb();
  const rows = await db.select<Episode[]>('SELECT * FROM episodes WHERE id = $1', [episodeId]);
  return rows.length > 0 ? rows[0] : null;
}

const ALLOWED_EPISODE_UPDATE_FIELDS = new Set<string>([
  'channel_id',
  'title',
  'topic',
  'primary_work',
  'target_language',
  'target_region',
  'target_audience',
  'desired_tone',
  'spoiler_policy',
  'adaptation_policy',
  'research_depth',
  'status',
  'current_step_number',
  'assigned_to',
]);

export async function updateEpisode(episodeId: string, input: Partial<CreateEpisodeInput>): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  
  const fields: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;
  
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      if (!ALLOWED_EPISODE_UPDATE_FIELDS.has(key)) {
        throw new Error(`Invalid episode update field: ${key}`);
      }
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }
  
  if (fields.length === 0) return;
  
  fields.push(`updated_at = $${paramIndex}`);
  values.push(now);
  paramIndex++;
  
  values.push(episodeId);
  
  await db.execute(
    `UPDATE episodes SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
}

export async function deleteChannel(channelId: string): Promise<void> {
  const db = await getDb();
  await db.execute('DELETE FROM channels WHERE id = $1', [channelId]);
}

export async function deleteEpisode(episodeId: string): Promise<void> {
  const db = await getDb();
  const ep = await getEpisode(episodeId);
  if (!ep) return;

  try {
    await db.execute('PRAGMA foreign_keys = ON;');
  } catch (e) {
    console.warn('[DB] Failed to enable foreign keys for delete operation:', e);
  }

  await db.execute('DELETE FROM episodes WHERE id = $1', [episodeId]);

  await logAuditEvent('EPISODE_DELETED', `Deleted episode EP${ep.episode_code}: ${ep.title}`, {
    projectId: ep.project_id,
    episodeId: ep.id,
    metadata: { episodeCode: ep.episode_code, title: ep.title }
  });
}

