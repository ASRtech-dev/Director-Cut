import { getDb } from './database';
import { generateId } from './id-generator';

export type AuditEventType =
  | 'EPISODE_CREATED'
  | 'EPISODE_DELETED'
  | 'PROMPT_IMPORTED'
  | 'PROMPT_RENDERED'
  | 'OUTPUT_CREATED'
  | 'HUMAN_APPROVED'
  | 'HUMAN_REJECTED'
  | 'REGENERATION_REQUESTED'
  | 'MANUAL_EDIT_CREATED'
  | 'ARTIFACT_LOCKED'
  | 'SYNC_STARTED'
  | 'SYNC_COMPLETED'
  | 'SYNC_FAILED'
  | 'STEP_FAILED'
  | 'EPISODE_RESET'
  | 'TEMPLATE_EDITED';


export async function logAuditEvent(
  eventType: AuditEventType,
  description: string,
  options?: {
    projectId?: string;
    episodeId?: string;
    stepRunId?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    const db = await getDb();
    const id = generateId('audit');
    const now = new Date().toISOString();
    const metadataJson = options?.metadata ? JSON.stringify(options.metadata) : null;

    const activeProfile = typeof window !== 'undefined' ? localStorage.getItem('activeProfile') || 'Mina' : 'Mina';
    const enrichedDescription = `[${activeProfile}] ${description}`;

    await db.execute(
      `INSERT INTO audit_events (id, project_id, episode_id, step_run_id, event_type, event_description, metadata_json, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, options?.projectId || null, options?.episodeId || null, options?.stepRunId || null, eventType, enrichedDescription, metadataJson, now]
    );
  } catch (err) {
    // Audit logging should never crash the app
    console.error('[Audit] Failed to log event:', eventType, err);
  }
}
