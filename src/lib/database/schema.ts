export const INITIAL_SCHEMA = `
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

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

CREATE TABLE IF NOT EXISTS artifact_dependencies (
  id TEXT PRIMARY KEY,
  artifact_version_id TEXT NOT NULL,
  depends_on_artifact_version_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (artifact_version_id) REFERENCES artifact_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_artifact_version_id) REFERENCES artifact_versions(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS human_reviews (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL,
  step_run_id TEXT NOT NULL,
  artifact_version_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  feedback_text TEXT,
  reviewer_name TEXT,
  created_followup_version_id TEXT,
  reviewed_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  FOREIGN KEY (step_run_id) REFERENCES workflow_step_runs(id) ON DELETE CASCADE,
  FOREIGN KEY (artifact_version_id) REFERENCES artifact_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (created_followup_version_id) REFERENCES artifact_versions(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS drive_file_links (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  episode_id TEXT,
  artifact_version_id TEXT,
  prompt_template_id TEXT,
  drive_file_id TEXT NOT NULL,
  drive_file_url TEXT NOT NULL,
  drive_folder_id TEXT,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  remote_modified_time TEXT,
  remote_content_hash TEXT,
  link_type TEXT NOT NULL,
  sync_status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  FOREIGN KEY (artifact_version_id) REFERENCES artifact_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (prompt_template_id) REFERENCES prompt_templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sync_events (
  id TEXT PRIMARY KEY,
  project_id TEXT,
  episode_id TEXT,
  artifact_version_id TEXT,
  drive_file_link_id TEXT,
  direction TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  error_code TEXT,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  metadata_json TEXT,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (episode_id) REFERENCES episodes(id) ON DELETE CASCADE,
  FOREIGN KEY (artifact_version_id) REFERENCES artifact_versions(id) ON DELETE CASCADE,
  FOREIGN KEY (drive_file_link_id) REFERENCES drive_file_links(id) ON DELETE SET NULL
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
`;
