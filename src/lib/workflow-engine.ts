import { getDb } from './database';
import { WorkflowState, WorkflowStepDefinition, WorkflowStepRun } from '../types';
import { generateId } from './id-generator';
import { saveSnapshot, readSnapshot } from './snapshot-manager';
import { logAuditEvent } from './audit';
import { getSetting } from './settings-service';
import { createFolder, uploadDoc } from './drive-service';

export async function initProjectAndEpisode() {
  console.log('[Workflow] initProjectAndEpisode starting...');
  const db = await getDb();
  const projId = 'proj_default';
  const chanId = 'chan_default';
  const epId = 'ep_001';

  const projects = await db.select<any[]>('SELECT * FROM projects WHERE id = $1', [projId]);
  if (projects.length === 0) {
    console.log('[Workflow] Creating default project...');
    await db.execute(
      'INSERT INTO projects (id, name, created_at, updated_at) VALUES ($1, $2, $3, $4)',
      [projId, 'Director Cut Project', new Date().toISOString(), new Date().toISOString()]
    );
  }

  const channels = await db.select<any[]>('SELECT * FROM channels WHERE id = $1', [chanId]);
  if (channels.length === 0) {
    console.log('[Workflow] Creating default channel...');
    await db.execute(
      'INSERT INTO channels (id, project_id, name, created_at, updated_at) VALUES ($1, $2, $3, $4, $5)',
      [chanId, projId, 'Main Channel', new Date().toISOString(), new Date().toISOString()]
    );
  }

  const episodes = await db.select<any[]>('SELECT * FROM episodes WHERE id = $1', [epId]);
  if (episodes.length === 0) {
    console.log('[Workflow] Creating default episode + step runs...');
    await db.execute(
      `INSERT INTO episodes (id, project_id, channel_id, episode_code, title, slug, topic, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [epId, projId, chanId, '001', 'First Essay', 'first-essay', 'AI Evolution', 'in_progress', new Date().toISOString(), new Date().toISOString()]
    );
    await createStepRunsForEpisode(epId);
  } else {
    console.log('[Workflow] Episode already exists, skipping step run creation.');
  }
  console.log('[Workflow] initProjectAndEpisode complete.');
}

export async function checkStepDependencies(episodeId: string, stepDefId: string): Promise<boolean> {
  const db = await getDb();
  
  const dependencies = await db.select<any[]>(
    'SELECT * FROM workflow_step_dependencies WHERE step_definition_id = $1',
    [stepDefId]
  );
  
  if (dependencies.length === 0) return true;

  for (const dep of dependencies) {
    const approvedArtifacts = await db.select<any[]>(
      `SELECT a.id FROM artifacts a 
       WHERE a.episode_id = $1 AND a.artifact_type = $2 AND a.status = 'approved'`,
      [episodeId, dep.required_artifact_type]
    );

    if (approvedArtifacts.length === 0 && dep.is_required) {
      return false; 
    }
  }

  return true;
}

export async function createStepRunsForEpisode(episodeId: string): Promise<void> {
  const db = await getDb();
  
  const stepDefs = await db.select<WorkflowStepDefinition[]>(
    'SELECT * FROM workflow_step_definitions ORDER BY sort_order ASC'
  );
  console.log(`[Workflow] Creating step runs for ${stepDefs.length} step definitions...`);

  for (const def of stepDefs) {
    const isUnlocked = await checkStepDependencies(episodeId, def.id);
    const initialState: WorkflowState = isUnlocked ? 'ready' : 'blocked';
    console.log(`[Workflow]   Step ${def.step_number} (${def.id}): ${initialState}`);
    
    await db.execute(
      `INSERT INTO workflow_step_runs 
       (id, episode_id, step_definition_id, step_number, step_key, state, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        generateId('steprun'),
        episodeId,
        def.id,
        def.step_number,
        def.step_key,
        initialState,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );
  }
  console.log('[Workflow] Step runs created.');
}

export async function getStepRuns(episodeId: string): Promise<WorkflowStepRun[]> {
  const db = await getDb();
  return await db.select<WorkflowStepRun[]>(
    'SELECT * FROM workflow_step_runs WHERE episode_id = $1 ORDER BY step_number ASC',
    [episodeId]
  );
}

export async function evaluateDependencies(episodeId: string): Promise<void> {
  const db = await getDb();
  const stepRuns = await getStepRuns(episodeId);
  
  let allApproved = true;

  for (const run of stepRuns) {
    if (run.state !== 'approved') {
      allApproved = false;
    }
    
    if (run.state === 'blocked') {
      const isUnlocked = await checkStepDependencies(episodeId, run.step_definition_id);
      if (isUnlocked) {
        await db.execute(
          'UPDATE workflow_step_runs SET state = $1, updated_at = $2 WHERE id = $3',
          ['ready', new Date().toISOString(), run.id]
        );
      }
    }
  }

  // Update overall episode status
  const finalStatus = allApproved && stepRuns.length === 16 ? 'workflow_complete' : 'in_progress';
  await db.execute(
    'UPDATE episodes SET status = $1, updated_at = $2 WHERE id = $3',
    [finalStatus, new Date().toISOString(), episodeId]
  );
}

export async function saveCandidate(episodeId: string, stepRunId: string, content: string, renderedPrompt?: string): Promise<void> {
  console.log(`[SaveCandidate] Starting — episodeId=${episodeId}, stepRunId=${stepRunId}, contentLength=${content.length}`);
  const db = await getDb();
  
  const stepRunRows = await db.select<WorkflowStepRun[]>('SELECT * FROM workflow_step_runs WHERE id = $1', [stepRunId]);
  console.log(`[SaveCandidate] Step run query returned ${stepRunRows.length} rows for id=${stepRunId}`);
  if (stepRunRows.length === 0) {
    throw new Error(`[SaveCandidate] FATAL: No step run found with id=${stepRunId}`);
  }
  const stepRun = stepRunRows[0];
  console.log(`[SaveCandidate] Step run: step_number=${stepRun.step_number}, step_def=${stepRun.step_definition_id}, state=${stepRun.state}`);
  
  const stepDefRows = await db.select<WorkflowStepDefinition[]>('SELECT * FROM workflow_step_definitions WHERE id = $1', [stepRun.step_definition_id]);
  if (stepDefRows.length === 0) {
    throw new Error(`[SaveCandidate] FATAL: No step definition found with id=${stepRun.step_definition_id}`);
  }
  const stepDef = stepDefRows[0];
  console.log(`[SaveCandidate] Step def: output_artifact_type=${stepDef.output_artifact_type}, label=${stepDef.short_label}`);
  
  // Find or create artifact
  let artifacts = await db.select<any[]>('SELECT * FROM artifacts WHERE step_run_id = $1', [stepRunId]);
  let artifactId;
  if (artifacts.length === 0) {
    artifactId = generateId('art');
    console.log(`[SaveCandidate] Creating new artifact: ${artifactId}`);
    await db.execute(
      `INSERT INTO artifacts (id, episode_id, step_run_id, step_number, artifact_type, title, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [artifactId, episodeId, stepRunId, stepRun.step_number, stepDef.output_artifact_type, `${stepDef.short_label} Artifact`, 'in_progress', new Date().toISOString(), new Date().toISOString()]
    );
  } else {
    artifactId = artifacts[0].id;
    console.log(`[SaveCandidate] Reusing existing artifact: ${artifactId}`);
  }
  
  // Count versions to determine v00X
  const versions = await db.select<any[]>('SELECT id FROM artifact_versions WHERE artifact_id = $1', [artifactId]);
  const versionNumber = versions.length + 1;
  console.log(`[SaveCandidate] Version number: ${versionNumber}`);
  
  // Save snapshot physically
  const snapshotPath = await saveSnapshot('001', stepRun.step_number, stepDef.output_artifact_type, versionNumber, content);
  console.log(`[SaveCandidate] Snapshot saved at: ${snapshotPath}`);
  
  let renderedPromptPath = null;
  if (renderedPrompt) {
    renderedPromptPath = await saveSnapshot('001', stepRun.step_number, `${stepDef.output_artifact_type}_prompt`, versionNumber, renderedPrompt);
  }

  const versionId = generateId('artv');
  console.log(`[SaveCandidate] Creating artifact version: ${versionId}`);
  await db.execute(
    `INSERT INTO artifact_versions (id, artifact_id, episode_id, step_run_id, version_number, title, content_hash, local_snapshot_path, rendered_prompt_snapshot_path, source_type, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
    [versionId, artifactId, episodeId, stepRunId, versionNumber, `Version ${versionNumber}`, 'mock_hash', snapshotPath, renderedPromptPath, 'manual_paste', 'candidate', new Date().toISOString(), new Date().toISOString()]
  );
  
  // Update step run state
  console.log(`[SaveCandidate] Updating step run state to awaiting_review, selected_version=${versionId}`);
  await db.execute(
    'UPDATE workflow_step_runs SET state = $1, selected_artifact_version_id = $2, updated_at = $3 WHERE id = $4',
    ['awaiting_review', versionId, new Date().toISOString(), stepRunId]
  );
  
  // Verify the update
  const verifyRun = await db.select<any[]>('SELECT state, selected_artifact_version_id FROM workflow_step_runs WHERE id = $1', [stepRunId]);
  console.log(`[SaveCandidate] Verify after update: state=${verifyRun[0]?.state}, selected_version=${verifyRun[0]?.selected_artifact_version_id}`);
  console.log('[SaveCandidate] Complete.');

  await logAuditEvent('OUTPUT_CREATED', `Saved candidate v${versionNumber} for step ${stepRun.step_number}`, {
    episodeId, stepRunId, metadata: { versionId, versionNumber, snapshotPath }
  });
}

export async function approveCandidate(episodeId: string, stepRunId: string, versionId?: string): Promise<void> {
  const db = await getDb();
  
  const stepRun = (await db.select<WorkflowStepRun[]>('SELECT * FROM workflow_step_runs WHERE id = $1', [stepRunId]))[0];
  const targetVersionId = versionId || stepRun?.selected_artifact_version_id;
  if (!targetVersionId) return;
  
  const artifacts = await db.select<any[]>('SELECT id FROM artifacts WHERE step_run_id = $1', [stepRunId]);
  if (artifacts.length > 0) {
    const artifactId = artifacts[0].id;

    // Supersede previously approved version if it's different
    await db.execute(
      'UPDATE artifact_versions SET status = $1, updated_at = $2 WHERE artifact_id = $3 AND status = $4',
      ['superseded', new Date().toISOString(), artifactId, 'approved']
    );

    // Mark specific version as approved
    await db.execute(
      'UPDATE artifact_versions SET status = $1, updated_at = $2 WHERE id = $3',
      ['approved', new Date().toISOString(), targetVersionId]
    );

    // Mark artifact as approved
    await db.execute(
      'UPDATE artifacts SET status = $1, approved_version_id = $2, updated_at = $3 WHERE id = $4',
      ['approved', targetVersionId, new Date().toISOString(), artifactId]
    );
  }
  
  // Create human review record
  await db.execute(
    `INSERT INTO human_reviews (id, episode_id, step_run_id, artifact_version_id, decision, reviewed_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [generateId('rev'), episodeId, stepRunId, targetVersionId, 'approve', new Date().toISOString(), new Date().toISOString()]
  );
  
  // Update step run state and selected version
  await db.execute(
    'UPDATE workflow_step_runs SET state = $1, selected_artifact_version_id = $2, updated_at = $3 WHERE id = $4',
    ['approved', targetVersionId, new Date().toISOString(), stepRunId]
  );

  // Auto-extract and save variables from the approved version if step is 3 or 4
  if (stepRun && (stepRun.step_number === 3 || stepRun.step_number === 4)) {
    try {
      const version = (await db.select<any[]>('SELECT local_snapshot_path FROM artifact_versions WHERE id = $1', [targetVersionId]))[0];
      if (version) {
        const content = await readSnapshot(version.local_snapshot_path);
        const { thesis, narratorMode } = extractCreativeVariables(content);
        if (thesis) {
          await saveEpisodeVariable(episodeId, 'final_thesis', thesis, 'system', targetVersionId);
          console.log(`[WorkflowEngine] Auto-extracted final_thesis: "${thesis}"`);
        }
        if (narratorMode) {
          await saveEpisodeVariable(episodeId, 'narrator_mode', narratorMode, 'system', targetVersionId);
          console.log(`[WorkflowEngine] Auto-extracted narrator_mode: "${narratorMode}"`);
        }
      }
    } catch (err) {
      console.error('[WorkflowEngine] Failed to auto-extract creative variables during approval:', err);
    }
  }
  
  await evaluateDependencies(episodeId);

  await logAuditEvent('HUMAN_APPROVED', `Approved version for step run ${stepRunId}`, {
    episodeId, stepRunId, metadata: { targetVersionId }
  });

  // Trigger Google Drive sync asynchronously (non-blocking)
  syncVersionToDrive(episodeId, stepRunId, targetVersionId).catch(err => {
    console.error("[approveCandidate] Drive sync failed:", err);
  });
}

export async function syncVersionToDrive(episodeId: string, stepRunId: string, versionId: string): Promise<void> {
  try {
    const isConnected = await getSetting("gdrive_access_token");
    if (!isConnected) {
      console.log("[DriveSync] Google Drive not connected. Skipping upload.");
      return;
    }

    console.log(`[DriveSync] Starting sync for versionId=${versionId}...`);
    const db = await getDb();
    
    // Fetch episode & project
    const episode = (await db.select<any[]>('SELECT * FROM episodes WHERE id = $1', [episodeId]))[0];
    if (!episode) return;
    
    const project = (await db.select<any[]>('SELECT * FROM projects WHERE id = $1', [episode.project_id]))[0];
    if (!project) return;

    // Fetch step run & version details
    const stepRun = (await db.select<WorkflowStepRun[]>('SELECT * FROM workflow_step_runs WHERE id = $1', [stepRunId]))[0];
    if (!stepRun) return;

    const version = (await db.select<any[]>('SELECT * FROM artifact_versions WHERE id = $1', [versionId]))[0];
    if (!version) return;

    // Read local snapshot file content
    const content = await readSnapshot(version.local_snapshot_path);

    // Get or create Drive Folder for the episode
    let driveFolderId = episode.drive_folder_id;
    if (!driveFolderId) {
      console.log(`[DriveSync] Episode has no Drive folder. Creating folder...`);
      const rootFolderId = await getSetting("gdrive_root_folder_id") || undefined;
      const folderName = `EP${episode.episode_code} — ${episode.title}`;
      try {
        driveFolderId = await createFolder(folderName, rootFolderId);
        const folderUrl = `https://drive.google.com/drive/folders/${driveFolderId}`;
        await db.execute(
          'UPDATE episodes SET drive_folder_id = $1, drive_folder_url = $2, updated_at = $3 WHERE id = $4',
          [driveFolderId, folderUrl, new Date().toISOString(), episodeId]
        );
        console.log(`[DriveSync] Created episode folder driveFolderId=${driveFolderId}`);
      } catch (folderErr: any) {
        console.error("[DriveSync] Failed to create folder:", folderErr);
        await logAuditEvent('SYNC_FAILED', `Failed to create episode folder: ${folderErr.message}`, { episodeId });
        return;
      }
    }

    // Upload Document
    const fileTitle = `EP${episode.episode_code}_Step${String(stepRun.step_number).padStart(2, '0')}_${stepRun.step_key}_v${version.version_number}`;
    console.log(`[DriveSync] Uploading document '${fileTitle}' to folder ${driveFolderId}...`);
    
    const uploadResult = await uploadDoc(fileTitle, content, driveFolderId);
    console.log(`[DriveSync] Upload complete. fileId=${uploadResult.fileId}`);

    // Log the link in drive_file_links
    const linkId = generateId('dfl');
    await db.execute(
      `INSERT INTO drive_file_links (id, project_id, episode_id, artifact_version_id, drive_file_id, drive_file_url, drive_folder_id, file_name, mime_type, link_type, sync_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        linkId,
        project.id,
        episodeId,
        versionId,
        uploadResult.fileId,
        uploadResult.fileUrl,
        driveFolderId,
        fileTitle,
        'application/vnd.google-apps.document',
        'output_artifact',
        'synced',
        new Date().toISOString(),
        new Date().toISOString()
      ]
    );

    await logAuditEvent('SYNC_COMPLETED', `Uploaded version to Google Drive: ${fileTitle}`, {
      episodeId, stepRunId, metadata: { fileId: uploadResult.fileId, url: uploadResult.fileUrl }
    });
  } catch (syncErr: any) {
    console.error("[DriveSync] Error syncing version:", syncErr);
    await logAuditEvent('SYNC_FAILED', `Google Drive sync failed: ${syncErr.message || syncErr}`, {
      episodeId, stepRunId, metadata: { versionId }
    });
  }
}

export interface ArtifactVersionPayload {
  id: string;
  version_number: number;
  title: string;
  status: string;
  source_type: string;
  created_at: string;
  local_snapshot_path: string;
  content: string;
}

export async function getArtifactVersions(stepRunId: string): Promise<ArtifactVersionPayload[]> {
  const db = await getDb();
  const artifacts = await db.select<any[]>('SELECT id FROM artifacts WHERE step_run_id = $1', [stepRunId]);
  console.log(`[getArtifactVersions] stepRunId=${stepRunId}, artifacts found=${artifacts.length}`);
  if (artifacts.length === 0) return [];

  const versions = await db.select<any[]>(
    'SELECT * FROM artifact_versions WHERE artifact_id = $1 ORDER BY version_number DESC',
    [artifacts[0].id]
  );
  console.log(`[getArtifactVersions] versions found=${versions.length} for artifact=${artifacts[0].id}`);

  return versions.map(v => ({
    id: v.id,
    version_number: v.version_number,
    title: v.title,
    status: v.status,
    source_type: v.source_type,
    created_at: v.created_at,
    local_snapshot_path: v.local_snapshot_path,
    content: ''
  }));
}

export async function getSelectedArtifactVersion(stepRunId: string, versionId?: string): Promise<ArtifactVersionPayload | null> {
  const db = await getDb();
  
  const stepRun = (await db.select<WorkflowStepRun[]>('SELECT * FROM workflow_step_runs WHERE id = $1', [stepRunId]))[0];
  const targetVersionId = versionId || stepRun?.selected_artifact_version_id;
  console.log(`[getSelectedVersion] stepRunId=${stepRunId}, targetVersionId=${targetVersionId}`);
  if (!targetVersionId) {
    console.log('[getSelectedVersion] No version ID found, returning null');
    return null;
  }

  const version = (await db.select<any[]>('SELECT * FROM artifact_versions WHERE id = $1', [targetVersionId]))[0];
  if (!version) {
    console.log(`[getSelectedVersion] Version ${targetVersionId} not found in DB`);
    return null;
  }
  console.log(`[getSelectedVersion] Found version: v${version.version_number}, path=${version.local_snapshot_path}`);

  let content = '';
  try {
    content = await readSnapshot(version.local_snapshot_path);
    console.log(`[getSelectedVersion] Snapshot read OK, content length=${content.length}`);
  } catch (err) {
    console.error('[getSelectedVersion] Snapshot read FAILED:', err);
    content = '__ERROR_MISSING_SNAPSHOT__';
  }

  return {
    id: version.id,
    version_number: version.version_number,
    title: version.title,
    status: version.status,
    source_type: version.source_type,
    created_at: version.created_at,
    local_snapshot_path: version.local_snapshot_path,
    content,
  };
}

export async function rejectCandidate(episodeId: string, stepRunId: string, versionId?: string): Promise<void> {
  const db = await getDb();
  
  const stepRun = (await db.select<WorkflowStepRun[]>('SELECT * FROM workflow_step_runs WHERE id = $1', [stepRunId]))[0];
  const targetVersionId = versionId || stepRun?.selected_artifact_version_id;
  if (!targetVersionId) return;
  
  // Mark version as rejected
  await db.execute(
    'UPDATE artifact_versions SET status = $1, updated_at = $2 WHERE id = $3',
    ['rejected', new Date().toISOString(), targetVersionId]
  );
  
  // Create human review record
  await db.execute(
    `INSERT INTO human_reviews (id, episode_id, step_run_id, artifact_version_id, decision, reviewed_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [generateId('rev'), episodeId, stepRunId, targetVersionId, 'reject', new Date().toISOString(), new Date().toISOString()]
  );
  
  await db.execute(
    'UPDATE workflow_step_runs SET state = $1, updated_at = $2 WHERE id = $3',
    ['ready', new Date().toISOString(), stepRunId]
  );

  await logAuditEvent('HUMAN_REJECTED', `Rejected version for step run ${stepRunId}`, {
    episodeId, stepRunId, metadata: { targetVersionId }
  });
}

export async function getHumanNotes(episodeId: string, stepId: number): Promise<string> {
  const db = await getDb();
  const key = `human_notes_step_${stepId}`;
  const rows = await db.select<any[]>('SELECT value_text FROM episode_variables WHERE episode_id = $1 AND variable_key = $2', [episodeId, key]);
  return rows.length > 0 ? (rows[0].value_text || '') : '';
}

export async function saveHumanNotes(episodeId: string, stepId: number, notesText: string): Promise<void> {
  const db = await getDb();
  const key = `human_notes_step_${stepId}`;
  
  const existing = await db.select<any[]>('SELECT id FROM episode_variables WHERE episode_id = $1 AND variable_key = $2', [episodeId, key]);
  
  if (existing.length > 0) {
    await db.execute(
      'UPDATE episode_variables SET value_text = $1, updated_at = $2 WHERE id = $3',
      [notesText, new Date().toISOString(), existing[0].id]
    );
  } else {
    await db.execute(
      `INSERT INTO episode_variables (id, episode_id, variable_key, value_text, source_type, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [generateId('epvar'), episodeId, key, notesText, 'human_input', new Date().toISOString(), new Date().toISOString()]
    );
  }

  // Auto-extract and save variables if step is 3 or 4
  if (stepId === 3 || stepId === 4) {
    try {
      const { thesis, narratorMode } = extractCreativeVariables(notesText);
      if (thesis) {
        await saveEpisodeVariable(episodeId, 'final_thesis', thesis, 'human_input');
      }
      if (narratorMode) {
        await saveEpisodeVariable(episodeId, 'narrator_mode', narratorMode, 'human_input');
      }
    } catch (err) {
      console.error('[WorkflowEngine] Failed to extract creative variables from human notes:', err);
    }
  }
}

export function extractCreativeVariables(content: string): { thesis?: string; narratorMode?: string } {
  const result: { thesis?: string; narratorMode?: string } = {};

  const thesisRegexes = [
    /\*\*?Selected Thesis\*\*?:\s*(.+)/i,
    /\*\*?Final Thesis\*\*?:\s*(.+)/i,
    /\*\*?Thesis Statement\*\*?:\s*(.+)/i,
    /\*\*?Thesis\*\*?:\s*(.+)/i,
    /\*\*?Chosen Thesis\*\*?:\s*(.+)/i,
    /Selected Thesis\s*-\s*(.+)/i,
    /Final Thesis\s*-\s*(.+)/i,
  ];

  const narratorRegexes = [
    /\*\*?Selected Narrator Mode\*\*?:\s*(.+)/i,
    /\*\*?Narrator Mode\*\*?:\s*(.+)/i,
    /\*\*?Narrator Voice\*\*?:\s*(.+)/i,
    /\*\*?Voice\*\*?:\s*(.+)/i,
    /\*\*?Voice\/Tone\*\*?:\s*(.+)/i,
    /Selected Narrator Mode\s*-\s*(.+)/i,
    /Narrator Mode\s*-\s*(.+)/i,
  ];

  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!result.thesis) {
      for (const rx of thesisRegexes) {
        const match = trimmed.match(rx);
        if (match && match[1]) {
          result.thesis = match[1].trim().replace(/^["']|["']$/g, '');
          break;
        }
      }
    }
    if (!result.narratorMode) {
      for (const rx of narratorRegexes) {
        const match = trimmed.match(rx);
        if (match && match[1]) {
          result.narratorMode = match[1].trim().replace(/^["']|["']$/g, '');
          break;
        }
      }
    }
  }

  // Fallback section scanning if simple line matching fails
  if (!result.thesis || !result.narratorMode) {
    let currentHeader = '';
    const sectionLines: string[] = [];
    for (const line of lines) {
      const headerMatch = line.match(/^#{2,4}\s+(.+)$/);
      if (headerMatch) {
        if (currentHeader) {
          const sectionText = sectionLines.join('\n').trim();
          if (currentHeader.toLowerCase().includes('thesis') && !result.thesis) {
            result.thesis = sectionText.split('\n')[0].trim();
          } else if ((currentHeader.toLowerCase().includes('narrator') || currentHeader.toLowerCase().includes('voice')) && !result.narratorMode) {
            result.narratorMode = sectionText.split('\n')[0].trim();
          }
        }
        currentHeader = headerMatch[1].trim();
        sectionLines.length = 0;
      } else if (currentHeader) {
        sectionLines.push(line);
      }
    }
    if (currentHeader) {
      const sectionText = sectionLines.join('\n').trim();
      if (currentHeader.toLowerCase().includes('thesis') && !result.thesis) {
        result.thesis = sectionText.split('\n')[0].trim();
      } else if ((currentHeader.toLowerCase().includes('narrator') || currentHeader.toLowerCase().includes('voice')) && !result.narratorMode) {
        result.narratorMode = sectionText.split('\n')[0].trim();
      }
    }
  }

  return result;
}

export async function saveEpisodeVariable(
  episodeId: string, 
  key: string, 
  value: string, 
  sourceType = 'system', 
  sourceVersionId?: string
): Promise<void> {
  const db = await getDb();
  const existing = await db.select<any[]>('SELECT id FROM episode_variables WHERE episode_id = $1 AND variable_key = $2', [episodeId, key]);
  
  if (existing.length > 0) {
    await db.execute(
      'UPDATE episode_variables SET value_text = $1, source_type = $2, source_artifact_version_id = $3, updated_at = $4 WHERE id = $5',
      [value, sourceType, sourceVersionId || null, new Date().toISOString(), existing[0].id]
    );
  } else {
    await db.execute(
      `INSERT INTO episode_variables (id, episode_id, variable_key, value_text, source_type, source_artifact_version_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [generateId('epvar'), episodeId, key, value, sourceType, sourceVersionId || null, new Date().toISOString(), new Date().toISOString()]
    );
  }
}

export async function getEpisodeVariable(episodeId: string, key: string): Promise<string> {
  const db = await getDb();
  const rows = await db.select<any[]>('SELECT value_text FROM episode_variables WHERE episode_id = $1 AND variable_key = $2', [episodeId, key]);
  return rows.length > 0 ? (rows[0].value_text || '') : '';
}

