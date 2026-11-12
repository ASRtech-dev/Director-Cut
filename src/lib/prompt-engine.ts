import { getDb } from './database';
import { generateId } from './id-generator';
import { readSnapshot } from './snapshot-manager';
import { getHumanNotes, getEpisodeVariable } from './workflow-engine';

export interface PromptTemplatePayload {
  id: string;
  version_number: number;
  raw_text: string;
  source: string;
  scope?: 'episode' | 'channel' | 'global';
}

export interface RenderedPromptResult {
  renderedText: string;
  unresolvedPlaceholders: string[];
  segments?: Array<{
    type: 'text' | 'variable';
    name?: string;
    value?: string;
  }>;
}

export async function getLatestTemplate(stepDefId: string, episodeId?: string | null): Promise<PromptTemplatePayload | null> {
  const db = await getDb();
  
  let channelId: string | null = null;
  if (episodeId) {
    const episodes = await db.select<any[]>('SELECT channel_id FROM episodes WHERE id = $1', [episodeId]);
    if (episodes.length > 0) {
      channelId = episodes[0].channel_id || null;
    }
  }

  // 1. Try episode-specific template
  let selectedTemplate: any = null;
  let determinedScope: 'episode' | 'channel' | 'global' = 'global';

  if (episodeId) {
    const epTemplates = await db.select<any[]>(
      'SELECT id, source_doc_id FROM prompt_templates WHERE step_definition_id = $1 AND episode_id = $2 AND is_active = 1',
      [stepDefId, episodeId]
    );
    if (epTemplates.length > 0) {
      selectedTemplate = epTemplates[0];
      determinedScope = 'episode';
    }
  }

  // 2. Try channel-specific template
  if (!selectedTemplate && channelId) {
    const chanTemplates = await db.select<any[]>(
      'SELECT id, source_doc_id FROM prompt_templates WHERE step_definition_id = $1 AND channel_id = $2 AND episode_id IS NULL AND is_active = 1',
      [stepDefId, channelId]
    );
    if (chanTemplates.length > 0) {
      selectedTemplate = chanTemplates[0];
      determinedScope = 'channel';
    }
  }

  // 3. Fallback to global master template
  if (!selectedTemplate) {
    const globalTemplates = await db.select<any[]>(
      'SELECT id, source_doc_id FROM prompt_templates WHERE step_definition_id = $1 AND channel_id IS NULL AND episode_id IS NULL AND is_active = 1',
      [stepDefId]
    );
    if (globalTemplates.length > 0) {
      selectedTemplate = globalTemplates[0];
      determinedScope = 'global';
    }
  }

  if (!selectedTemplate) return null;
  const templateId = selectedTemplate.id;

  const versions = await db.select<any[]>(
    'SELECT * FROM prompt_template_versions WHERE prompt_template_id = $1 ORDER BY version_number DESC LIMIT 1',
    [templateId]
  );
  if (versions.length === 0) return null;

  return {
    id: versions[0].id,
    version_number: versions[0].version_number,
    raw_text: versions[0].raw_text || '',
    source: selectedTemplate.source_doc_id || 'unknown',
    scope: determinedScope
  };
}

export async function saveNewTemplateVersion(
  stepDefId: string,
  rawText: string,
  episodeId?: string | null,
  scope: 'episode' | 'channel' | 'global' = 'episode',
  overrideChannelId?: string | null
): Promise<void> {
  const db = await getDb();
  
  let channelId: string | null = overrideChannelId || null;
  if (!channelId && episodeId) {
    const episodes = await db.select<any[]>('SELECT channel_id FROM episodes WHERE id = $1', [episodeId]);
    if (episodes.length > 0) {
      channelId = episodes[0].channel_id || null;
    }
  }

  let templateId = '';

  if (scope === 'episode' && episodeId) {
    // Look for episode-specific template
    const rows = await db.select<any[]>(
      'SELECT id FROM prompt_templates WHERE step_definition_id = $1 AND episode_id = $2',
      [stepDefId, episodeId]
    );
    if (rows.length > 0) {
      templateId = rows[0].id;
    } else {
      // Create new episode-specific template
      templateId = generateId('ptpl');
      const stepRow = await db.select<any[]>('SELECT step_number, step_key, title FROM workflow_step_definitions WHERE id = $1', [stepDefId]);
      const stepNum = stepRow[0]?.step_number || 1;
      const stepKey = stepRow[0]?.step_key || '';
      const title = `${stepRow[0]?.title || 'Override'} (Episode Override)`;
      await db.execute(
        `INSERT INTO prompt_templates (id, step_definition_id, step_number, step_key, title, source_doc_id, channel_id, episode_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 1, $9, $10)`,
        [templateId, stepDefId, stepNum, stepKey, title, 'local_edit', channelId, episodeId, new Date().toISOString(), new Date().toISOString()]
      );
    }
  } else if (scope === 'channel' && channelId) {
    // Look for channel-specific template
    const rows = await db.select<any[]>(
      'SELECT id FROM prompt_templates WHERE step_definition_id = $1 AND channel_id = $2 AND episode_id IS NULL',
      [stepDefId, channelId]
    );
    if (rows.length > 0) {
      templateId = rows[0].id;
    } else {
      // Create new channel-specific template
      templateId = generateId('ptpl');
      const stepRow = await db.select<any[]>('SELECT step_number, step_key, title FROM workflow_step_definitions WHERE id = $1', [stepDefId]);
      const stepNum = stepRow[0]?.step_number || 1;
      const stepKey = stepRow[0]?.step_key || '';
      const title = `${stepRow[0]?.title || 'Override'} (Channel Override)`;
      await db.execute(
        `INSERT INTO prompt_templates (id, step_definition_id, step_number, step_key, title, source_doc_id, channel_id, episode_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, 1, $8, $9)`,
        [templateId, stepDefId, stepNum, stepKey, title, 'local_edit', channelId, new Date().toISOString(), new Date().toISOString()]
      );
    }
  } else {
    // Global scope
    const rows = await db.select<any[]>(
      'SELECT id FROM prompt_templates WHERE step_definition_id = $1 AND channel_id IS NULL AND episode_id IS NULL',
      [stepDefId]
    );
    if (rows.length > 0) {
      templateId = rows[0].id;
    } else {
      // Create global template fallback
      templateId = generateId('ptpl');
      const stepRow = await db.select<any[]>('SELECT step_number, step_key, title FROM workflow_step_definitions WHERE id = $1', [stepDefId]);
      const stepNum = stepRow[0]?.step_number || 1;
      const stepKey = stepRow[0]?.step_key || '';
      const title = `${stepRow[0]?.title || 'Template'}`;
      await db.execute(
        `INSERT INTO prompt_templates (id, step_definition_id, step_number, step_key, title, source_doc_id, channel_id, episode_id, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, 1, $7, $8)`,
        [templateId, stepDefId, stepNum, stepKey, title, 'local_edit', new Date().toISOString(), new Date().toISOString()]
      );
    }
  }

  const versions = await db.select<any[]>(
    'SELECT MAX(version_number) as max_v FROM prompt_template_versions WHERE prompt_template_id = $1',
    [templateId]
  );
  const maxVersion = versions[0]?.max_v || 0;
  const nextVersion = maxVersion + 1;

  // Update source to local_edit
  await db.execute('UPDATE prompt_templates SET source_doc_id = $1, updated_at = $2 WHERE id = $3', ['local_edit', new Date().toISOString(), templateId]);

  const versionId = generateId('ptplv');
  await db.execute(
    `INSERT INTO prompt_template_versions (id, prompt_template_id, version_number, content_hash, local_cache_path, raw_text, status, imported_at, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [versionId, templateId, nextVersion, 'hash', 'in_db', rawText, 'active', new Date().toISOString(), new Date().toISOString()]
  );
}

export async function renderPrompt(episodeId: string, stepRunId: string, rawText: string): Promise<RenderedPromptResult> {
  const db = await getDb();
  
  const runData = await db.select<any[]>('SELECT step_number FROM workflow_step_runs WHERE id = $1', [stepRunId]);
  const stepNumber = runData[0]?.step_number || 1;
  
  const rawHumanNotes = await getHumanNotes(episodeId, stepNumber);
  const humanNotes = rawHumanNotes.trim();
  
  const unresolvedPlaceholders: string[] = [];

  // Clean Turndown escaped brackets
  let processedText = rawText.replace(/\\\[/g, '[').replace(/\\\]/g, ']');

  const fallbackNotes = humanNotes || 'No human editorial decisions provided.';

  // Map long Google Doc phrases to standard placeholders
  const phraseMappings: Record<string, string> = {
    '[INSERT TOPIC, WORK, PERSON, FILM, BOOK, GAME, SERIES, EVENT, TECHNOLOGY, CULTURAL PHENOMENON, OR QUESTION HERE]': '[EPISODE_TOPIC]',
    '[INSERT PRIMARY WORK / VERSION / EDITION / FILM / TEXT / GAME / ADAPTATION / CASE STUDY]': '[PRIMARY_WORK]',
    '[INSERT LANGUAGE AND REGION]': '[LANGUAGE_REGION]',
    '[INSERT TARGET AUDIENCE: general audience, fans of the work, literary audience, film audience, technology audience, Spanish-speaking audience, Turkish-speaking audience, etc.]': '[TARGET_AUDIENCE]',
    '[INSERT CHANNEL STYLE, FOR EXAMPLE: intelligent, stylish, darkly funny, emotionally precise, cinematic, culturally analytical, elegant, critical, intimate, etc.]': '[DESIRED_TONE]',
    '[ALLOWED / NOT ALLOWED / PARTIAL / UNKNOWN]': '[SPOILER_POLICY]',
    '[PRIMARY VERSION ONLY / CONTROLLED CONTRAST / ADAPTATION-CENTERED / INCLUDE MAJOR ADAPTATIONS / UNKNOWN]': '[ADAPTATION_POLICY]',
    '[FAST OVERVIEW / STANDARD RESEARCH BRIEF / DEEP RESEARCH DOSSIER]': '[RESEARCH_DEPTH]',
    '[PASTE NOTES, LINKS, BOOK EXCERPTS, REVIEWS, TRANSCRIPTS, SCENE NOTES, ARTICLES, OR PREVIOUS RESEARCH HERE]': '[INITIAL_NOTES]',
    '[INSERT ANYTHING THE HUMAN TEAM IS CURIOUS ABOUT]': '[HUMAN_CURIOSITY]',
    '[PASTE RESEARCH BRIEF HERE]': '[RESEARCH_BRIEF]',
    '[INSERT CHANNEL STYLE / TARGET LANGUAGE / TARGET REGION / DESIRED TONE / AUDIENCE / SPOILER POLICY / ADAPTATION PRIORITY]': '[EPISODE_METADATA]',
    '[INSERT CHANNEL IDENTITY / TARGET LANGUAGE / TARGET REGION / DESIRED TONE / AUDIENCE / STRATEGIC GOALS]': '[EPISODE_METADATA]',
    
    // Steps 01-05 notes mappings
    '[INSERT THE ANGLE YOU CHOSE / ANY HUMAN OVERRIDES / WHAT YOU WANT TO KEEP OR AVOID]': fallbackNotes,
    '[INSERT CHANNEL STYLE, TONE, PREFERENCES, OR "USE RECOMMENDED NARRATOR MODE"]': fallbackNotes,
    '[INSERT ANY HUMAN DECISIONS, PREFERENCES, RED FLAGS, LINES TO KEEP, LINES TO AVOID, OR STYLE NOTES]': fallbackNotes,

    // Steps 06-08 mappings
    '[PASTE SCRIPT BLUEPRINT HERE]': '[SCRIPT_BLUEPRINT]',
    '[PASTE FULL VERSION A HERE]': '[SCRIPT_VERSIONS]',
    '[PASTE FULL VERSION B HERE]': '(Included in Script Versions above)',
    '[PASTE FULL VERSION C HERE]': '(Included in Script Versions above)',
    '[PASTE FULL OUTPUT FROM MASTER PROMPT 6 HERE]': '[MULTI_AGENT_SCRIPT_EVALUATION]',
    '[INSERT HUMAN DECISIONS HERE]': fallbackNotes,
    '[PASTE FULL MASTER CUT SCRIPT HERE]': '[MASTER_CUT_SCRIPT]',
    '[PASTE POST-CUT NOTES HERE]': fallbackNotes,
    '[INSERT HUMAN DECISIONS, LINES TO KEEP, LINES TO REMOVE, TONE PREFERENCES, TARGET AUDIENCE, CHANNEL VOICE, CONCERNS, OR FINAL POLISH GOALS]': fallbackNotes,
    '[INSERT ANY HUMAN NOTES, CHANNEL VOICE PRIORITIES, THINGS TO KEEP, THINGS TO AVOID, TARGET AUDIENCE, LANGUAGE, REGION, STYLE PREFERENCES]': fallbackNotes,
    
    // Steps 09-12 mappings
    '[PASTE FINAL POLISHED SCRIPT HERE]': '[FINAL_POLISHED_SCRIPT]',
    '[PASTE VISUAL LOGIC MAP HERE]': '[SCRIPT_BLUEPRINT]',
    '[INSERT VISUAL STYLE, CHANNEL AESTHETIC, EDITING PACE, IMAGE SOURCES, WHETHER TO USE FILM CLIPS, AI IMAGES, ARCHIVAL MATERIAL, TEXT ON SCREEN, MOTION GRAPHICS, SYMBOLIC IMAGERY, ETC.]': fallbackNotes,
    '[INSERT ANY RULES ABOUT USING COPYRIGHTED FILM CLIPS, PUBLIC DOMAIN IMAGES, AI-GENERATED IMAGES, STOCK FOOTAGE, ORIGINAL GRAPHICS, ETC.]': fallbackNotes,
    '[PASTE TOPIC HERE]': '[EPISODE_TOPIC]',
    '[PASTE FINAL THESIS HERE]': '[ANGLE_EVALUATOR_OUTPUT]',
    '[PASTE TARGET AUDIENCE HERE]': '[TARGET_AUDIENCE]',
    '[PASTE DESIRED TONE HERE]': fallbackNotes,
    '[SPANISH / TURKISH / ENGLISH / OTHER]': '[LANGUAGE_REGION]',
    '[PASTE THE FULL FINAL POLISHED SCRIPT HERE]': '[FINAL_POLISHED_SCRIPT]',
    '[PASTE VOICE PRODUCTION PLAN HERE]': '[VOICE_PRODUCTION_PLAN]',
    '[PASTE AI NARRATION GENERATION PLAN HERE]': '[AI_NARRATION_GENERATION_PLAN]',
    '[ADD TOOLS]': fallbackNotes,
    '[PASTE FILE LIST HERE]': fallbackNotes,
    '[PASTE KNOWN ISSUES HERE]': fallbackNotes,
    
    // Steps 13-16 mappings
    '[PASTE VISUAL PRODUCTION PLAN HERE]': '[VISUAL_LAYER_PLAN]',
    '[PASTE STYLE REFERENCES HERE]': fallbackNotes,
    '[PASTE VISUAL STYLE HERE]': fallbackNotes,
    '[PASTE NARRATION BLOCKS HERE]': '[VOICE_PRODUCTION_PLAN]',
    '[PASTE AUDIO MASTER PLAN HERE]': '[AUDIO_CLEANUP_PODCAST_MASTER_PLAN]',
    '[PASTE ASSET SOURCING PLAN HERE]': '[ASSET_SOURCING_RIGHTS_CHECK_PLAN]',
    '[PASTE ASSET LIST HERE]': fallbackNotes,
    '[PASTE FINAL TRANSCRIPT HERE]': '[FINAL_POLISHED_SCRIPT]',
    '[PASTE LONG-FORM VIDEO ASSEMBLY PLAN HERE]': '[LONGFORM_VIDEO_ASSEMBLY_PLAN]',
    '[PASTE VIDEO SECTIONS / TIMESTAMPS HERE]': fallbackNotes,
    '[PASTE TITLE / THUMBNAIL IDEAS HERE]': fallbackNotes,
    '[PASTE DURATION HERE]': fallbackNotes,
    '[PASTE EXPORT DETAILS HERE]': fallbackNotes,
    '[PASTE PODCAST EXPORT DETAILS HERE]': fallbackNotes,
    '[PASTE DERIVATIVES PACKAGE PLAN HERE]': '[DERIVATIVES_PACKAGE_PLAN]',
    '[PASTE FINAL METADATA HERE]': fallbackNotes,
    '[PASTE KNOWN CONCERNS HERE]': fallbackNotes
  };

  for (const [phrase, standardPlaceholder] of Object.entries(phraseMappings)) {
    processedText = processedText.replace(phrase, standardPlaceholder);
  }

  
  // 1. Fetch Episode Variables
  const episodes = await db.select<any[]>('SELECT * FROM episodes WHERE id = $1', [episodeId]);
  const ep = episodes[0];
  
  const finalThesisVal = await getEpisodeVariable(episodeId, 'final_thesis');
  const narratorModeVal = await getEpisodeVariable(episodeId, 'narrator_mode');
  
  let outroTemplateVal = 'No outro template defined.';
  let sponsorGuidelinesVal = 'No sponsor guidelines defined.';
  if (ep?.channel_id) {
    const channelRows = await db.select<any[]>('SELECT outro_template, sponsor_guidelines FROM channels WHERE id = $1', [ep.channel_id]);
    if (channelRows.length > 0) {
      outroTemplateVal = channelRows[0].outro_template || outroTemplateVal;
      sponsorGuidelinesVal = channelRows[0].sponsor_guidelines || sponsorGuidelinesVal;
    }
  }
  
  const context: Record<string, string> = {
    'EPISODE_TOPIC': ep?.topic || 'Unknown Topic',
    'PRIMARY_WORK': ep?.primary_work || 'N/A',
    'LANGUAGE_REGION': `${ep?.target_language || 'EN'}-${ep?.target_region || 'US'}`,
    'TARGET_AUDIENCE': ep?.target_audience || 'General',
    'DESIRED_TONE': ep?.desired_tone || 'Professional',
    'INITIAL_NOTES': humanNotes || 'No initial notes.',
    'SPOILER_POLICY': 'ALLOWED',
    'ADAPTATION_POLICY': 'INCLUDE MAJOR ADAPTATIONS',
    'RESEARCH_DEPTH': 'DEEP RESEARCH DOSSIER',
    'HUMAN_CURIOSITY': 'None.',
    'EPISODE_METADATA': `Style: ${ep?.desired_tone || 'Professional'} | Language: ${ep?.target_language || 'EN'}-${ep?.target_region || 'US'}${humanNotes ? `\nAdditional human preferences:\n${humanNotes}` : ''}`,
    'FINAL_THESIS': finalThesisVal || 'No final thesis approved yet.',
    'NARRATOR_MODE': narratorModeVal || 'No narrator mode selected yet.',
    'CHANNEL_OUTRO': outroTemplateVal,
    'SPONSOR_GUIDELINES': sponsorGuidelinesVal
  };

  // Step 01 Research Notes — available to all downstream steps (especially Step 02)
  const researchNotes = await getHumanNotes(episodeId, 1);
  context['RESEARCH_NOTES'] = researchNotes.trim() || 'No research notes provided.';

  // 2. Resolve Upstream Artifacts
  const ARTIFACT_PLACEHOLDER_MAP: Record<string, string> = {
    'RESEARCH_BRIEF': 'research_brief',
    'ANGLE_GENERATOR_OUTPUT': 'angle_generator_output',
    'ANGLE_EVALUATOR_OUTPUT': 'angle_evaluator_output',
    'SCRIPT_BLUEPRINT': 'script_blueprint',
    'SCRIPT_VERSIONS': 'script_versions',
    'MULTI_AGENT_SCRIPT_EVALUATION': 'multi_agent_script_evaluation',
    'MASTER_CUT_SCRIPT': 'master_cut_script',
    'FINAL_POLISHED_SCRIPT': 'final_polished_script',
    'VISUAL_LAYER_PLAN': 'visual_layer_plan',
    'VOICE_PRODUCTION_PLAN': 'voice_production_plan',
    'AI_NARRATION_GENERATION_PLAN': 'ai_narration_generation_plan',
    'AUDIO_CLEANUP_PODCAST_MASTER_PLAN': 'audio_cleanup_podcast_master_plan',
    'ASSET_SOURCING_RIGHTS_CHECK_PLAN': 'asset_sourcing_rights_check_plan',
    'LONGFORM_VIDEO_ASSEMBLY_PLAN': 'longform_video_assembly_plan',
    'DERIVATIVES_PACKAGE_PLAN': 'derivatives_package_plan',
    'FINAL_QA_EXPORT_PUBLISH_PLAN': 'final_qa_export_publish_plan'
  };

  const placeholderRegex = /\[([A-Z_]+)\]/g;
  let match;
  const placeholders = new Set<string>();
  while ((match = placeholderRegex.exec(processedText)) !== null) {
    placeholders.add(match[1]);
  }

  for (const p of placeholders) {
    if (context[p]) continue; // Already resolved via context

    if (ARTIFACT_PLACEHOLDER_MAP[p]) {
      const artifactType = ARTIFACT_PLACEHOLDER_MAP[p];
      // Find the approved version for this artifact type in this episode
      const artifacts = await db.select<any[]>(
        `SELECT a.approved_version_id FROM artifacts a 
         WHERE a.episode_id = $1 AND a.artifact_type = $2 AND a.status = 'approved'`,
        [episodeId, artifactType]
      );
      
      if (artifacts.length > 0 && artifacts[0].approved_version_id) {
        const versionId = artifacts[0].approved_version_id;
        const versions = await db.select<any[]>('SELECT local_snapshot_path FROM artifact_versions WHERE id = $1', [versionId]);
        if (versions.length > 0) {
          try {
            const content = await readSnapshot(versions[0].local_snapshot_path);
            context[p] = content;
            continue;
          } catch (e) {
            console.error(`Failed to read snapshot for ${p}`, e);
          }
        }
      }
    }
    
    // If not resolved
    unresolvedPlaceholders.push(p);
  }

  let renderedText = processedText;
  for (const [key, value] of Object.entries(context)) {
    renderedText = renderedText.replace(new RegExp(`\\[${key}\\]`, 'g'), () => value);
  }

  // Generate structural segments for the front-end to render interactively
  const segments: Array<{ type: 'text' | 'variable'; name?: string; value?: string }> = [];
  const parts = processedText.split(/(\[[A-Z_]+\])/g);
  for (const part of parts) {
    if (part.startsWith('[') && part.endsWith(']')) {
      const key = part.slice(1, -1);
      const val = context[key] !== undefined ? context[key] : part;
      segments.push({
        type: 'variable',
        name: key,
        value: val
      });
    } else if (part) {
      segments.push({
        type: 'text',
        value: part
      });
    }
  }

  return {
    renderedText,
    unresolvedPlaceholders,
    segments
  };
}
