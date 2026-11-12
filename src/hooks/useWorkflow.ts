import { useState, useEffect, useCallback } from 'react';
import { initDatabase, getDb } from '../lib/database';
import { 
  initProjectAndEpisode, 
  getStepRuns, 
  saveCandidate, 
  approveCandidate,
  rejectCandidate,
  getSelectedArtifactVersion,
  getArtifactVersions,
  getHumanNotes,
  saveHumanNotes,
  getEpisodeVariable,
  ArtifactVersionPayload 
} from '../lib/workflow-engine';
import { 
  getLatestTemplate, 
  renderPrompt, 
  saveNewTemplateVersion, 
  PromptTemplatePayload, 
  RenderedPromptResult 
} from '../lib/prompt-engine';
import { WorkflowStepRun, WorkflowState, Episode } from '../types';
import { getEpisode, updateEpisode } from '../lib/episode-service';

/**
 * Self-healing: Step 01 must NEVER be blocked. If the DB has it as blocked,
 * fix it in-place before the UI ever sees it.
 */
async function ensureStep01NotBlocked(runs: WorkflowStepRun[]): Promise<WorkflowStepRun[]> {
  const step1 = runs.find(r => r.step_number === 1);
  if (step1 && step1.state === 'blocked') {
    console.warn('[useWorkflow] Step 01 was blocked — repairing to ready');
    try {
      const db = await getDb();
      await db.execute(
        "UPDATE workflow_step_runs SET state = 'ready', updated_at = $1 WHERE id = $2",
        [new Date().toISOString(), step1.id]
      );
      step1.state = 'ready' as WorkflowState;
    } catch (e) {
      console.error('[useWorkflow] Failed to repair Step 01:', e);
    }
  }
  return runs;
}

export function useWorkflow(episodeId: string | null) {
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeStep, setActiveStep] = useState(1);
  const [stepRuns, setStepRuns] = useState<WorkflowStepRun[]>([]);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactVersionPayload | null>(null);
  const [artifactVersions, setArtifactVersions] = useState<ArtifactVersionPayload[]>([]);
  
  const [activeTemplate, setActiveTemplate] = useState<PromptTemplatePayload | null>(null);
  const [renderedPrompt, setRenderedPrompt] = useState<RenderedPromptResult | null>(null);
  const [humanNotes, setHumanNotes] = useState<string>('');
  const [finalThesis, setFinalThesis] = useState<string>('');
  const [narratorMode, setNarratorMode] = useState<string>('');

  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);

  const stepStates = stepRuns.reduce((acc, run) => {
    acc[run.step_number] = run.state;
    return acc;
  }, {} as Record<number, WorkflowState>);

  const loadState = useCallback(async (currentStep: number, epId: string) => {
    console.log(`[useWorkflow] loadState called for step ${currentStep}, episode ${epId}`);
    try {
      const epDetails = await getEpisode(epId);
      setActiveEpisode(epDetails);

      const thesisVal = await getEpisodeVariable(epId, 'final_thesis');
      const narratorVal = await getEpisodeVariable(epId, 'narrator_mode');
      setFinalThesis(thesisVal);
      setNarratorMode(narratorVal);

      let runs = await getStepRuns(epId);
      runs = await ensureStep01NotBlocked(runs);
      setStepRuns(runs);
      
      const currentRun = runs.find(r => r.step_number === currentStep);
      if (currentRun) {
        const versions = await getArtifactVersions(currentRun.id);
        setArtifactVersions(versions);

        if (currentRun.selected_artifact_version_id) {
          const artifact = await getSelectedArtifactVersion(currentRun.id);
          setActiveArtifact(artifact);
        } else {
          setActiveArtifact(null);
        }

        const loadedNotes = await getHumanNotes(epId, currentStep);
        setHumanNotes(loadedNotes);

        const template = await getLatestTemplate(currentRun.step_definition_id, epId);
        setActiveTemplate(template);
        if (template) {
          const rendered = await renderPrompt(epId, currentRun.id, template.raw_text);
          setRenderedPrompt(rendered);
        } else {
          setRenderedPrompt(null);
        }
      } else {
        setArtifactVersions([]);
        setActiveArtifact(null);
        setActiveTemplate(null);
        setRenderedPrompt(null);
        setHumanNotes('');
      }
    } catch (err) {
      console.error("[useWorkflow] FAILED to load workflow state:", err);
    }
  }, []);

  const handleVersionSelect = async (versionId: string) => {
    const currentRun = stepRuns.find(r => r.step_number === activeStep);
    if (!currentRun) return;
    try {
      const artifact = await getSelectedArtifactVersion(currentRun.id, versionId);
      setActiveArtifact(artifact);
    } catch (err) {
      console.error("Failed to fetch version content", err);
    }
  };

  const handleSaveTemplate = async (newText: string, scope: 'episode' | 'channel' | 'global' = 'episode') => {
    const currentRun = stepRuns.find(r => r.step_number === activeStep);
    if (!currentRun || !episodeId) return;
    try {
      await saveNewTemplateVersion(currentRun.step_definition_id, newText, episodeId, scope);
      await loadState(activeStep, episodeId);
    } catch (err) {
      console.error("Failed to save template", err);
    }
  };

  const handleSaveHumanNotes = async (notesText: string) => {
    if (!episodeId) return;
    try {
      await saveHumanNotes(episodeId, activeStep, notesText);
      await loadState(activeStep, episodeId);
    } catch (err) {
      console.error("Failed to save human notes", err);
    }
  };

  const handleUpdateEpisode = async (fields: any) => {
    if (!episodeId) return;
    try {
      await updateEpisode(episodeId, fields);
      await loadState(activeStep, episodeId);
    } catch (err) {
      console.error("Failed to update episode fields", err);
    }
  };

  const [initError, setInitError] = useState<string | null>(null);

  // Initialize DB on first mount
  useEffect(() => {
    async function init() {
      try {
        console.log('[useWorkflow] Starting initialization...');
        await initDatabase();
        await initProjectAndEpisode();
        console.log('[useWorkflow] Initialization complete.');
      } catch (err: any) {
        console.error("[useWorkflow] Initialization FAILED:", err);
        setInitError(typeof err === 'string' ? err : err.message || JSON.stringify(err) || 'Unknown init error');
      } finally {
        setIsInitializing(false);
      }
    }
    init();
  }, []);

  const [prevEpisodeId, setPrevEpisodeId] = useState<string | null>(null);
  if (episodeId !== prevEpisodeId) {
    setPrevEpisodeId(episodeId);
    setActiveStep(1);
  }

  // Load state when episode or step changes
  useEffect(() => {
    if (!isInitializing && episodeId) {
      loadState(activeStep, episodeId);
    }
  }, [episodeId, activeStep, isInitializing, loadState]);

  const handleStepChange = (stepId: number) => {
    if (stepStates[stepId] && stepStates[stepId] !== 'blocked') {
      setActiveStep(stepId);
    }
  };

  const handleAction = async (stepId: number, action: 'save_candidate' | 'approve' | 'reject', content?: string) => {
    if (!episodeId) return;
    const run = stepRuns.find(r => r.step_number === stepId);
    if (!run) return;

    try {
      if (action === 'save_candidate') {
        if (!content) throw new Error("Content required to save candidate");
        await saveCandidate(episodeId, run.id, content, renderedPrompt?.renderedText);
      } else if (action === 'approve') {
        await approveCandidate(episodeId, run.id, activeArtifact?.id);
        await loadState(stepId, episodeId);
        if (stepId < 16) {
          setActiveStep(stepId + 1);
        }
        return;
      } else if (action === 'reject') {
        await rejectCandidate(episodeId, run.id, activeArtifact?.id);
      }
      await loadState(stepId, episodeId);
    } catch (err) {
      console.error(`[useWorkflow] Action FAILED: ${action}`, err);
    }
  };

  const refreshState = () => { if (episodeId) loadState(activeStep, episodeId); };

  return {
    isInitializing,
    initError,
    activeStep,
    stepStates,
    activeEpisode,
    activeArtifact,
    artifactVersions,
    activeTemplate,
    renderedPrompt,
    humanNotes,
    finalThesis,
    narratorMode,
    handleVersionSelect,
    handleSaveTemplate,
    handleSaveHumanNotes,
    handleUpdateEpisode,
    handleStepChange,
    handleAction,
    refreshState
  };
}
