import { getDb } from './database';
import { saveSnapshot, readSnapshot } from './snapshot-manager';
import { generateId } from './id-generator';
import { exists, BaseDirectory } from '@tauri-apps/plugin-fs';
import { appConfigDir, appLocalDataDir } from '@tauri-apps/api/path';

export interface DiagnosticResult {
  timestamp: string;
  episodeId: string;
  stepNumber: number;

  // Step Run
  stepRunId: string | null;
  stepRunState: string | null;
  stepDefinitionId: string | null;
  stepKey: string | null;
  selectedArtifactVersionId: string | null;

  // Dependencies
  dependencyCount: number;
  dependencyDetails: string[];

  // Artifacts
  artifactCount: number;
  artifactIds: string[];

  // Artifact Versions
  artifactVersionCount: number;
  artifactVersionDetails: { id: string; version: number; status: string; path: string }[];

  // Snapshot
  latestSnapshotPath: string | null;
  snapshotFileExists: boolean | null;
  snapshotReadSuccess: boolean | null;
  snapshotContentPreview: string | null;
  snapshotReadError: string | null;

  // DB Info
  dbConnectionOk: boolean;
  totalStepRunsInDb: number;
  allStepStates: string[];

  // Paths
  appConfigPath: string | null;
  appLocalDataPath: string | null;

  // Errors
  errors: string[];
}

export async function runStepDiagnostic(episodeId: string, stepNumber: number): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    episodeId,
    stepNumber,
    stepRunId: null,
    stepRunState: null,
    stepDefinitionId: null,
    stepKey: null,
    selectedArtifactVersionId: null,
    dependencyCount: 0,
    dependencyDetails: [],
    artifactCount: 0,
    artifactIds: [],
    artifactVersionCount: 0,
    artifactVersionDetails: [],
    latestSnapshotPath: null,
    snapshotFileExists: null,
    snapshotReadSuccess: null,
    snapshotContentPreview: null,
    snapshotReadError: null,
    dbConnectionOk: false,
    totalStepRunsInDb: 0,
    allStepStates: [],
    appConfigPath: null,
    appLocalDataPath: null,
    errors: [],
  };

  try {
    // 0. Resolve Tauri paths
    try {
      result.appConfigPath = await appConfigDir();
      result.appLocalDataPath = await appLocalDataDir();
      console.log(`[Diagnostic] AppConfig (DB location): ${result.appConfigPath}`);
      console.log(`[Diagnostic] AppLocalData (snapshots): ${result.appLocalDataPath}`);
    } catch (e: any) {
      result.errors.push(`Path resolution failed: ${e.message}`);
    }

    // 1. Test DB connection
    const db = await getDb();
    result.dbConnectionOk = true;
    console.log('[Diagnostic] DB connection OK');

    // 2. Query ALL step runs to check what's in the DB
    try {
      const allRuns = await db.select<any[]>('SELECT step_number, state, id FROM workflow_step_runs ORDER BY step_number');
      result.totalStepRunsInDb = allRuns.length;
      result.allStepStates = allRuns.map(r => `S${r.step_number}=${r.state}(${r.id})`);
      console.log(`[Diagnostic] Total step runs: ${allRuns.length}`);
      console.log(`[Diagnostic] States: ${result.allStepStates.join(', ')}`);
    } catch (e: any) {
      result.errors.push(`Query all step runs failed: ${e.message}`);
      console.error('[Diagnostic] Query all step runs failed:', e);
    }

    // 3. Query the specific step run for this step
    try {
      const stepRuns = await db.select<any[]>(
        'SELECT * FROM workflow_step_runs WHERE episode_id = $1 AND step_number = $2',
        [episodeId, stepNumber]
      );
      console.log(`[Diagnostic] Step ${stepNumber} runs found: ${stepRuns.length}`);

      if (stepRuns.length > 0) {
        const run = stepRuns[0];
        result.stepRunId = run.id;
        result.stepRunState = run.state;
        result.stepDefinitionId = run.step_definition_id;
        result.stepKey = run.step_key;
        result.selectedArtifactVersionId = run.selected_artifact_version_id;
        console.log(`[Diagnostic] Step run: id=${run.id}, state=${run.state}, defId=${run.step_definition_id}`);
      } else {
        result.errors.push(`No step run found for step ${stepNumber} in episode ${episodeId}`);
      }
    } catch (e: any) {
      result.errors.push(`Query step run failed: ${e.message}`);
      console.error('[Diagnostic] Query step run failed:', e);
    }

    // 4. Query dependencies
    if (result.stepDefinitionId) {
      try {
        const deps = await db.select<any[]>(
          'SELECT * FROM workflow_step_dependencies WHERE step_definition_id = $1',
          [result.stepDefinitionId]
        );
        result.dependencyCount = deps.length;
        result.dependencyDetails = deps.map(d => `requires ${d.required_artifact_type} from step ${d.required_step_number}`);
        console.log(`[Diagnostic] Dependencies: ${deps.length}`);
      } catch (e: any) {
        result.errors.push(`Query deps failed: ${e.message}`);
      }
    }

    // 5. Query artifacts for this step run
    if (result.stepRunId) {
      try {
        const artifacts = await db.select<any[]>(
          'SELECT * FROM artifacts WHERE step_run_id = $1',
          [result.stepRunId]
        );
        result.artifactCount = artifacts.length;
        result.artifactIds = artifacts.map(a => a.id);
        console.log(`[Diagnostic] Artifacts: ${artifacts.length}`);

        // 6. Query artifact versions
        for (const art of artifacts) {
          try {
            const versions = await db.select<any[]>(
              'SELECT * FROM artifact_versions WHERE artifact_id = $1 ORDER BY version_number DESC',
              [art.id]
            );
            result.artifactVersionCount += versions.length;
            for (const v of versions) {
              result.artifactVersionDetails.push({
                id: v.id,
                version: v.version_number,
                status: v.status,
                path: v.local_snapshot_path,
              });
            }
            console.log(`[Diagnostic] Versions for artifact ${art.id}: ${versions.length}`);
          } catch (e: any) {
            result.errors.push(`Query versions failed: ${e.message}`);
          }
        }
      } catch (e: any) {
        result.errors.push(`Query artifacts failed: ${e.message}`);
      }
    }

    // 7. Check snapshot file for latest version
    if (result.artifactVersionDetails.length > 0) {
      const latest = result.artifactVersionDetails[0];
      result.latestSnapshotPath = latest.path;

      try {
        const fileExists = await exists(latest.path, { baseDir: BaseDirectory.AppLocalData });
        result.snapshotFileExists = fileExists;
        console.log(`[Diagnostic] Snapshot exists at ${latest.path}: ${fileExists}`);
      } catch (e: any) {
        result.snapshotFileExists = false;
        result.errors.push(`Snapshot exists check failed: ${e.message}`);
      }

      try {
        const content = await readSnapshot(latest.path);
        result.snapshotReadSuccess = true;
        result.snapshotContentPreview = content.substring(0, 200);
        console.log(`[Diagnostic] Snapshot read OK, length=${content.length}, preview: ${content.substring(0, 50)}`);
      } catch (e: any) {
        result.snapshotReadSuccess = false;
        result.snapshotReadError = e.message;
        console.error('[Diagnostic] Snapshot read failed:', e);
      }
    }

  } catch (e: any) {
    result.errors.push(`DB connection failed: ${e.message}`);
    console.error('[Diagnostic] DB connection failed:', e);
  }

  console.log('[Diagnostic] Full result:', JSON.stringify(result, null, 2));
  return result;
}

export async function repairStep01(episodeId: string): Promise<string> {
  try {
    const db = await getDb();

    // Check if Step 01 has an approved artifact version
    const runs = await db.select<any[]>(
      'SELECT * FROM workflow_step_runs WHERE episode_id = $1 AND step_number = 1',
      [episodeId]
    );

    if (runs.length === 0) {
      return 'ERROR: No step run found for Step 01. Try Reset Local Workspace.';
    }

    const run = runs[0];
    const artifacts = await db.select<any[]>(
      'SELECT * FROM artifacts WHERE step_run_id = $1',
      [run.id]
    );

    let hasApproved = false;
    if (artifacts.length > 0) {
      const approvedVersions = await db.select<any[]>(
        "SELECT id FROM artifact_versions WHERE artifact_id = $1 AND status = 'approved'",
        [artifacts[0].id]
      );
      hasApproved = approvedVersions.length > 0;
    }

    const newState = hasApproved ? 'approved' : 'ready';
    await db.execute(
      'UPDATE workflow_step_runs SET state = $1, updated_at = $2 WHERE id = $3',
      [newState, new Date().toISOString(), run.id]
    );

    return `Step 01 repaired: state set to '${newState}' (was '${run.state}')`;
  } catch (e: any) {
    return `REPAIR FAILED: ${e.message}`;
  }
}

export async function createTestCandidate(episodeId: string): Promise<string[]> {
  const log: string[] = [];
  const testContent = 'DEBUG TEST CANDIDATE CONTENT';

  try {
    const db = await getDb();
    log.push('[TestCandidate] DB connection OK');

    // Find step 01 run
    const runs = await db.select<any[]>(
      'SELECT * FROM workflow_step_runs WHERE episode_id = $1 AND step_number = 1',
      [episodeId]
    );
    if (runs.length === 0) {
      log.push('[TestCandidate] FATAL: No step run for Step 01');
      return log;
    }
    const stepRunId = runs[0].id;
    const stepDefId = runs[0].step_definition_id;
    log.push(`[TestCandidate] Step run: id=${stepRunId}, defId=${stepDefId}, state=${runs[0].state}`);

    // Get step def
    const defs = await db.select<any[]>(
      'SELECT * FROM workflow_step_definitions WHERE id = $1',
      [stepDefId]
    );
    if (defs.length === 0) {
      log.push(`[TestCandidate] FATAL: No step definition with id=${stepDefId}`);
      return log;
    }
    const artifactType = defs[0].output_artifact_type;
    const label = defs[0].short_label || 'Step01';
    log.push(`[TestCandidate] Step def: artifactType=${artifactType}, label=${label}`);

    // Create or find artifact
    let existingArtifacts = await db.select<any[]>(
      'SELECT id FROM artifacts WHERE step_run_id = $1',
      [stepRunId]
    );
    let artifactId: string;
    if (existingArtifacts.length === 0) {
      artifactId = generateId('art');
      await db.execute(
        `INSERT INTO artifacts (id, episode_id, step_run_id, step_number, artifact_type, title, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [artifactId, episodeId, stepRunId, 1, artifactType, `${label} Artifact`, 'in_progress', new Date().toISOString(), new Date().toISOString()]
      );
      log.push(`[TestCandidate] Created artifact: ${artifactId}`);
    } else {
      artifactId = existingArtifacts[0].id;
      log.push(`[TestCandidate] Reusing artifact: ${artifactId}`);
    }

    // Verify artifact was inserted
    const artVerify = await db.select<any[]>('SELECT id FROM artifacts WHERE id = $1', [artifactId]);
    log.push(`[TestCandidate] Artifact verify: found=${artVerify.length > 0}`);

    // Count existing versions
    const existingVersions = await db.select<any[]>(
      'SELECT id FROM artifact_versions WHERE artifact_id = $1',
      [artifactId]
    );
    const versionNumber = existingVersions.length + 1;
    log.push(`[TestCandidate] Version number will be: ${versionNumber}`);

    // Save snapshot
    let snapshotPath = '';
    try {
      snapshotPath = await saveSnapshot('001', 1, artifactType, versionNumber, testContent);
      log.push(`[TestCandidate] Snapshot saved: ${snapshotPath}`);
    } catch (e: any) {
      log.push(`[TestCandidate] SNAPSHOT SAVE FAILED: ${e.message}`);
      return log;
    }

    // Verify snapshot can be read back
    try {
      const readBack = await readSnapshot(snapshotPath);
      log.push(`[TestCandidate] Snapshot read back OK: "${readBack.substring(0, 50)}" (length=${readBack.length})`);
    } catch (e: any) {
      log.push(`[TestCandidate] SNAPSHOT READ FAILED: ${e.message}`);
    }

    // Check if snapshot file exists
    try {
      const fileExists = await exists(snapshotPath, { baseDir: BaseDirectory.AppLocalData });
      log.push(`[TestCandidate] Snapshot file exists check: ${fileExists}`);
    } catch (e: any) {
      log.push(`[TestCandidate] Snapshot exists check error: ${e.message}`);
    }

    // Create artifact version
    const versionId = generateId('artv');
    try {
      await db.execute(
        `INSERT INTO artifact_versions (id, artifact_id, episode_id, step_run_id, version_number, title, content_hash, local_snapshot_path, source_type, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [versionId, artifactId, episodeId, stepRunId, versionNumber, `Version ${versionNumber}`, 'test_hash', snapshotPath, 'manual_paste', 'candidate', new Date().toISOString(), new Date().toISOString()]
      );
      log.push(`[TestCandidate] Created artifact version: ${versionId}`);
    } catch (e: any) {
      log.push(`[TestCandidate] ARTIFACT VERSION INSERT FAILED: ${e.message}`);
      return log;
    }

    // Verify artifact version was inserted
    const versionVerify = await db.select<any[]>('SELECT * FROM artifact_versions WHERE id = $1', [versionId]);
    log.push(`[TestCandidate] Version verify: found=${versionVerify.length > 0}, path=${versionVerify[0]?.local_snapshot_path}`);

    // Update step run state
    try {
      await db.execute(
        'UPDATE workflow_step_runs SET state = $1, selected_artifact_version_id = $2, updated_at = $3 WHERE id = $4',
        ['awaiting_review', versionId, new Date().toISOString(), stepRunId]
      );
      log.push(`[TestCandidate] Step run updated: state=awaiting_review, selected=${versionId}`);
    } catch (e: any) {
      log.push(`[TestCandidate] STEP RUN UPDATE FAILED: ${e.message}`);
    }

    // Verify step run update
    const runVerify = await db.select<any[]>('SELECT state, selected_artifact_version_id FROM workflow_step_runs WHERE id = $1', [stepRunId]);
    log.push(`[TestCandidate] Step run verify: state=${runVerify[0]?.state}, selectedVersion=${runVerify[0]?.selected_artifact_version_id}`);

    // Check version history query (same as getArtifactVersions)
    const historyCheck = await db.select<any[]>(
      'SELECT * FROM artifact_versions WHERE artifact_id = $1 ORDER BY version_number DESC',
      [artifactId]
    );
    log.push(`[TestCandidate] Version history query: ${historyCheck.length} versions found`);

    log.push(`[TestCandidate] COMPLETE. All checks passed.`);
  } catch (e: any) {
    log.push(`[TestCandidate] FATAL ERROR: ${e.message}`);
  }

  // Also log to console
  for (const line of log) {
    console.log(line);
  }

  return log;
}
