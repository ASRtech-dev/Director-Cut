export const SEED_DATA = `
-- Step 01
INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, description, output_artifact_type, review_required, is_enabled, icon_name, sort_order, metadata_json, created_at, updated_at)
VALUES ('stepdef_01', 1, 'research_brief', '01 — Research Brief Builder', 'Research', 'research_and_strategy', 'Builds the initial research brief for the episode.', 'research_brief', 1, 1, 'Search', 1, '{}', datetime('now'), datetime('now'));

-- Step 02
INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, description, output_artifact_type, review_required, is_enabled, icon_name, sort_order, metadata_json, created_at, updated_at)
VALUES ('stepdef_02', 2, 'angle_generator', '02 — Angle & Thesis Generator', 'Angles', 'research_and_strategy', 'Generates creative angles and thesis options.', 'angle_generator_output', 1, 1, 'Lightbulb', 2, '{}', datetime('now'), datetime('now'));

-- Step 03
INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, description, output_artifact_type, review_required, is_enabled, icon_name, sort_order, metadata_json, created_at, updated_at)
VALUES ('stepdef_03', 3, 'angle_evaluator', '03 — Angle Evaluator', 'Evaluate', 'research_and_strategy', 'Evaluates angles against channel strategy.', 'angle_evaluator_output', 1, 1, 'Scale', 3, '{}', datetime('now'), datetime('now'));

-- Step 04
INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, description, output_artifact_type, review_required, is_enabled, icon_name, sort_order, metadata_json, created_at, updated_at)
VALUES ('stepdef_04', 4, 'script_blueprint', '04 — Script Blueprint Builder', 'Blueprint', 'script_development', 'Builds the narrative structural blueprint.', 'script_blueprint', 1, 1, 'Map', 4, '{}', datetime('now'), datetime('now'));

-- Step 05
INSERT OR IGNORE INTO workflow_step_definitions (id, step_number, step_key, title, short_label, phase, description, output_artifact_type, review_required, is_enabled, icon_name, sort_order, metadata_json, created_at, updated_at)
VALUES ('stepdef_05', 5, 'script_version_generator', '05 — Script Version Generator', 'Drafts', 'script_development', 'Generates multiple script versions based on the blueprint.', 'script_versions', 1, 1, 'FilePen', 5, '{}', datetime('now'), datetime('now'));

-- Steps 06 to 16
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

-- Dependencies
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

-- Default Settings
INSERT OR IGNORE INTO app_settings (id, setting_key, setting_value, updated_at) VALUES 
('set_1', 'default_execution_mode', 'manual_paste', datetime('now')),
('set_2', 'theme', 'dark', datetime('now'));
`;
