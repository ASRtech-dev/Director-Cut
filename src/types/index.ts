export type WorkflowState =
  | 'not_started'
  | 'blocked'
  | 'ready'
  | 'input_missing'
  | 'input_ready'
  | 'running'
  | 'output_generated'
  | 'awaiting_review'
  | 'awaiting_human_review'
  | 'approved'
  | 'rejected'
  | 'regeneration_requested'
  | 'superseded'
  | 'locked'
  | 'failed'
  | 'sync_pending'
  | 'synced'
  | 'sync_conflict';

export type ReviewDecision =
  | 'approve'
  | 'reject'
  | 'request_regeneration'
  | 'manual_edit'
  | 'save_as_alternative'
  | 'lock_version'
  | 'return_to_previous_step';

export interface Project {
  id: string;
  name: string;
  local_root_path?: string;
  drive_root_folder_id?: string;
}

export interface Channel {
  id: string;
  project_id: string;
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
  metadata_json?: string;
}

export interface Episode {
  id: string;
  project_id: string;
  channel_id?: string;
  episode_code: string;
  title: string;
  slug: string;
  topic: string;
  primary_work?: string;
  target_language?: string;
  target_region?: string;
  target_audience?: string;
  desired_tone?: string;
  spoiler_policy?: string;
  adaptation_policy?: string;
  research_depth?: string;
  status: string;
  current_step_number: number;
  assigned_to?: string;
}

export interface WorkflowStepDefinition {
  id: string;
  step_number: number;
  step_key: string;
  title: string;
  short_label: string;
  phase: string;
  description?: string;
  output_artifact_type: string;
  review_required: number;
  is_enabled: number;
  icon_name?: string;
  sort_order: number;
}

export interface WorkflowStepRun {
  id: string;
  episode_id: string;
  step_definition_id: string;
  step_number: number;
  step_key: string;
  state: WorkflowState;
  selected_prompt_template_version_id?: string;
  selected_artifact_version_id?: string;
  execution_mode?: string;
  provider?: string;
  potentially_stale: number;
}

export interface Artifact {
  id: string;
  episode_id: string;
  step_run_id: string;
  step_number: number;
  artifact_type: string;
  title: string;
  current_version_id?: string;
  approved_version_id?: string;
  status: string;
}

export interface ArtifactVersion {
  id: string;
  artifact_id: string;
  episode_id: string;
  step_run_id: string;
  version_number: number;
  title: string;
  content_hash: string;
  local_snapshot_path: string;
  rendered_prompt_snapshot_path?: string;
  source_type: string;
  status: string;
  created_at: string;
}
