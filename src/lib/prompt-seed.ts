import { getDb } from './database';
import { generateId } from './id-generator';

import raw01 from '../prompts/seed/01 — RESEARCH BRIEF BUILDER.md?raw';
import raw02 from '../prompts/seed/02 — ANGLE & THESIS GENERATOR.md?raw';
import raw03 from '../prompts/seed/03 — ANGLE EVALUATOR.md?raw';
import raw04 from '../prompts/seed/04 — SCRIPT BLUEPRINT BUILDER.md?raw';
import raw05 from '../prompts/seed/05 — SCRIPT VERSION GENERATOR.md?raw';
import raw06 from '../prompts/seed/06 — MULTI-AGENT SCRIPT EVALUATOR.md?raw';
import raw07 from '../prompts/seed/07 — MASTER CUT BUILDER.md?raw';
import raw08 from '../prompts/seed/08 — LAYERED REWRITE & FINAL POLISH.md?raw';
import raw09 from '../prompts/seed/09 — Visual Layer Builder.md?raw';
import raw10 from '../prompts/seed/10 — Voice Production Plan.md?raw';
import raw11 from '../prompts/seed/11 — AI Narration Generation.md?raw';
import raw12 from '../prompts/seed/12 — Audio Cleanup & Podcast Master.md?raw';
import raw13 from '../prompts/seed/13 — Asset Sourcing & Rights Check.md?raw';
import raw14 from '../prompts/seed/14 — Long-Form Video Assembly.md?raw';
import raw15 from '../prompts/seed/15 — Derivatives Package.md?raw';
import raw16 from '../prompts/seed/16 — Final QA, Export & Publish.md?raw';

const SEED_PROMPTS = [
  { step_def_id: 'stepdef_01', text: raw01 },
  { step_def_id: 'stepdef_02', text: raw02 },
  { step_def_id: 'stepdef_03', text: raw03 },
  { step_def_id: 'stepdef_04', text: raw04 },
  { step_def_id: 'stepdef_05', text: raw05 },
  { step_def_id: 'stepdef_06', text: raw06 },
  { step_def_id: 'stepdef_07', text: raw07 },
  { step_def_id: 'stepdef_08', text: raw08 },
  { step_def_id: 'stepdef_09', text: raw09 },
  { step_def_id: 'stepdef_10', text: raw10 },
  { step_def_id: 'stepdef_11', text: raw11 },
  { step_def_id: 'stepdef_12', text: raw12 },
  { step_def_id: 'stepdef_13', text: raw13 },
  { step_def_id: 'stepdef_14', text: raw14 },
  { step_def_id: 'stepdef_15', text: raw15 },
  { step_def_id: 'stepdef_16', text: raw16 }
];

const PLACEHOLDER_TEMPLATES = [
  { step_def_id: 'stepdef_01', step_number: 1, step_key: 'research_brief', title: 'Research Brief Builder Template', text: `Act as a research analyst. Create a Research Brief for:\nTopic: [EPISODE_TOPIC]\nPrimary work: [PRIMARY_WORK]\nLanguage/region: [LANGUAGE_REGION]\nTone: [DESIRED_TONE]\nInitial notes: [INITIAL_NOTES]` },
  { step_def_id: 'stepdef_02', step_number: 2, step_key: 'angle_generator', title: 'Angle & Thesis Generator Template', text: `Use the approved Research Brief below to generate 3 video essay angles:\n\n[RESEARCH_BRIEF]\n\nResearch Notes / Human Highlights:\n[RESEARCH_NOTES]` },
  { step_def_id: 'stepdef_03', step_number: 3, step_key: 'angle_evaluator', title: 'Angle Evaluator Template', text: `Evaluate the following angles against our channel strategy:\n\n[ANGLE_GENERATOR_OUTPUT]` },
  { step_def_id: 'stepdef_04', step_number: 4, step_key: 'script_blueprint', title: 'Script Blueprint Builder Template', text: `Build a narrative structural blueprint using the approved angle from:\n[ANGLE_EVALUATOR_OUTPUT]\n\nResearch Context:\n[RESEARCH_BRIEF]` },
  { step_def_id: 'stepdef_05', step_number: 5, step_key: 'script_version_generator', title: 'Script Version Generator Template', text: `Generate a draft script based on the following blueprint:\n\n[SCRIPT_BLUEPRINT]` },
  { step_def_id: 'stepdef_06', step_number: 6, step_key: 'multi_agent_script_evaluator', title: 'Multi-Agent Evaluator Template', text: `Evaluate these drafts: [SCRIPT_VERSIONS]` },
  { step_def_id: 'stepdef_07', step_number: 7, step_key: 'master_cut_builder', title: 'Master Cut Builder Template', text: `Build master cut from evaluation: [MULTI_AGENT_SCRIPT_EVALUATION]` },
  { step_def_id: 'stepdef_08', step_number: 8, step_key: 'final_polish', title: 'Final Polish Template', text: `Polish this master cut: [MASTER_CUT_SCRIPT]` },
  { step_def_id: 'stepdef_09', step_number: 9, step_key: 'visual_layer_builder', title: 'Visual Layer Builder Template', text: `Build visual plan for: [FINAL_POLISHED_SCRIPT]` },
  { step_def_id: 'stepdef_10', step_number: 10, step_key: 'voice_production_plan', title: 'Voice Production Plan Template', text: `Plan voice acting for: [FINAL_POLISHED_SCRIPT]` },
  { step_def_id: 'stepdef_11', step_number: 11, step_key: 'ai_narration_generation', title: 'AI Narration Generation Template', text: `Generate AI voice config for: [VOICE_PRODUCTION_PLAN]` },
  { step_def_id: 'stepdef_12', step_number: 12, step_key: 'audio_cleanup_podcast_master', title: 'Audio Cleanup Template', text: `Audio cleanup instructions for: [AI_NARRATION_GENERATION_PLAN]` },
  { step_def_id: 'stepdef_13', step_number: 13, step_key: 'asset_sourcing_rights_check', title: 'Asset Sourcing Template', text: `Rights check for visuals: [VISUAL_LAYER_PLAN]` },
  { step_def_id: 'stepdef_14', step_number: 14, step_key: 'longform_video_assembly', title: 'Video Assembly Template', text: `Assemble video using: [ASSET_SOURCING_RIGHTS_CHECK_PLAN]` },
  { step_def_id: 'stepdef_15', step_number: 15, step_key: 'derivatives_package', title: 'Derivatives Package Template', text: `Create derivatives from: [LONGFORM_VIDEO_ASSEMBLY_PLAN]` },
  { step_def_id: 'stepdef_16', step_number: 16, step_key: 'final_qa_export_publish', title: 'Final QA Template', text: `QA checklist for: [DERIVATIVES_PACKAGE_PLAN]` }
];

export async function seedPromptTemplates() {
  const db = await getDb();
  
  for (const tpl of PLACEHOLDER_TEMPLATES) {
    const existing = await db.select<any[]>('SELECT id FROM prompt_templates WHERE step_definition_id = $1', [tpl.step_def_id]);
    
    if (existing.length === 0) {
      const templateId = generateId('ptpl');
      await db.execute(
        `INSERT INTO prompt_templates (id, step_definition_id, step_number, step_key, title, source_doc_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [templateId, tpl.step_def_id, tpl.step_number, tpl.step_key, tpl.title, 'local_placeholder', 1, new Date().toISOString(), new Date().toISOString()]
      );
      
      const versionId = generateId('ptplv');
      await db.execute(
        `INSERT INTO prompt_template_versions (id, prompt_template_id, version_number, content_hash, local_cache_path, raw_text, status, imported_at, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [versionId, templateId, 1, 'hash', 'in_db', tpl.text, 'active', new Date().toISOString(), new Date().toISOString()]
      );
    }
  }
}

export async function importSeedPrompts(): Promise<number> {
  const db = await getDb();
  let importedCount = 0;

  for (const tpl of SEED_PROMPTS) {
    if (!tpl.text) continue;

    const templates = await db.select<any[]>('SELECT id FROM prompt_templates WHERE step_definition_id = $1', [tpl.step_def_id]);
    if (templates.length === 0) continue;
    const templateId = templates[0].id;

    // Update source
    await db.execute(
      'UPDATE prompt_templates SET source_doc_id = $1, updated_at = $2 WHERE id = $3',
      ['local_seed_from_google_docs', new Date().toISOString(), templateId]
    );

    const versions = await db.select<any[]>('SELECT version_number FROM prompt_template_versions WHERE prompt_template_id = $1', [templateId]);
    const nextVersion = versions.length + 1;

    const versionId = generateId('ptplv');
    await db.execute(
      `INSERT INTO prompt_template_versions (id, prompt_template_id, version_number, content_hash, local_cache_path, raw_text, status, imported_at, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [versionId, templateId, nextVersion, 'seed_hash', 'in_db', tpl.text, 'active', new Date().toISOString(), new Date().toISOString()]
    );
    
    importedCount++;
  }

  return importedCount;
}
