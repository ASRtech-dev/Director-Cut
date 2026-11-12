import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'director_cut.db');
const db = new sqlite3.Database(dbPath);

// Promisified helper methods
export function dbAll(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function dbRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export function dbExec(query) {
  return new Promise((resolve, reject) => {
    db.exec(query, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Initial Schema & Seed Data
const INITIAL_SCHEMA = `
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  local_root_path TEXT,
  drive_root_folder_id TEXT,
  drive_root_folder_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS channels (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  language TEXT,
  region TEXT,
  target_audience TEXT,
  desired_tone TEXT,
  narrator_mode TEXT,
  visual_style TEXT,
  default_duration_minutes INTEGER,
  spoiler_policy TEXT,
  adaptation_policy TEXT,
  podcast_policy TEXT,
  shorts_policy TEXT,
  source_policy TEXT,
  outro_template TEXT,
  sponsor_guidelines TEXT,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  channel_id TEXT,
  episode_code TEXT NOT NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  topic TEXT NOT NULL,
  primary_work TEXT,
  target_language TEXT,
  target_region TEXT,
  target_audience TEXT,
  desired_tone TEXT,
  spoiler_policy TEXT,
  adaptation_policy TEXT,
  research_depth TEXT,
  status TEXT NOT NULL,
  current_step_number INTEGER DEFAULT 1,
  assigned_to TEXT,
  local_folder_path TEXT,
  drive_folder_id TEXT,
  drive_folder_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workflow_step_definitions (
  id TEXT PRIMARY KEY,
  step_number INTEGER NOT NULL UNIQUE,
  step_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  short_label TEXT NOT NULL,
  phase TEXT NOT NULL,
  description TEXT,
  output_artifact_type TEXT NOT NULL,
  review_required INTEGER NOT NULL DEFAULT 1,
  is_enabled INTEGER NOT NULL DEFAULT 1,
  icon_name TEXT,
  sort_order INTEGER NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS workflow_step_dependencies (
  id TEXT PRIMARY KEY,
  step_definition_id TEXT NOT NULL,
  required_artifact_type TEXT NOT NULL,
  required_step_number INTEGER,
  is_required INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  FOREIGN KEY (step_definition_id) REFERENCES workflow_step_definitions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workflow_step_runs (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  step_definition_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  step_key TEXT NOT NULL,
  state TEXT NOT NULL,
  selected_prompt_template_version_id TEXT,
  selected_artifact_version_id TEXT,
  execution_mode TEXT,
  provider TEXT,
  model TEXT,
  started_at TEXT,
  completed_at TEXT,
  approved_at TEXT,
  locked_at TEXT,
  failure_code TEXT,
  failure_message TEXT,
  potentially_stale INTEGER NOT NULL DEFAULT 0,
  has_unsynced_changes INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  FOREIGN KEY (step_definition_id) REFERENCES workflow_step_definitions(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS prompt_templates (
  id TEXT PRIMARY KEY,
  step_definition_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  step_key TEXT NOT NULL,
  title TEXT NOT NULL,
  source_doc_id TEXT,
  source_doc_url TEXT,
  channel_id TEXT,
  episode_id TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (step_definition_id) REFERENCES workflow_step_definitions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prompt_template_versions (
  id TEXT PRIMARY KEY,
  prompt_template_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  source_modified_time TEXT,
  content_hash TEXT NOT NULL,
  local_cache_path TEXT NOT NULL,
  raw_text TEXT,
  extracted_placeholders_json TEXT,
  placeholder_map_json TEXT,
  status TEXT NOT NULL,
  imported_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (prompt_template_id) REFERENCES prompt_templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS prompt_variables (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  value_type TEXT NOT NULL,
  source_type TEXT NOT NULL,
  is_required_by_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS step_variable_requirements (
  id TEXT PRIMARY KEY,
  step_definition_id TEXT NOT NULL,
  variable_key TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 1,
  source_type TEXT NOT NULL,
  placeholder_examples_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (step_definition_id) REFERENCES workflow_step_definitions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS episode_variables (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  variable_key TEXT NOT NULL,
  value_text TEXT,
  value_json TEXT,
  source_type TEXT NOT NULL,
  source_artifact_version_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  step_run_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  artifact_type TEXT NOT NULL,
  title TEXT NOT NULL,
  current_version_id TEXT,
  approved_version_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  FOREIGN KEY (step_run_id) REFERENCES workflow_step_runs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS artifact_versions (
  id TEXT PRIMARY KEY,
  artifact_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  step_run_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  local_snapshot_path TEXT NOT NULL,
  rendered_prompt_snapshot_path TEXT,
  source_type TEXT NOT NULL,
  parent_artifact_version_id TEXT,
  prompt_template_version_id TEXT,
  provider TEXT,
  model TEXT,
  token_input_count INTEGER,
  token_output_count INTEGER,
  estimated_cost REAL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  FOREIGN KEY (step_run_id) REFERENCES workflow_step_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_artifact_version_id) REFERENCES artifact_versions(id) ON DELETE SET NULL,
  FOREIGN KEY (prompt_template_version_id) REFERENCES prompt_template_versions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  episode_id TEXT,
  step_run_id TEXT,
  event_type TEXT NOT NULL,
  event_description TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sandbox_ideas (
  id TEXT PRIMARY KEY,
  content TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id TEXT PRIMARY KEY,
  sender TEXT NOT NULL,
  content TEXT,
  gif_url TEXT,
  created_at TEXT NOT NULL
);
`;

const SEED_DATA = `
INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, description, output_artifact_type, review_required, is_enabled, icon_name, sort_order, metadata_json, created_at, updated_at)
VALUES ('stepdef_01', 1, 'research_brief', '01 — Research Brief Builder', 'Research', 'research_and_strategy', 'Builds the initial research brief for the episode.', 'research_brief', 1, 1, 'Search', 1, '{}', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, description, output_artifact_type, review_required, is_enabled, icon_name, sort_order, metadata_json, created_at, updated_at)
VALUES ('stepdef_02', 2, 'angle_generator', '02 — Angle & Thesis Generator', 'Angles', 'research_and_strategy', 'Generates creative angles and thesis options.', 'angle_generator_output', 1, 1, 'Lightbulb', 2, '{}', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, description, output_artifact_type, review_required, is_enabled, icon_name, sort_order, metadata_json, created_at, updated_at)
VALUES ('stepdef_03', 3, 'angle_evaluator', '03 — Angle Evaluator', 'Evaluate', 'research_and_strategy', 'Evaluates angles against channel strategy.', 'angle_evaluator_output', 1, 1, 'Scale', 3, '{}', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, description, output_artifact_type, review_required, is_enabled, icon_name, sort_order, metadata_json, created_at, updated_at)
VALUES ('stepdef_04', 4, 'script_blueprint', '04 — Script Blueprint Builder', 'Blueprint', 'script_development', 'Builds the narrative structural blueprint.', 'script_blueprint', 1, 1, 'Map', 4, '{}', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, description, output_artifact_type, review_required, is_enabled, icon_name, sort_order, metadata_json, created_at, updated_at)
VALUES ('stepdef_05', 5, 'script_version_generator', '05 — Script Version Generator', 'Drafts', 'script_development', 'Generates multiple script versions based on the blueprint.', 'script_versions', 1, 1, 'FilePen', 5, '{}', datetime('now'), datetime('now'));

INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, output_artifact_type, sort_order, created_at, updated_at) VALUES 
('stepdef_06', 6, 'multi_agent_script_evaluator', '06 — Multi-Agent Script Evaluator', 'Board', 'script_development', 'multi_agent_script_evaluation', 6, datetime('now'), datetime('now')),
('stepdef_07', 7, 'master_cut_builder', '07 — Master Cut Builder', 'Master', 'script_development', 'master_cut_script', 7, datetime('now'), datetime('now')),
('stepdef_08', 8, 'final_polish', '08 — Layered Rewrite & Final Polish', 'Polish', 'script_development', 'final_polished_script', 8, datetime('now'), datetime('now')),
('stepdef_09', 9, 'visual_layer_builder', '09 — Visual Layer Builder', 'Visuals', 'production_planning', 'visual_layer_plan', 9, datetime('now'), datetime('now')),
('stepdef_10', 10, 'voice_production_plan', '10 — Voice Production Plan', 'Voice', 'production_planning', 'voice_production_plan', 10, datetime('now'), datetime('now')),
('stepdef_11', 11, 'ai_narration_generation', '11 — AI Narration Generation', 'Narration', 'production_planning', 'ai_narration_generation_plan', 11, datetime('now'), datetime('now')),
('stepdef_12', 12, 'audio_cleanup_podcast_master', '12 — Audio Cleanup & Podcast Master', 'Audio', 'production_planning', 'audio_cleanup_podcast_master_plan', 12, datetime('now'), datetime('now')),
('stepdef_13', 13, 'asset_sourcing_rights_check', '13 — Asset Sourcing & Rights Check', 'Assets', 'production_planning', 'asset_sourcing_rights_check_plan', 13, datetime('now'), datetime('now')),
('stepdef_14', 14, 'longform_video_assembly', '14 — Long-Form Video Assembly', 'Assembly', 'production_planning', 'longform_video_assembly_plan', 14, datetime('now'), datetime('now')),
('stepdef_15', 15, 'derivatives_package', '15 — Derivatives Package', 'Derivatives', 'publishing_and_derivatives', 'derivatives_package_plan', 15, datetime('now'), datetime('now')),
('stepdef_16', 16, 'final_qa_export_publish', '16 — Final QA, Export & Publish', 'Publish', 'publishing_and_derivatives', 'final_qa_export_publish_plan', 16, datetime('now'), datetime('now'));

INSERT OR IGNORE INTO workflow_step_dependencies (id, step_definition_id, required_artifact_type, required_step_number, is_required, created_at) VALUES 
('dep_02_1', 'stepdef_02', 'research_brief', 1, 1, datetime('now')),
('dep_03_1', 'stepdef_03', 'angle_generator_output', 2, 1, datetime('now')),
('dep_04_1', 'stepdef_04', 'research_brief', 1, 1, datetime('now')),
('dep_04_2', 'stepdef_04', 'angle_generator_output', 2, 1, datetime('now')),
('dep_04_3', 'stepdef_04', 'angle_evaluator_output', 3, 1, datetime('now')),
('dep_05_1', 'stepdef_05', 'research_brief', 1, 1, datetime('now')),
('dep_05_2', 'stepdef_05', 'angle_evaluator_output', 3, 1, datetime('now')),
('dep_05_3', 'stepdef_05', 'script_blueprint', 4, 1, datetime('now')),
('dep_06_1', 'stepdef_06', 'research_brief', 1, 1, datetime('now')),
('dep_06_2', 'stepdef_06', 'script_blueprint', 4, 1, datetime('now')),
('dep_06_3', 'stepdef_06', 'script_versions', 5, 1, datetime('now')),
('dep_07_1', 'stepdef_07', 'research_brief', 1, 1, datetime('now')),
('dep_07_2', 'stepdef_07', 'script_blueprint', 4, 1, datetime('now')),
('dep_07_3', 'stepdef_07', 'script_versions', 5, 1, datetime('now')),
('dep_07_4', 'stepdef_07', 'multi_agent_script_evaluation', 6, 1, datetime('now')),
('dep_08_1', 'stepdef_08', 'research_brief', 1, 1, datetime('now')),
('dep_08_2', 'stepdef_08', 'script_blueprint', 4, 1, datetime('now')),
('dep_08_3', 'stepdef_08', 'master_cut_script', 7, 1, datetime('now')),
('dep_09_1', 'stepdef_09', 'final_polished_script', 8, 1, datetime('now')),
('dep_09_2', 'stepdef_09', 'research_brief', 1, 1, datetime('now')),
('dep_09_3', 'stepdef_09', 'script_blueprint', 4, 1, datetime('now')),
('dep_10_1', 'stepdef_10', 'final_polished_script', 8, 1, datetime('now')),
('dep_11_1', 'stepdef_11', 'voice_production_plan', 10, 1, datetime('now')),
('dep_12_1', 'stepdef_12', 'final_polished_script', 8, 1, datetime('now')),
('dep_12_2', 'stepdef_12', 'voice_production_plan', 10, 1, datetime('now')),
('dep_12_3', 'stepdef_12', 'ai_narration_generation_plan', 11, 1, datetime('now')),
('dep_13_1', 'stepdef_13', 'final_polished_script', 8, 1, datetime('now')),
('dep_13_2', 'stepdef_13', 'visual_layer_plan', 9, 1, datetime('now')),
('dep_13_3', 'stepdef_13', 'voice_production_plan', 10, 1, datetime('now')),
('dep_14_1', 'stepdef_14', 'final_polished_script', 8, 1, datetime('now')),
('dep_14_2', 'stepdef_14', 'voice_production_plan', 10, 1, datetime('now')),
('dep_14_3', 'stepdef_14', 'ai_narration_generation_plan', 11, 1, datetime('now')),
('dep_14_4', 'stepdef_14', 'audio_cleanup_podcast_master_plan', 12, 1, datetime('now')),
('dep_14_5', 'stepdef_14', 'asset_sourcing_rights_check_plan', 13, 1, datetime('now')),
('dep_15_1', 'stepdef_15', 'final_polished_script', 8, 1, datetime('now')),
('dep_15_2', 'stepdef_15', 'longform_video_assembly_plan', 14, 1, datetime('now')),
('dep_16_1', 'stepdef_16', 'final_polished_script', 8, 1, datetime('now')),
('dep_16_2', 'stepdef_16', 'asset_sourcing_rights_check_plan', 13, 1, datetime('now')),
('dep_16_3', 'stepdef_16', 'derivatives_package_plan', 15, 1, datetime('now'));

INSERT OR IGNORE INTO app_settings (id, setting_key, setting_value, updated_at) VALUES 
('set_1', 'default_execution_mode', 'manual_paste', datetime('now')),
('set_2', 'theme', 'dark', datetime('now'));

-- Seed a default project
INSERT OR IGNORE INTO projects (id, name, created_at, updated_at) 
VALUES ('proj_default', 'Director Cut Studio', datetime('now'), datetime('now'));
`;

export async function initDb() {
  await dbExec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  const schemaStmts = INITIAL_SCHEMA.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of schemaStmts) {
    try {
      await dbExec(stmt);
    } catch (e) {
      console.warn('[DB Init] schema stmt failed:', e.message);
    }
  }

  const seedStmts = SEED_DATA.split(';').map(s => s.trim()).filter(s => s.length > 0);
  for (const stmt of seedStmts) {
    try {
      await dbExec(stmt);
    } catch (e) {
      // Ignored for duplicates
    }
  }

  // Ensure default migrations (like adding assigned_to)
  try {
    await dbExec("ALTER TABLE episodes ADD COLUMN assigned_to TEXT");
  } catch (e) {}

  try {
    await dbExec("ALTER TABLE channels ADD COLUMN outro_template TEXT");
  } catch (e) {}

  try {
    await dbExec("ALTER TABLE channels ADD COLUMN sponsor_guidelines TEXT");
  } catch (e) {}

  console.log('[DB] SQLite database initialized and seeded successfully.');
}
